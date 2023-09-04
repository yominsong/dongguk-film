from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from utility.msg import send_msg
from utility.hangul import encode_hangul_to_url
from utility.utils import generate_random_string, chap_gpt, notion, aws_s3
from bs4 import BeautifulSoup
import base64, ast

#
# Global constants and variables
#

NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")
GOOGLE_DRIVE_FOLDER_ID = getattr(
    settings, "GOOGLE_DRIVE_FOLDER_ID", "GOOGLE_DRIVE_FOLDER_ID"
)

#
# Sub functions
#


def is_not_swearing(title_or_content: str):
    openai_response = chap_gpt(
        f"'{title_or_content}'에 폭력적인 표현, 선정적인 표현, 성차별적인 표현으로 해석될 수 있는 내용이 있는지 'True' 또는 'False'로만 답해줘."
    )

    if "False" in openai_response:
        result = True
    elif "True" in openai_response:
        result = False
    else:
        result = True

    return result


def moderation(request):
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
    openai_response = chap_gpt(
        f"{content}\n위 글의 핵심 주제를 최소 1개, 최대 3개의 해시태그로 만들어줘. 그리고 1~3개를 오직 ' '(띄어쓰기)로만 구분해줘. '#'(해시) 외에 다른 기호는 절대 사용하지 마."
    )

    return openai_response


def detect_img_src(type, content):
    img_src_list = parse_img_src(type, content)
    result = False

    if len(img_src_list) != 0:
        result = True

    return result


def parse_img_src(type, content):
    soup = BeautifulSoup(content, "html.parser")
    img_tag_list = soup.find_all("img")
    prefix = None

    if type == "b64":
        prefix = "data:image/"
    elif type == "bin":
        prefix = "https://dongguk-film.s3.ap-northeast-2.amazonaws.com/"
    elif type == "all":
        prefix = ""

    img_src_list = [
        img_tag["src"]
        for img_tag in img_tag_list
        if img_tag.has_attr("src") and img_tag["src"].startswith(prefix)
    ]

    return img_src_list


def decode_b64_to_bin(b64_str_list):
    bin_list = []

    for b64_str in b64_str_list:
        mime_type, encoded_data = b64_str.split(",", 1)
        mime_type = mime_type.split(";")[0].split(":")[1].split("/")[1]
        bin_data = base64.b64decode(encoded_data)
        bin_list.append([bin_data, mime_type])

    return bin_list


def replace_img_src_from_b64_to_bin(content, image_name_list):
    soup = BeautifulSoup(content, "html.parser")
    img_src_list = parse_img_src("b64", content)

    for old_src, image_name in zip(img_src_list, image_name_list):
        image_name = encode_hangul_to_url(image_name)
        new_src = f"https://dongguk-film.s3.ap-northeast-2.amazonaws.com/{image_name}"
        for img_tag in soup.find_all("img", src=old_src):
            img_tag["src"] = new_src

    new_content = str(soup)

    return new_content


#
# Main functions
#


