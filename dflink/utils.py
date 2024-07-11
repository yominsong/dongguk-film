from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from urllib.parse import urlparse
from utility.msg import send_msg
from utility.utils import reg_test, set_headers, chat_gpt, short_io, notion
import requests, json

#
# Global variables
#

SCRAPEOPS_API_KEY = getattr(settings, "SCRAPEOPS_API_KEY", "SCRAPEOPS_API_KEY")

global need_www
need_www = False

#
# Cron functions
#


def delete_expired_dflink(request):
    dflink_list = short_io("retrieve")
    expired_dflink_list = []

    for dflink in dflink_list:
        expiration_date = timezone.datetime.strptime(
            dflink["expiration_date"], "%Y-%m-%d"
        ).date()

        link_id = dflink["link_id"]

        if expiration_date < timezone.now().date():
            expired_dflink = {k: v for k, v in dflink.items() if k != "user"}
            expired_dflink_list.append(expired_dflink)
            url = f"https://api.short.io/links/{link_id}"
            requests.delete(url, headers=set_headers("SHORT_IO"))
    
    data = {"expired_dflink_list": expired_dflink_list}
    json_data = json.dumps(data, indent=4)

    if len(expired_dflink_list) > 0:
        data["status"] = "DONE"
        send_msg(request, "DELETE_EXPIRED_DFLINK", "MGT", data)

    return HttpResponse(json_data, content_type="application/json")


#
# Sub functions
#


def has_www(target_url: str):
    if "://" in target_url:
        target_url = urlparse(target_url).netloc

    if "www." == target_url[:4]:
        result = True
    elif not "www." == target_url[:4]:
        result = False

    return result


def is_correct_url(target_url: str):
    global need_www
    global proxy_was_already_used
    proxy_was_already_used = False

    def use_proxy(target_url: str):
        global proxy_was_already_used
        proxy_was_already_used = True

        response = requests.get(
            url="https://proxy.scrapeops.io/v1/",
            params={
                "api_key": SCRAPEOPS_API_KEY,
                "url": target_url,
            },
        )

        return response

    try:
        response = requests.get(target_url, headers=set_headers("RANDOM"))
        response = (
            use_proxy(target_url) if int(response.status_code) >= 400 else response
        )
    except:
        try:
            if not has_www(target_url):
                target_url = target_url.replace("://", "://www.")
                response = requests.get(target_url, headers=set_headers("RANDOM"))
                need_www = True
        except:
            response = (
                use_proxy(target_url) if proxy_was_already_used == False else None
            )

    try:
        result = (
            True
            if (
                (
                    int(response.status_code) < 400
                    and not "565 Proxy Handshake Failed" in response.text
                )
                or ("notion-html" in response.text)
            )
            else False
        )
    except:
        result = False

    return result


def is_listed(target_url: str):
    if "://" in target_url:
        target_url = urlparse(target_url).netloc
    if has_www(target_url):
        target_url = target_url[4:]

    data = {
        "db_name": "dflink-allowlist",
        "filter": {
            "and": [
                {"property": "URL", "rich_text": {"contains": target_url}},
                {"property": "Validation", "rich_text": {"contains": "🟢"}},
            ]
        },
    }

    url_list = notion("query", "db", data=data)

    try:
        result = True if target_url in url_list else False
    except:
        result = False

    return result


def is_well_known(target_url: str):
    if "://" in target_url:
        target_url = urlparse(target_url).netloc

    prompt = [
        {
            "type": "text",
            "text": f"{target_url}\n알고 있는 사이트인지 'True' 또는 'False'로만 답해줘.",
        }
    ]

    openai_response = chat_gpt("3.5-turbo", prompt)

    if "True" in openai_response:
        result = True
    elif "False" in openai_response:
        if not has_www(target_url):
            target_url = f"www.{target_url}"
            result = is_well_known(target_url)
        else:
            result = False
    else:
        result = False

    return result


def is_harmless(target_url: str):
    if "://" in target_url:
        target_url = urlparse(target_url).netloc

    prompt = [
        {
            "type": "text",
            "text": f"{target_url}\n전혀 유해하지 않은 안전한 사이트인지 'True' 또는 'False'로만 답해줘.",
        }
    ]

    openai_response = chat_gpt("3.5-turbo", prompt)

    if "True" in openai_response:
        result = True
    elif "False" in openai_response:
        result = False
    else:
        result = False

    return result


