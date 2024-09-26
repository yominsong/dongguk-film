from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from utility.msg import send_msg
from utility.hangul import encode_hangul_to_url, decode_url_to_hangul
from utility.utils import (
    generate_random_string,
    gpt,
    notion,
    aws_s3,
    clova_ocr,
)
from konlpy.tag import Okt
from collections import Counter
from bs4 import BeautifulSoup
import base64, ast, re

#
# Global variables
#

AWS = getattr(settings, "AWS", None)
AWS_REGION_NAME = AWS["REGION_NAME"]
AWS_S3_BUCKET_NAME = AWS["S3"]["BUCKET_NAME"]

#
# Sub functions
#


def is_readable(content: str):
    img_list = find_in_content("img_list", content)
    img_alt_list = find_in_content("img_alt_list", content)

    if len(img_list) == len(img_alt_list):
        result = True
    else:
        result = False

    return result


def is_description_text_included(content: str):
    img_list = find_in_content("img_list", content)
    str_list = find_in_content("str_list", content)

    if len(img_list) != 0 and len(str_list) == 0:
        result = False
    else:
        result = True

    return result


def is_not_swearing(title_or_content: str):
    system_message = {
        "role": "system",
        "content": """
            You are a moderation expert. You have a very short amount of time, so you must answer concisely. Your response should be in one of two formats:
            
            - If the content is safe: 'False'
            - If the content is problematic: 'True: [problematic expression]'
        """,
    }

    user_message = {
        "role": "user",
        "content": f"""
            {title_or_content}\n
            Could the content be construed as violent, sexually explicit, or sexist?
        """,
    }

    openai_response = gpt("4o-mini", system_message, user_message, False)
    problematic_expression = None

    if "false" in openai_response.lower():
        result = True
    elif "true" in openai_response.lower():
        result = False
        problematic_expression = openai_response.split(":")[1].strip()

    return result, problematic_expression


def evaluate_accessibility(request):
    """
    - request | `HttpRequest`:
        - content
    """

    content = request.POST["content"]

    if not is_readable(content):
        status = "FAIL"
        reason = "이미지 대체 텍스트 미입력"
        msg = "이미지 대체 텍스트를 입력해주세요."
        element = "id_content"

    elif not is_description_text_included(content):
        status = "FAIL"
        reason = "텍스트 미포함"
        msg = "내용에 텍스트를 포함해주세요."
        element = "id_content"

    else:
        status = None
        reason = None
        msg = None
        element = None

    return status, reason, msg, element


def moderate_input_data(request):
    """
    - request | `HttpRequest`:
        - title
        - content
    """

    title = request.POST["title"]
    content = re.sub(r'(<img[^>]*\s)src\s*=\s*["\'](data:image\/[^;]+;base64,)[^"\']*["\']', r'\1', request.POST["content"])
    is_safe_title, unsafe_expression_in_title = is_not_swearing(title)
    is_safe_content, unsafe_expression_in_content = is_not_swearing(content)

    if not is_safe_title:
        status = "FAIL"
        reason = f"TITLE_MODERATION_FAILED: {unsafe_expression_in_title}"
        msg = "이 제목은 사용할 수 없어요."
        element = "id_title"

    if not is_safe_content:
        status = "FAIL"
        reason = f"CONTENT_MODERATION_FAILED: {unsafe_expression_in_content}"
        msg = "내용에 적절치 않은 표현이 포함된 것 같아요."
        element = "id_content"

    else:
        status = None
        reason = None
        msg = None
        element = None

    return status, reason, msg, element


def create_hashtag(content):
    keywords = ""
    soup = BeautifulSoup(content, "html.parser")

    content = (
        " ".join(soup.stripped_strings)
        .replace("\n", " ")
        .replace("  ", " ")
        .replace("   ", " ")
    )

    system_message = {
        "role": "system",
        "content": "You are an expert at extracting keywords from text. You need to extract keywords and list them separated by hashtags as follows: #firstkeyword #secondkeyword #thirdkeyword",
    }

    user_message = {
        "role": "user",
        "content": f"Extract a minimum of one and a maximum of three keywords that penetrate the core topic of this article, and list them separated by hashtags. There must be a minimum of one and a maximum of three, and only ' ' (space) between them. Never use any symbols other than '#' (hash). {content}",
    }

    keywords = gpt("4o-mini", system_message, user_message)

    if keywords == "":
        okt = Okt()
        nouns = okt.nouns(content)
        noun_counts = Counter(nouns)
        keywords = noun_counts.most_common(3)
        keywords = [word for word, count in keywords]
        keywords = " ".join(["#" + word for word in keywords])

    return keywords


