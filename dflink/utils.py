from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from urllib.parse import urlparse
from utility.msg import send_msg
from utility.utils import reg_test
from fake_useragent import UserAgent
import openai, json, requests

NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")
SCRAPEOPS_API_KEY = getattr(settings, "SCRAPEOPS_API_KEY", "SCRAPEOPS_API_KEY")
OPENAI_ORG = getattr(settings, "OPENAI_ORG", "OPENAI_ORG")
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", "OPENAI_API_KEY")
SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")

#
# Cron functions
#


def delete_expired_dflinks(request):
    url = f"https://api.short.io/api/links?domain_id={SHORT_IO_DOMAIN_ID}&dateSortOrder=desc"
    headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
    response = requests.get(url, headers=headers).json()
    dflinks = response["links"]
    expired_dflink_list = []

    for i in range(len(dflinks) - 1):
        dflink = {
            "dflink": f"https://dgufilm.link/{dflinks[i]['lcpath']}",
            "title": dflinks[i]["title"],
            "category": dflinks[i]["tags"][0],
        }
        expiration_date = timezone.datetime.strptime(
            dflinks[i]["tags"][2], "%Y-%m-%d"
        ).date()
        id_string = dflinks[i]["idString"]
        if expiration_date < timezone.now().date():
            expired_dflink_list.append(dflink)
            url = f"https://api.short.io/links/{id_string}"
            headers = {"Authorization": SHORT_IO_API_KEY}
            response = requests.delete(url, headers=headers)

    if len(expired_dflink_list) > 0:
        send_msg(request, "DLA", "MGT", extra=expired_dflink_list)

    return HttpResponse(f"Number of deleted DFlinks: {len(expired_dflink_list)}")


#
# Sub functions
#


global need_www
need_www = False


def set_headers(type: str):
    if type == "RANDOM":
        headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}
    elif type == "NOTION":
        headers = {
            "Authorization": f"Bearer {NOTION_SECRET}",
            "Accept": "application/json",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        }

    return headers


def chap_gpt(prompt: str):
    openai.organization = OPENAI_ORG
    openai.api_key = OPENAI_API_KEY
    openai.Model.list()

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0,
    }
    openai_response = requests.post(url, headers=headers, data=json.dumps(data)).json()[
        "choices"
    ][0]["message"]["content"]

    return openai_response


def has_www(original_url: str):
    if "://" in original_url:
        original_url = urlparse(original_url).netloc

    if "www." == original_url[:4]:
        result = True
    elif not "www." == original_url[:4]:
        result = False

    return result


def is_right_url(original_url: str):
    global need_www

    try:
        response = requests.get(original_url, headers=set_headers("RANDOM"))
    except:
        try:
            if not has_www(original_url):
                original_url = original_url.replace("://", "://www.")
                response = requests.get(original_url, headers=set_headers("RANDOM"))
                need_www = True
        except:
            response = requests.get(
                url="https://proxy.scrapeops.io/v1/",
                params={
                    "api_key": SCRAPEOPS_API_KEY,
                    "url": original_url,
                },
            )

    try:
        result = True if int(response.status_code) < 400 else False
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
        notion_response["results"][0]["properties"]["URL"]["url"]
        result = True
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
        result = False
    else:
        result = False

    return result


def is_harmfulness(original_url: str):
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
    headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
    response = requests.get(url, headers=headers)

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


def validation(data: dict):
    """
    - data | `dict`:
        - id
        - original_url
        - dflink_slug
        - title
        - request
    """

    id = data["id"]
    original_url = data["original_url"]
    dflink_slug = data["dflink_slug"]
    title = data["title"]
    request = data["request"]

    # try:
    if not is_right_url(original_url):
        status = "FAIL"
        reason = "원본 URL 접속 불가"
        msg = "원본 URL이 잘못 입력된 것 같아요."
        element = "id_original_url"

    elif not is_listed(original_url):
        if not is_well_known(original_url):
            status = "FAIL"
            reason = "allowlist 등재 필요"
            msg = "이 원본 URL은 현재 사용할 수 없어요."
            element = "id_original_url"

        elif not is_harmfulness(original_url):
            status = "FAIL"
            reason = "유해 사이트"
            msg = "이 원본 URL은 사용할 수 없어요."
            element = "id_original_url"

    elif not is_new_slug(id, dflink_slug):
        status = "FAIL"
        reason = "이미 존재하는 동영링크 URL"
        msg = "앗, 이미 존재하는 동영링크 URL이에요!"
        element = "id_dflink_slug"

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

    elif not is_valid(request):
        status = "FAIL"
        reason = "알 수 없는 오류"
        msg = "뭔가 잘못 입력된 것 같아요."
        element = None

    else:
        status = None
        reason = None
        msg = None
        element = None

    # except:
    #     status = "FAIL"
    #     reason = "알 수 없는 오류"
    #     msg = "앗, 다시 한 번 시도해주세요!"
    #     element = None

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
    id = request.GET["id"]

    # id: create_dflink
    if id == "create_dflink":
        original_url = request.GET["original_url"]
        dflink_slug = request.GET["dflink_slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        data = {
            "id": id,
            "original_url": original_url,
            "dflink_slug": dflink_slug,
            "title": title,
            "request": request,
        }
        status, reason, msg, element = validation(data)

        if status == None:
            if need_www:
                original_url = original_url.replace("://", "://www.")
                need_www = False

            url = "https://api.short.io/links"
            payload = {
                "tags": [category, f"{request.user}", expiration_date],
                "domain": "dgufilm.link",
                "allowDuplicates": True,
                "originalURL": original_url,
                "path": dflink_slug,
                "title": title,
            }
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "Authorization": SHORT_IO_API_KEY,
            }
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                status = "DONE"
                reason = "유효성 검사 통과"
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
            },
        }
        if status == "FAIL":
            response["result"].update({"element": element})
        send_msg(request, "DLC", "MGT", response)

    # id: update_dflink
    elif id == "update_dflink":
        string_id = request.GET["string_id"]
        original_url = request.GET["original_url"]
        dflink_slug = request.GET["dflink_slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        data = {
            "id": id,
            "original_url": original_url,
            "dflink_slug": dflink_slug,
            "title": title,
            "request": request,
        }
        status, reason, msg, element = validation(data)

        if status == None:
            if need_www:
                original_url = original_url.replace("://", "://www.")
                need_www = False

            url = f"https://api.short.io/links/{string_id}"
            payload = {
                "tags": [category, f"{request.user}", expiration_date],
                "originalURL": original_url,
                "path": dflink_slug,
                "title": title,
            }
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "Authorization": SHORT_IO_API_KEY,
            }
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                status = "DONE"
                reason = "유효성 검사 통과"
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
            },
        }
        if status == "FAIL":
            response["result"].update({"element": element})
        send_msg(request, "DLU", "MGT", response)

    # id: delete_dflink
    elif id == "delete_dflink":
        string_id = request.GET["string_id"]
        dflink_slug = request.GET["dflink_slug"]

        url = (
            f"https://api.short.io/links/expand?domain=dgufilm.link&path={dflink_slug}"
        )
        headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
        response = requests.get(url, headers=headers).json()
        original_url = response["originalURL"]
        title = response["title"]
        category = response["tags"][0]
        expiration_date = response["tags"][2]

        url = f"https://api.short.io/links/{string_id}"
        headers = {"Authorization": SHORT_IO_API_KEY}
        response = requests.delete(url, headers=headers)
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
