from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from urllib.parse import urlparse
from utility.msg import send_msg
from utility.utils import reg_test, set_headers, chap_gpt
from fake_useragent import UserAgent
import openai, json, requests

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
        f"'{title_or_content}'에 폭력적인 표현, 선정적인 표현, 성차별적인 표현으로 해석될 수 있는 표현이 있는지 'True' 또는 'False'로만 답해줘."
    )

    if "False" in openai_response:
        result = True
    elif "True" in openai_response:
        result = False
    else:
        result = False

    return result


def validation(data: dict):
    """
    - data | `dict`:
        - title
        - content
    """

    title = data["title"]
    content = data["content"]

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


def create_hashtag(title, content):
    openai_response = chap_gpt(
        f"{content}\n위 글에서 가장 중요한 핵심단어 세 가지를 해시태그로 작성해줘. 이때, '동국대학교', '영화영상학과', '디닷에프'는 포함하지 마. {title}에 있는 단어도 절대 포함하지 마. 중복을 방지하기 위함이야. 해시태그 구분은 띄어쓰기로만 해. ',' 기호를 사용하지 마."
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
    """

    id = request.POST["id"]

    # id: create_notice
    if id == "create_notice":
        title = request.POST["title"]
        category = request.POST["category"]
        content = request.POST["content"]

        data = {
            "title": title,
            "content": content,
        }
        try:
            status, reason, msg, element = validation(data)
        except:
            status = "FAIL"
            reason = "유효성 검사 실패"
            msg = "앗, 새로고침 후 다시 한 번 시도해주세요!"
            element = None

        if status == None:
            url = "https://api.notion.com/v1/pages"
            keyword = create_hashtag(title, content)
            content_chunks = [
                content[i : i + 2000] for i in range(0, len(content), 2000)
            ]
            paragraph_list = [
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": chunk},
                            }
                        ]
                    },
                }
                for chunk in content_chunks
            ]
            payload = {
                "parent": {"database_id": NOTION_DB_ID["notice-db"]},
                "properties": {
                    "Category": {
                        "select": {
                            "name": category,
                        },
                    },
                    "Title": {"title": [{"text": {"content": title}}]},
                    "Keyword": {"rich_text": [{"text": {"content": keyword}}]},
                    "User": {"number": int(f"{request.user}")},
                },
                "children": paragraph_list,
            }
            response = requests.post(
                url, json=payload, headers=set_headers("NOTION")
            ).json()
            if response["object"] == "page":
                status = "DONE"
                reason = "유효성 검사 통과"
                msg = "공지사항이 등록되었어요! 👍"
            elif response["status"] == 429:
                status == "FAIL"
                reason = "Notion API rate limit 초과"
                msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
                element = None
            else:
                status = "FAIL"
                reason = "알 수 없는 오류"
                msg = response
                element = None

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason,
                "msg": msg,
                "notion_url": response["url"] if status == "DONE" else None,
                "title": title,
                "category": category,
                "keyword": keyword,
                "user": f"{request.user}",
            },
        }
        if status == "FAIL":
            response["result"].update({"notion_url": None, "element": element})
        send_msg(request, "NTC", "MGT", response)

    return JsonResponse(response)
