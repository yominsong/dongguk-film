from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from urllib.parse import urlparse
from utility.msg import send_msg
from utility.utils import reg_test, set_headers, chap_gpt, short_io
import requests

#
# Global constants and variables
#

NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")
SCRAPEOPS_API_KEY = getattr(settings, "SCRAPEOPS_API_KEY", "SCRAPEOPS_API_KEY")
SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")

global need_www
need_www = False

#
# Cron functions
#


def delete_expired_dflinks(request):
    dflink_list = short_io("retrieve")
    expired_dflink_list = []

    for dflink in dflink_list:
        expiration_date = timezone.datetime.strptime(
            dflink["expiration_date"], "%Y-%m-%d"
        ).date()
        id_string = dflink["id_string"]
        if expiration_date < timezone.now().date():
            expired_dflink_list.append(dflink)
            url = f"https://api.short.io/links/{id_string}"
            requests.delete(url, headers=set_headers("SHORT_IO"))

    if len(expired_dflink_list) > 0:
        send_msg(request, "DLA", "MGT", extra=expired_dflink_list)

    return HttpResponse(f"Number of deleted DFlinks: {len(expired_dflink_list)}")


#
# Sub functions
#


def has_www(original_url: str):
    if "://" in original_url:
        original_url = urlparse(original_url).netloc

    if "www." == original_url[:4]:
        result = True
    elif not "www." == original_url[:4]:
        result = False

    return result


def is_correct_url(original_url: str):
    global need_www
    global proxy_was_already_used
    proxy_was_already_used = False

    def use_proxy(original_url: str):
        global proxy_was_already_used
        proxy_was_already_used = True

        response = requests.get(
            url="https://proxy.scrapeops.io/v1/",
            params={
                "api_key": SCRAPEOPS_API_KEY,
                "url": original_url,
            },
        )

        return response

    try:
        response = requests.get(original_url, headers=set_headers("RANDOM"))
        response = use_proxy(original_url) if int(response.status_code) >= 400 else response 
    except:
        try:
            if not has_www(original_url):
                original_url = original_url.replace("://", "://www.")
                response = requests.get(original_url, headers=set_headers("RANDOM"))
                need_www = True
        except:
            response = use_proxy(original_url) if proxy_was_already_used == False else None

    try:
        result = (
            True
            if int(response.status_code) < 400
            and not "565 Proxy Handshake Failed" in response.text
            else False
        )
    except:
        result = False

    return result


def is_listed(original_url: str):
    if "://" in original_url:
        original_url = urlparse(original_url).netloc
    if has_www(original_url):
        original_url = original_url[4:]

    url = (
        f"https://api.notion.com/v1/databases/{NOTION_DB_ID['dflink-allowlist']}/query"
    )
    payload = {
        "filter": {
            "and": [
                {"property": "URL", "rich_text": {"contains": original_url}},
                {"property": "Validation", "rich_text": {"contains": "🟢"}},
            ]
        }
    }
    notion_response = requests.post(
        url, json=payload, headers=set_headers("NOTION")
    ).json()

    try:
        listed_url = notion_response["results"][0]["properties"]["URL"]["url"]
        result = True if original_url in listed_url else False
    except:
        result = False

    return result


def is_well_known(original_url: str):
    if "://" in original_url:
        original_url = urlparse(original_url).netloc

    openai_response = chap_gpt(f"{original_url}\n알고 있는 사이트인지 'True' 또는 'False'로만 답해줘.")

    if "True" in openai_response:
        result = True
    elif "False" in openai_response:
        if not has_www(original_url):
            original_url = f"www.{original_url}"
            result = is_well_known(original_url)
        else:
            result = False
    else:
        result = False

    return result


def is_harmless(original_url: str):
    if "://" in original_url:
        original_url = urlparse(original_url).netloc

    openai_response = chap_gpt(
        f"{original_url}\n전혀 유해하지 않은 안전한 사이트인지 'True' 또는 'False'로만 답해줘."
    )

    if "True" in openai_response:
        result = True
    elif "False" in openai_response:
        result = False
    else:
        result = False

    return result


