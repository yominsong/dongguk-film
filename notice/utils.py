from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from utility.msg import send_msg
from utility.hangul import encode_hangul_to_url, decode_url_to_hangul
from utility.utils import (
    generate_random_string,
    chat_gpt,
    notion,
    aws_s3,
    ncp_clova,
)
from konlpy.tag import Okt
from collections import Counter
from bs4 import BeautifulSoup
import base64, ast

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
    prompt = [
        {
            "type": "text",
            "text": f"'{title_or_content}'에 폭력적인 표현, 선정적인 표현, 성차별적인 표현으로 해석될 수 있는 내용이 있는지 'True' 또는 'False'로만 답해줘.",
        }
    ]

    openai_response = chat_gpt("3.5-turbo", prompt)

    if "False" in openai_response:
        result = True
    elif "True" in openai_response:
        result = False
    else:
        result = True

    return result


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
    content = request.POST["content"]

    if not is_not_swearing(title):
        status = "FAIL"
        reason = "비속어 또는 욕설로 해석될 수 있는 제목"
        msg = "이 제목은 사용할 수 없어요."
        element = "id_title"

    elif not is_not_swearing(content):
        status = "FAIL"
        reason = "비속어 또는 욕설로 해석될 수 있는 표현이 포함된 내용"
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

    prompt = [
        {
            "type": "text",
            "text": f"{content}\n위 글의 핵심 주제를 최소 1개 ~ 최대 3개의 해시태그로 만들어줘. 반드시 최소 1개 ~ 최대 3개여야 해. 그리고 1~3개를 오직 ' '(띄어쓰기)로만 구분해줘. '#'(해시) 외에 다른 기호는 절대 사용하지 마.",
        }
    ]

    keywords = chat_gpt("3.5-turbo", prompt)

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
        new_src = f"https://dongguk-film.s3.ap-northeast-2.amazonaws.com/{img_key}"
        for img in soup.find_all("img", src=old_src):
            img["src"] = new_src

    new_content = str(soup)

    return new_content


def extract_text_from_img(type, img_src):
    data = {"img_src": img_src}
    extracted_text = ""

    if type == "b64":
        response = ncp_clova("ocr", "b64_img", data=data)
    elif type == "bin":
        response = ncp_clova("ocr", "bin_img", data=data)

    if response.status_code == 200:
        ocr_passed = True
        fields = response.json()["images"][0]["fields"]
        current_paragraph = "<p>"

        for field in fields:
            infer_text = field.get("inferText", "")
            line_break = field.get("lineBreak", False)
            current_paragraph += infer_text

            if line_break:
                current_paragraph += "</p>"
                extracted_text += current_paragraph
                current_paragraph = "<p>"
            else:
                current_paragraph += " "

        if current_paragraph != "<p>":
            current_paragraph += "</p>"
            extracted_text += current_paragraph
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
            aws_s3("put", "object", data=data)
            img_key_list.append(img_key)

        content = replace_img_src_from_b64_to_bin(content, img_key_list)

    if len(bin_img_list) != 0:
        for img in bin_img_list:
            if "https://dongguk-film.s3.ap-northeast-2.amazonaws.com/" in img["src"]:
                img_key = img["src"].replace(
                    "https://dongguk-film.s3.ap-northeast-2.amazonaws.com/", ""
                )
                img_key_list.append(decode_url_to_hangul(img_key))

        try:
            page_id = request.POST.get("page_id")
            data = {"page_id": page_id, "property_id": "yquB"}
            old_img_key_str = notion("retrieve", "page_properties", data=data).json()[
                "results"
            ][0]["rich_text"]["text"]["content"]
            old_img_key_list = ast.literal_eval(old_img_key_str)

            for old_img_key in old_img_key_list:
                if old_img_key not in img_key_list:
                    data = {"key": old_img_key}
                    aws_s3("delete", "object", data=data)
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
            aws_s3("put", "object", data=data)

    elif id == "update_notice":
        page_id = request.POST.get("page_id")
        data = {"page_id": page_id, "property_id": "B%5Dhc"}
        response = notion("retrieve", "page_properties", data=data)

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
                aws_s3("put", "object", data=data)

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
                reason = f"총 {total_num_of_img_src}개 중 {pass_count}개 이미지 내 텍스트 추출 성공"
            elif total_num_of_img_src == pass_count:
                status = "DONE"
                reason = f"총 {pass_count}개 이미지 내 텍스트 추출 성공"
        elif pass_count == 0:
            status = "FAIL"
            reason = "이미지 내 텍스트 추출 실패"

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
                "db_name": "notice",
                "title": title,
                "category": category,
                "content": content,
                "keyword": create_hashtag(content),
                "img_key_list": img_key_list,
                "file": file,
                "user": request.user,
            }

            response = notion("create", "page", data=data)

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
            "user": f"{request.user}",
            "element": element if status == "FAIL" else None,
        }

        send_msg(request, "CREATE_NOTICE", "MGT", response)

    # id: read_notice
    elif id == "read_notice":
        data = {"page_id": page_id, "property_id": "B%5Dhc"}
        block_id_list, content = notion("retrieve", "block_children", data=data)

        try:
            file = ast.literal_eval(
                notion("retrieve", "page_properties", data=data).json()["results"][0][
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
                "db_name": "notice",
                "page_id": page_id,
                "block_id_list": block_id_list,
                "title": title,
                "category": category,
                "content": content,
                "keyword": create_hashtag(content),
                "img_key_list": img_key_list,
                "file": file,
            }

            response = notion("update", "page_properties", data=data)

            if response.status_code == 200:
                response_list = notion("delete", "block", data=data)

                if all(response.status_code == 200 for response in response_list):
                    response = notion("append", "block_children", data=data)

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
            "user": f"{request.user}",
            "element": element if status == "FAIL" else None,
        }

        send_msg(request, "UPDATE_NOTICE", "MGT", response)

    # id: delete_notice
    elif id == "delete_notice":
        try:
            data = {"page_id": page_id, "property_id": "yquB"}
            old_img_key_list = ast.literal_eval(
                notion("retrieve", "page_properties", data=data).json()["results"][0][
                    "rich_text"
                ]["text"]["content"]
            )

            for old_img_key in old_img_key_list:
                data = {"key": old_img_key}
                aws_s3("delete", "object", data=data)
        except:
            pass

        try:
            data = {"page_id": page_id, "property_id": "B%5Dhc"}
            old_file_list = ast.literal_eval(
                notion("retrieve", "page_properties", data=data).json()["results"][0][
                    "rich_text"
                ]["text"]["content"]
            )

            for old_file in old_file_list:
                data = {"key": old_file["key"]}
                aws_s3("delete", "object", data=data)
        except:
            pass

        data = {"page_id": page_id}
        response = notion("delete", "page", data=data)

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
            "user": f"{request.user}",
        }
        
        send_msg(request, "DELETE_NOTICE", "MGT", response)

    return JsonResponse(response)
