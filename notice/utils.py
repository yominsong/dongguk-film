from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from utility.msg import send_msg
from utility.utils import set_headers, chap_gpt, notion
import requests

#
# Global constants and variables
#

NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")

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
        result = False

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
        reason = "내용에 비속어 또는 욕설로 해석될 수 있는 표현이 있음"
        msg = "내용에 비속어 또는 욕설로 해석될 수 있는 표현이 있는 것 같아요."
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


#
# Main functions
#


@login_required
def notice(request):
    """
    - request | `HttpRequest`:
        - id:
            - create_notice
            - update_notice
            - delete_notice
        - string_id
        - title
        - category
        - content
        - keyword
    """

    id = request.POST.get("id")
    string_id = request.POST.get("string_id")
    title = request.POST.get("title")
    category = request.POST.get("category")
    content = request.POST.get("content")
    keyword = request.POST.get("keyword")

    # id: create_notice
    if id == "create_notice":
        try:
            status, reason, msg, element = moderation(request)
        except:
            status = "FAIL"
            reason = "유해성 검사 실패"
            msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
            element = None

        if status == None:
            data = {"db_name": "notice-db", "keyword": create_hashtag(content)}
            response = notion("create", "page", data=data, request=request)
            if response.status_code == 200:
                status = "DONE"
                reason = "유해성 검사 통과"
                msg = "공지사항이 등록되었어요! 👍"
            elif response.status_code == 400:
                status == "FAIL"
                reason = response.json()
                msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
                element = None
            elif response.status_code == 429:
                status == "FAIL"
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
                "keyword": data["keyword"],
                "user": f"{request.user}",
                "element": element if status == "FAIL" else None,
            },
        }
        send_msg(request, "NTC", "MGT", response)

    # id: read_notice
    elif id == "read_notice":
        block_string_id_list, content = notion(
            "retrieve", "block_children", request=request
        )

        response = {
            "id": id,
            "result": {
                "status": "DONE",
                "string_id": string_id,
                "block_string_id_list": block_string_id_list,
                "content": content,
            },
        }

    # id: update_notice
    elif id == "update_notice":
        try:
            status, reason, msg, element = moderation(request)
        except:
            status = "FAIL"
            reason = "유해성 검사 실패"
            msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
            element = None

        if status == None:
            data = {"keyword": create_hashtag(content)}
            response = notion("update", "page_properties", data=data, request=request)
            if response.status_code == 200:
                response_list = notion("delete", "block", request=request)
                if all(response.status_code == 200 for response in response_list):
                    response = notion("append", "block_children", request=request)
                    if response.status_code == 200:
                        status = "DONE"
                        reason = "유해성 검사 통과"
                        msg = "공지사항이 수정되었어요! 👍"
                    elif response.status_code == 400:
                        status == "FAIL"
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
        response = notion("delete", "page", request=request)
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