def is_new_slug(id: str, dflink_slug: str):
    """
    - id | `str`:
        - create_dflink
        - update_dflink
    - dflink_slug | `str`
    """

    url = f"https://api.short.io/links/expand?domain=dgufilm.link&path={dflink_slug}"
    response = requests.get(url, headers=set_headers("SHORT_IO"))

    if response.status_code == 200:
        if id == "create_dflink":
            result = False
        elif id == "update_dflink":
            if dflink_slug == response.json()["path"]:
                result = True
            else:
                result = False
    else:
        result = True

    return result


def is_not_swearing(dflink_slug_or_title: str):
    openai_response = chap_gpt(
        f"'{dflink_slug_or_title}'이라는 말이 폭력적인 표현, 선정적인 표현, 성차별적인 표현으로 해석될 수 있는지 'True' 또는 'False'로만 답해줘."
    )

    if "False" in openai_response:
        result = True
    elif "True" in openai_response:
        result = False
    else:
        result = False

    return result


def is_valid(request):
    """
    - request | `HttpRequest`:
        - original_url
        - dflink_slug
        - expiration_date
    """

    original_url = request.GET["original_url"]
    dflink_slug = request.GET["dflink_slug"]
    expiration_date = request.GET["expiration_date"]

    try:
        result = (
            True
            if (
                reg_test(original_url, "URL")
                and reg_test(dflink_slug, "LRN")
                and reg_test(expiration_date, "DAT")
            )
            else False
        )
    except:
        result = False

    return result


def validate_input_data(request):
    """
    - request | `HttpRequest`:
        - id
            - create_dflink
            - update_dflink
            - delete_dflink
        - string_id
        - original_url
        - dflink_slug
        - title
        - category
        - expiration_date
    """

    id = request.GET["id"]
    original_url = request.GET["original_url"]
    dflink_slug = request.GET["dflink_slug"]

    if not is_correct_url(original_url):
        status = "FAIL"
        reason = "원본 URL 접속 불가"
        msg = "원본 URL이 잘못 입력된 것 같아요."
        element = "id_original_url"

    elif not is_new_slug(id, dflink_slug):
        status = "FAIL"
        reason = "이미 존재하는 동영링크 URL"
        msg = "앗, 이미 존재하는 동영링크 URL이에요!"
        element = "id_dflink_slug"

    elif not is_valid(request):
        status = "FAIL"
        reason = "허용되지 않은 입력값"
        msg = "뭔가 잘못 입력된 것 같아요."
        element = None

    else:
        status = None
        reason = None
        msg = None
        element = None

    return status, reason, msg, element


def moderate_input_data(request):
    """
    - request | `HttpRequest`:
        - id
            - create_dflink
            - update_dflink
            - delete_dflink
        - string_id
        - original_url
        - dflink_slug
        - title
        - category
        - expiration_date
    """

    original_url = request.GET["original_url"]
    dflink_slug = request.GET["dflink_slug"]
    title = request.GET["title"]

    if not is_listed(original_url) and not is_well_known(original_url):
        status = "FAIL"
        reason = "allowlist 등재 필요"
        msg = "이 원본 URL은 현재 사용할 수 없어요."
        element = "id_original_url"

    elif not is_listed(original_url) and not is_harmless(original_url):
        status = "FAIL"
        reason = "유해 사이트"
        msg = "이 원본 URL은 사용할 수 없어요."
        element = "id_original_url"

    elif not is_not_swearing(dflink_slug):
        status = "FAIL"
        reason = "비속어 또는 욕설로 해석될 수 있는 동영링크 URL"
        msg = "이 동영링크 URL은 사용할 수 없어요."
        element = "id_dflink_slug"

    elif not is_not_swearing(title):
        status = "FAIL"
        reason = "비속어 또는 욕설로 해석될 수 있는 제목"
        msg = "이 제목은 사용할 수 없어요."
        element = "id_title"

    else:
        status = None
        reason = None
        msg = None
        element = None

    return status, reason, msg, element