def find_in_content(target: str, content: str):
    """
    - target | `str`:
        - str
        - str_list
        - b64_img_list
        - bin_img_list
        - b64_img_src_list
        - bin_img_src_list
        - img_alt_list
    - content | `str`
    """

    soup = BeautifulSoup(content, "html.parser")

    # action: "str"
    if target == "str":
        str_generator = " ".join(soup.stripped_strings)

        result = str_generator

    # target: "str_list"
    elif target == "str_list":
        str_generator = find_in_content("str", content)

        str_list = [str for str in str_generator if str and str.strip()]

        result = str_list

    # target: "img_list"
    elif "img_list" in target:
        prefix = "data:image/" if "b64" in target else "http" if "bin" in target else ""
        img_list = soup.find_all("img")

        img_list = [
            img
            for img in img_list
            if img.has_attr("src") and img["src"].startswith(prefix)
        ]

        result = img_list

    # target: "b64_img_src_list" or "bin_img_src_list"
    elif "img_src_list" in target:
        prefix = "data:image/" if "b64" in target else "http" if "bin" in target else ""
        img_list = soup.find_all("img")

        img_src_list = [
            img["src"]
            for img in img_list
            if img.has_attr("src") and img["src"].startswith(prefix)
        ]

        result = img_src_list

    # target: "img_alt_list"
    elif target == "img_alt_list":
        img_list = soup.find_all("img")

        img_alt_list = [
            img["alt"]
            for img in img_list
            if img.has_attr("alt") and img["alt"].strip() != ""
        ]

        result = img_alt_list

    return result


def decode_b64_to_bin(b64_str):
    mime_type, encoded_data = b64_str.split(",", 1)
    bin_str = base64.b64decode(encoded_data)
    mime_type = mime_type.split(";")[0].split(":")[1].split("/")[1]

    return bin_str, mime_type


def replace_img_src_from_b64_to_bin(content, img_key_list):
    soup = BeautifulSoup(content, "html.parser")
    img_src_list = find_in_content("b64_img_src_list", content)

    for old_src, img_key in zip(img_src_list, img_key_list):
        img_key = encode_hangul_to_url(img_key)
        new_src = f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION_NAME}.amazonaws.com/{img_key}"
        for img in soup.find_all("img", src=old_src):
            img["src"] = new_src

    new_content = str(soup)

    return new_content


def extract_text_from_img(type, img_src):
    data = {"img_src": img_src}
    extracted_text = ""

    if type == "b64":
        response = clova_ocr("ocr", "b64_img", data)
    elif type == "bin":
        response = clova_ocr("ocr", "bin_img", data)

    if response.status_code == 200:
        ocr_passed = True
        fields = response.json()["images"][0]["fields"]

        for field in fields:
            infer_text = field.get("inferText", "")
            extracted_text += infer_text + " "

        extracted_text = extracted_text.strip()

        system_message = {
            "role": "system",
            "content": """
                You're an expert at reconstructing embedded text within images into HTML.

                Be absolutely sure to follow these points when working:
                - Reorganize the given content into HTML that starts with <div> as it appears in the image.
                - Convert as you see it, but make some configuration changes only if you think there's something that's not readable for the user.
                - Convert URLs to <a> tags so that users can click on them.
                - Do not use <head>, <body>, or <img>, and in particular, inserting images is strictly prohibited.
                - Omit logos and illustrations embedded in the image.
                - Do not arbitrarily omit any characters when converting.
                - Respond with code only, with no explanation. Do not include things like ```html'' in your answer.
            """,
        }

        user_message_content = [
            {
                "type": "text",
                "text": extracted_text,
            },
            {
                "type": "image_url",
                "image_url": {"url": img_src},
            },
        ]

        user_message = {
            "role": "user",
            "content": user_message_content,
        }

        extracted_text = gpt("4o", system_message, user_message)

        precaution = """
            <table><tbody>
                <tr><td style="background-color:hsl(0, 75%, 60%);">
                    <h3 style="text-align:center;"><span style="color:hsl(0, 0%, 100%);"><span class="s1">⚠️</span><span class="s2"> </span>유의<span class="s2"> </span>사항</span></h3>
                </td></tr>
                <tr><td>
                    <p class="p1"><span style="color:hsl(0, 0%, 30%);"><strong>다음은 디닷에프가 이미지에서 텍스트를 추출하고 재구성한 결과이며, 일부 내용이 부정확할 수 있습니다.</strong></span></p>
                    <p class="p1"><span style="color:hsl(0, 0%, 30%);"><strong>디닷에프는 작업 결과의 정확성을 보장하지 않으며, 이에 대한 책임을 지지 않습니다.</strong></span></p>
                    <p class="p2"><span style="color:hsl(0, 0%, 30%);"><strong>표 내용, 목록 순서, 들여쓰기 위치, 화살표 방향, 링크 URL 등이 올바른지 작성자의 검토가 필요합니다.</strong></span></span></p>
                </td></tr>
            </tbody></table>
        """

        extracted_text = f"{precaution}<p></p>{extracted_text}"
    else:
        ocr_passed = False

    return ocr_passed, extracted_text