@login_required
def notice(request):
    """
    - request | `HttpRequest`:
        - id:
            - create_notice
            - read_notice
            - update_notice
            - delete_notice
        - page_id
        - title
        - category
        - content
        - keyword
    """

    id = request.POST.get("id")
    page_id = request.POST.get("page_id")
    block_id = request.POST.get("block_id")
    title = request.POST.get("title")
    category = request.POST.get("category")
    content = request.POST.get("content")
    keyword = request.POST.get("keyword")

    def handle_image(content):
        if detect_img_src("b64", content):
            b64_image_list = decode_b64_to_bin(parse_img_src("b64", content))
            image_name_list = []

            for image in b64_image_list:
                image_name = f"dongguk-film-{generate_random_string(5)}.{image[1]}".replace(
                    " ", "+"
                )
                data = {"bin": image[0], "name": image_name}
                aws_s3("put", "object", data=data)
                image_name_list.append(image_name)

            content = replace_img_src_from_b64_to_bin(content, image_name_list)
        elif detect_img_src("bin", content):
            image_src_list = parse_img_src("bin", content)
            image_name_list = [
                src.replace("https://dongguk-film.s3.ap-northeast-2.amazonaws.com/", "")
                for src in image_src_list
            ]
        else:
            image_name_list = ""
        
        return content, image_name_list

    # id: create_notice
    if id == "create_notice":
        content, image_name_list = handle_image(content)

        try:
            status, reason, msg, element = moderation(request)
        except:
            status = "FAIL"
            reason = "유해성 검사 실패"
            msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
            element = None

        if status == None:
            data = {
                "db_name": "notice-db",
                "title": title,
                "category": category,
                "content": content,
                "keyword": create_hashtag(content),
                "image_name_list": image_name_list,
                "user": request.user,
            }
            response = notion("create", "page", data=data)

            if response.status_code == 200:
                status = "DONE"
                reason = "유해성 검사 통과"
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
            "result": {
                "status": status,
                "reason": reason,
                "msg": msg,
                "notion_url": response.json()["url"] if status == "DONE" else None,
                "title": title,
                "category": category,
                "keyword": data["keyword"] if status == "DONE" else None,
                "user": f"{request.user}",
                "element": element if status == "FAIL" else None,
            },
        }
        send_msg(request, "NTC", "MGT", response)

    # id: read_notice
    elif id == "read_notice":
        data = {"page_id": page_id}
        block_id_list, content = notion("retrieve", "block_children", data=data)

        response = {
            "id": id,
            "result": {
                "status": "DONE",
                "page_id": page_id,
                "block_id_list": block_id_list,
                "content": content,
            },
        }

    # id: update_notice
    elif id == "update_notice":
        content, image_name_list = handle_image(content)

        if image_name_list != "":
            data = {"page_id": page_id, "property_id": "yquB"}
            old_image_name_list = ast.literal_eval(
                notion("retrieve", "page_properties", data=data).json()["results"][0][
                    "rich_text"
                ]["text"]["content"]
            )

            bin_image_src_list = parse_img_src("bin", content)
            bin_image_name_list = [
                src.replace("https://dongguk-film.s3.ap-northeast-2.amazonaws.com/", "")
                for src in bin_image_src_list
            ]

            for old_image_name in old_image_name_list:
                if encode_hangul_to_url(old_image_name) not in bin_image_name_list:
                    data = {"name": old_image_name}
                    aws_s3("delete", "object", data=data)

            image_name_list = list(set(image_name_list + bin_image_name_list))

        try:
            status, reason, msg, element = moderation(request)
        except:
            status = "FAIL"
            reason = "유해성 검사 실패"
            msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
            element = None

        if status == None:
            data = {
                "page_id": page_id,
                "block_id": block_id,
                "title": title,
                "category": category,
                "content": content,
                "keyword": create_hashtag(content),
                "image_name_list": image_name_list,
            }
            response = notion("update", "page_properties", data=data)

            if response.status_code == 200:
                response_list = notion("delete", "block", data=data)
                if all(response.status_code == 200 for response in response_list):
                    response = notion("append", "block_children", data=data)
                    if response.status_code == 200:
                        status = "DONE"
                        reason = "유해성 검사 통과"
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
            "result": {
                "status": status,
                "reason": reason,
                "msg": msg,
                "notion_url": f'https://www.notion.so/{response.json()["results"][0]["parent"]["page_id"].replace("-", "")}'
                if status == "DONE"
                else None,
                "title": title,
                "category": category,
                "keyword": data["keyword"],
                "user": f"{request.user}",
                "element": element if status == "FAIL" else None,
            },
        }
        send_msg(request, "NTU", "MGT", response)

    # id: delete_notice
    elif id == "delete_notice":
        data = {"page_id": page_id, "property_id": "yquB"}
        old_image_name_list = ast.literal_eval(
            notion("retrieve", "page_properties", data=data).json()["results"][0][
                "rich_text"
            ]["text"]["content"]
        )

        for old_image_name in old_image_name_list:
            data = {"name": old_image_name}
            aws_s3("delete", "object", data=data)

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
            "result": {
                "status": status,
                "reason": reason if status == "FAIL" else None,
                "msg": msg,
                "notion_url": response.json()["url"] if status == "DONE" else None,
                "title": title,
                "category": category,
                "keyword": keyword,
                "user": f"{request.user}",
            },
        }
        send_msg(request, "NTD", "MGT", response)

    return JsonResponse(response)