#
# Main functions
#


@login_required
def dflink(request):
    """
    - request | `HttpRequest`:
        - id:
            - create_dflink
            - update_dflink
            - delete_dflink
        - string_id
        - original_url
        - dflink_slug
        - title
        - category
        - expiration_date
    """

    global need_www
    id = request.GET.get("id")
    original_url = request.GET.get("original_url")
    dflink_slug = request.GET.get("dflink_slug")
    title = request.GET.get("title")
    category = request.GET.get("category")
    expiration_date = request.GET.get("expiration_date")

    status = None

    # id: create_dflink
    if id == "create_dflink":
        if status == None:
            try:
                status, reason, msg, element = validate_input_data(request)
            except:
                status = "FAIL"
                reason = "유효성 검사 실패"
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
            if need_www:
                original_url = original_url.replace("://", "://www.")
                need_www = False

            response = short_io("create", request)
            if response.status_code == 200:
                status = "DONE"
                reason = "유효성 및 유해성 검사 통과"
                msg = "동영링크가 생성되었어요! 👍"
            elif (
                response.status_code == 409
                and response.json()["error"] == "Link already exists"
            ):
                status = "FAIL"
                reason = "이미 존재하는 동영링크 URL"
                msg = "앗, 이미 존재하는 동영링크 URL이에요!"
                element = "id_dflink_slug"

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason,
                "msg": msg,
                "original_url": original_url,
                "dflink": f"https://dgufilm.link/{dflink_slug}",
                "title": title,
                "category": category,
                "user": f"{request.user}",
                "expiration_date": expiration_date,
                "element": element if status == "FAIL" else None,
            },
        }
        send_msg(request, "DLC", "MGT", response)

    # id: update_dflink
    elif id == "update_dflink":
        if status == None:
            try:
                status, reason, msg, element = validate_input_data(request)
            except:
                status = "FAIL"
                reason = "유효성 검사 실패"
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
            if need_www:
                original_url = original_url.replace("://", "://www.")
                need_www = False

            response = short_io("update", request)
            if response.status_code == 200:
                status = "DONE"
                reason = "유효성 및 유해성 검사 통과"
                msg = "동영링크가 수정되었어요! 👍"
            elif (
                response.status_code == 400
                and response.json()["error"]
                == "Update failed, link with this path already exists"
            ):
                status = "FAIL"
                reason = "이미 존재하는 동영링크 URL"
                msg = "앗, 이미 존재하는 동영링크 URL이에요!"
                element = "id_dflink_slug"

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason,
                "msg": msg,
                "original_url": original_url,
                "dflink": f"https://dgufilm.link/{dflink_slug}",
                "title": title,
                "category": category,
                "user": f"{request.user}",
                "expiration_date": expiration_date,
                "element": element if status == "FAIL" else None,
            },
        }
        send_msg(request, "DLU", "MGT", response)

    # id: delete_dflink
    elif id == "delete_dflink":
        response = short_io("delete", request)
        if response.status_code == 200:
            status = "DONE"
            msg = "동영링크가 삭제되었어요! 🗑️"
        elif response.status_code == 404:
            status = "FAIL"
            msg = "앗, 삭제할 수 없는 동영링크예요!"

        response = {
            "id": id,
            "result": {
                "status": status,
                "msg": msg,
                "original_url": original_url,
                "dflink": f"https://dgufilm.link/{dflink_slug}",
                "title": title,
                "category": category,
                "user": f"{request.user}",
                "expiration_date": expiration_date,
            },
        }
        send_msg(request, "DLD", "MGT", response)

    return JsonResponse(response)