def update_content_and_get_img_key_list(request):
    content = request.POST.get("content")
    b64_img_list = find_in_content("b64_img_list", content)
    bin_img_list = find_in_content("bin_img_list", content)
    img_key_list = []

    if len(b64_img_list) != 0:
        for img in b64_img_list:
            alt = img["alt"]
            src = img["src"]
            src, mime_type = decode_b64_to_bin(src)
            img_name = f"{alt}.{mime_type}".replace(" ", "_")
            img_key = f"{generate_random_string(5)}_{img_name}"

            data = {"bin": src, "name": img_name, "key": img_key}
            aws_s3("put", "object", data)
            img_key_list.append(img_key)

        content = replace_img_src_from_b64_to_bin(content, img_key_list)

    if len(bin_img_list) != 0:
        for img in bin_img_list:
            if f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION_NAME}.amazonaws.com/" in img["src"]:
                img_key = img["src"].replace(
                    f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION_NAME}.amazonaws.com/", ""
                )
                img_key_list.append(decode_url_to_hangul(img_key))

        try:
            page_id = request.POST.get("page_id")
            data = {"page_id": page_id, "property_id": "yquB"}
            old_img_key_str = notion("retrieve", "page_properties", data).json()[
                "results"
            ][0]["rich_text"]["text"]["content"]
            old_img_key_list = ast.literal_eval(old_img_key_str)

            for old_img_key in old_img_key_list:
                if old_img_key not in img_key_list:
                    data = {"key": old_img_key}
                    aws_s3("delete", "object", data)
        except:
            pass

    return content, img_key_list


def get_file(request):
    file_list = []
    file_key_list = []
    index = 0

    while request.POST.get(f"fileId_{index}") is not None:
        file = request.FILES.get(f"file_{index}", None)
        file_id = request.POST.get(f"fileId_{index}")
        file_name = request.POST.get(f"fileName_{index}")
        file_key = request.POST.get(f"fileKey_{index}")
        file_size = request.POST.get(f"fileSize_{index}")
        file_readable_size = request.POST.get(f"fileReadableSize_{index}")

        file_dict = {
            "bin": file,
            "id": file_id,
            "name": file_name,
            "key": file_key,
            "size": file_size,
            "readableSize": file_readable_size,
        }
        file_list.append(file_dict)
        file_key_list.append(file_key)
        index += 1

    id = request.POST.get("id")

    if id == "create_notice":
        for file_dict in file_list:
            data = {
                "bin": file_dict["bin"],
                "name": file_dict["name"],
                "key": file_dict["key"],
            }
            aws_s3("put", "object", data)

    elif id == "update_notice":
        page_id = request.POST.get("page_id")
        data = {"page_id": page_id, "property_id": "B%5Dhc"}
        response = notion("retrieve", "page_properties", data)

        old_file_keys = set()

        if len(response.json()["results"]) > 0:
            old_file_str = response.json()["results"][0]["rich_text"]["text"]["content"]
            if old_file_str != "[]":
                old_file_list = ast.literal_eval(old_file_str)
                old_file_keys = {file_dict["key"] for file_dict in old_file_list}

        keys_to_delete = old_file_keys - set(file_key_list)
        for key in keys_to_delete:
            aws_s3("delete", "object", data={"key": key})

        for file_dict in file_list:
            data = {
                "bin": file_dict["bin"],
                "name": file_dict["name"],
                "key": file_dict["key"],
            }
            if file_dict["key"] not in old_file_keys:
                aws_s3("put", "object", data)

    for file_dict in file_list:
        file_dict.pop("bin", None)

    return file_list