def is_new_slug(id: str, slug: str):
    """
    - id | `str`:
        - create_dflink
        - update_dflink
    - slug | `str`
    """

    url = f"https://api.short.io/links/expand?domain=dgufilm.link&path={slug}"
    response = requests.get(url, headers=set_headers("SHORT_IO"))

    if response.status_code == 200:
        if id == "create_dflink":
            result = False
        elif id == "update_dflink":
            if slug == response.json()["path"]:
                result = True
            else:
                result = False
    else:
        result = True

    return result


def is_correct_expiration_date(expiration_date: str):
    today = timezone.now().date()
    expiration_date = timezone.datetime.strptime(expiration_date, "%Y-%m-%d").date()
    after_90_days_from_today = today + timezone.timedelta(days=90)

    if today <= expiration_date <= after_90_days_from_today:
        result = True
    else:
        result = False

    return result


def is_not_swearing(slug_or_title: str):
    prompt = [
        {
            "type": "text",
            "text": f"'{slug_or_title}'이라는 말이 폭력적인 표현, 선정적인 표현, 성차별적인 표현으로 해석될 수 있는지 'True' 또는 'False'로만 답해줘.",
        }
    ]

    openai_response = chat_gpt("3.5-turbo", prompt)

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
        - target_url
        - slug
        - expiration_date
    """

    target_url = request.GET["target_url"]
    slug = request.GET["slug"]
    expiration_date = request.GET["expiration_date"]

    try:
        result = (
            True
            if (
                reg_test(target_url, "URL")
                and reg_test(slug, "LRN")
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
        - link_id
        - target_url
        - slug
        - title
        - category
        - expiration_date
    """

    id = request.GET["id"]
    target_url = request.GET["target_url"]
    slug = request.GET["slug"]
    expiration_date = request.GET["expiration_date"]

    if not is_correct_url(target_url):
        status = "FAIL"
        reason = "대상 URL 접속 불가"
        msg = "대상 URL이 잘못 입력된 것 같아요."
        element = "id_target_url"

    elif not is_new_slug(id, slug):
        status = "FAIL"
        reason = "이미 존재하는 동영링크 URL"
        msg = "앗, 이미 존재하는 동영링크 URL이에요!"
        element = "id_slug"

    elif not is_correct_expiration_date(expiration_date):
        status = "FAIL"
        reason = "유효 범위를 벗어난 만료일"
        msg = "만료일이 유효 범위를 벗어난 것 같아요."
        element = "id_expiration_date"

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
        - link_id
        - target_url
        - slug
        - title
        - category
        - expiration_date
    """

    target_url = request.GET["target_url"]
    slug = request.GET["slug"]
    title = request.GET["title"]

    if not is_listed(target_url) and not is_well_known(target_url):
        status = "FAIL"
        reason = "allowlist 등재 필요"
        msg = "이 대상 URL은 현재 사용할 수 없어요."
        element = "id_target_url"

    elif not is_listed(target_url) and not is_harmless(target_url):
        status = "FAIL"
        reason = "유해 사이트"
        msg = "이 대상 URL은 사용할 수 없어요."
        element = "id_target_url"

    elif not is_not_swearing(slug):
        status = "FAIL"
        reason = "비속어 또는 욕설로 해석될 수 있는 동영링크 URL"
        msg = "이 동영링크 URL은 사용할 수 없어요."
        element = "id_slug"

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
        - link_id
        - target_url
        - slug
        - title
        - category
        - expiration_date
    """

    global need_www
    id = request.GET.get("id")
    target_url = request.GET.get("target_url")
    slug = request.GET.get("slug")
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
                target_url = target_url.replace("://", "://www.")
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
                element = "id_slug"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "target_url": target_url,
            "dflink": f"https://dgufilm.link/{slug}",
            "title": title,
            "category": category,
            "user": f"{request.user}",
            "expiration_date": expiration_date,
            "element": element if status == "FAIL" else None,
        }

        send_msg(request, "CREATE_DFLINK", "MGT", response)

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
                target_url = target_url.replace("://", "://www.")
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
                element = "id_slug"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "target_url": target_url,
            "dflink": f"https://dgufilm.link/{slug}",
            "title": title,
            "category": category,
            "user": f"{request.user}",
            "expiration_date": expiration_date,
            "element": element if status == "FAIL" else None,
        }

        send_msg(request, "UPDATE_DFLINK", "MGT", response)

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
            "status": status,
            "msg": msg,
            "target_url": target_url,
            "dflink": f"https://dgufilm.link/{slug}",
            "title": title,
            "category": category,
            "user": f"{request.user}",
            "expiration_date": expiration_date,
        }

        send_msg(request, "DELETE_DFLINK", "MGT", response)

    return JsonResponse(response)