#
# Main functions
#


@login_required
def notice(request):
    """
    - request | `HttpRequest`:
        - id:
            - ocr_notice
            - create_notice
            - read_notice
            - update_notice
            - delete_notice
        - page_id
        - title
        - category
        - block_id_list
        - content
        - keyword
        - file
    """

    id = request.POST.get("id")
    page_id = request.POST.get("page_id")
    title = request.POST.get("title")
    category = request.POST.get("category")
    block_id_list = request.POST.get("block_id_list")
    content = request.POST.get("content")
    keyword = request.POST.get("keyword")

    status = None

    # id: ocr_notice
    if id == "ocr_notice":
        b64_img_src_list = find_in_content("b64_img_src_list", content)
        bin_img_src_list = find_in_content("bin_img_src_list", content)
        total_num_of_img_src = len(b64_img_src_list) + len(bin_img_src_list)
        pass_count = 0

        if len(b64_img_src_list) != 0:
            for b64_img_src in b64_img_src_list:
                ocr_passed, extracted_b64_img_text = extract_text_from_img(
                    "b64", b64_img_src
                )

                if ocr_passed:
                    pass_count += 1
                    content = f"{content}<p></p>{extracted_b64_img_text}"

        if len(bin_img_src_list) != 0:
            for bin_img_src in bin_img_src_list:
                ocr_passed, extracted_bin_img_text = extract_text_from_img(
                    "bin", bin_img_src
                )

                if ocr_passed:
                    pass_count += 1
                    content = f"{content}<p></p>{extracted_bin_img_text}"

        if pass_count != 0:
            if total_num_of_img_src != pass_count:
                status = "DONE"
                reason = f"EXTRACTING_TEXT_SUCCEEDED_FOR_{pass_count}_OUT_OF_{total_num_of_img_src}_IMAGES"
            elif total_num_of_img_src == pass_count:
                status = "DONE"
                reason = f"EXTRACTING_TEXT_SUCCEEDED_FOR_{pass_count}_IMAGES"
        elif len(b64_img_src_list) == 0 and len(bin_img_src_list) == 0:
            status = "FAIL"
            reason = "NO_IMAGES_FOUND"
        elif pass_count == 0:
            status = "FAIL"
            reason = "EXTRACTING_TEXT_FAILED"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "content": content,
        }

    # id: create_notice
    elif id == "create_notice":
        if status == None:
            try:
                status, reason, msg, element = evaluate_accessibility(request)
            except:
                status = "FAIL"
                reason = "접근성 검사 실패"
                msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
                element = None

        if status == None:
            try:
                status, reason, msg, element = moderate_input_data(request)
            except:
                status = "FAIL"
                reason = "유해성 검사 실패"
                msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
                element = None

        if status == None:
            content, img_key_list = update_content_and_get_img_key_list(request)
            file = get_file(request)

            data = {
                "db_name": "NOTICE",
                "title": title,
                "category": category,
                "content": content,
                "keyword": create_hashtag(content),
                "img_key_list": img_key_list,
                "file": file,
                "user": request.user.pk,
            }

            response = notion("create", "page", data)

            if response.status_code == 200:
                status = "DONE"
                reason = "접근성 및 유해성 검사 통과"
                msg = "공지사항이 등록되었어요! 👍"
            elif response.status_code == 400:
                status = "FAIL"
                reason = response.json()
                msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
                element = None
            elif response.status_code == 429:
                status = "FAIL"
                reason = "Notion API rate limit 초과"
                msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
                element = None
            else:
                status = "FAIL"
                reason = response.json()
                msg = "앗, 알 수 없는 오류가 발생했어요!"
                element = None

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "notion_url": response.json()["url"] if status == "DONE" else None,
            "title": title,
            "category": category,
            "keyword": data["keyword"] if status == "DONE" else None,
            "user": request.user.pk,
            "element": element if status == "FAIL" else None,
        }

        send_msg(request, "CREATE_NOTICE", "OPS", response)

    # id: read_notice
    elif id == "read_notice":
        data = {"page_id": page_id, "property_id": "B%5Dhc"}
        block_id_list, content = notion("retrieve", "block_children", data)

        try:
            file = ast.literal_eval(
                notion("retrieve", "page_properties", data).json()["results"][0][
                    "rich_text"
                ]["text"]["content"]
            )
        except:
            file = None

        response = {
            "id": id,
            "status": "DONE",
            "page_id": page_id,
            "block_id_list": block_id_list,
            "content": content,
            "file": file,
        }

    # id: update_notice
    elif id == "update_notice":
        if status == None:
            try:
                status, reason, msg, element = evaluate_accessibility(request)
            except:
                status = "FAIL"
                reason = "접근성 검사 실패"
                msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
                element = None

        if status == None:
            try:
                status, reason, msg, element = moderate_input_data(request)
            except:
                status = "FAIL"
                reason = "유해성 검사 실패"
                msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
                element = None

        if status == None:
            content, img_key_list = update_content_and_get_img_key_list(request)
            file = get_file(request)

            data = {
                "db_name": "NOTICE",
                "page_id": page_id,
                "block_id_list": block_id_list,
                "title": title,
                "category": category,
                "content": content,
                "keyword": create_hashtag(content),
                "img_key_list": img_key_list,
                "file": file,
            }

            response = notion("update", "page_properties", data)

            if response.status_code == 200:
                response_list = notion("delete", "block", data)

                if all(response.status_code == 200 for response in response_list):
                    response = notion("append", "block_children", data)

                    if response.status_code == 200:
                        status = "DONE"
                        reason = "접근성 및 유해성 검사 통과"
                        msg = "공지사항이 수정되었어요! 👍"
                    elif response.status_code == 400:
                        status = "FAIL"
                        reason = response.json()
                        msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
                        element = None
                    else:
                        status = "FAIL"
                        reason = response.json()
                        msg = "앗, 알 수 없는 오류가 발생했어요!"
                        element = None
                else:
                    status = "FAIL"
                    reason = response.json()
                    msg = "앗, 다시 한 번 시도해주세요!"
                    element = None

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "notion_url": (
                f'https://www.notion.so/{response.json()["results"][0]["parent"]["page_id"].replace("-", "")}'
                if status == "DONE"
                else None
            ),
            "title": title,
            "category": category,
            "keyword": data["keyword"] if status == "DONE" else None,
            "user": request.user.pk,
            "element": element if status == "FAIL" else None,
        }

        send_msg(request, "UPDATE_NOTICE", "OPS", response)

    # id: delete_notice
    elif id == "delete_notice":
        try:
            data = {"page_id": page_id, "property_id": "yquB"}
            old_img_key_list = ast.literal_eval(
                notion("retrieve", "page_properties", data).json()["results"][0][
                    "rich_text"
                ]["text"]["content"]
            )

            for old_img_key in old_img_key_list:
                data = {"key": old_img_key}
                aws_s3("delete", "object", data)
        except:
            pass

        try:
            data = {"page_id": page_id, "property_id": "B%5Dhc"}
            old_file_list = ast.literal_eval(
                notion("retrieve", "page_properties", data).json()["results"][0][
                    "rich_text"
                ]["text"]["content"]
            )

            for old_file in old_file_list:
                data = {"key": old_file["key"]}
                aws_s3("delete", "object", data)
        except:
            pass

        data = {"page_id": page_id}
        response = notion("delete", "page", data)

        if response.status_code == 200:
            status = "DONE"
            msg = "공지사항이 삭제되었어요! 🗑️"
        elif response.status_code != 200:
            status = "FAIL"
            reason = response.json()
            msg = "앗, 삭제할 수 없는 공지사항이에요!"

        response = {
            "id": id,
            "status": status,
            "reason": reason if status == "FAIL" else None,
            "msg": msg,
            "notion_url": response.json()["url"] if status == "DONE" else None,
            "title": title,
            "category": category,
            "keyword": keyword,
            "user": request.user.pk,
        }

        send_msg(request, "DELETE_NOTICE", "OPS", response)

    return JsonResponse(response)
