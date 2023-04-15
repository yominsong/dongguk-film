from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from utility.msg import send_msg
from utility.utils import reg_test
from fake_useragent import UserAgent
import openai, json, requests

SCRAPEOPS_API_KEY = getattr(settings, "SCRAPEOPS_API_KEY", "SCRAPEOPS_API_KEY")
OPENAI_ORG = getattr(settings, "OPENAI_ORG", "OPENAI_ORG")
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", "OPENAI_API_KEY")
SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")
headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}

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
        send_msg(request, "DLD", "MGT", extra=expired_dflink_list)

    return HttpResponse(f"Number of deleted DFlinks: {len(expired_dflink_list)}")


#
# Sub functions
#


def chap_gpt(prompt):
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


def is_right_url(original_url):
    try:
        response = requests.get(original_url, headers=headers)
        if response.status_code == 200:
            result = True
        else:
            response = requests.get(
                url="https://proxy.scrapeops.io/v1/",
                params={
                    "api_key": SCRAPEOPS_API_KEY,
                    "url": original_url,
                },
            )
            result = True if response.status_code == 200 else False
    except:
        result = False
    return result


def add_www_if_needed(original_url):
    if not "www." in original_url and not is_right_url(original_url):
        result = original_url.replace("://", "://www.")
    else:
        result = original_url
    return result


def is_available(original_url):
    try:
        result = is_right_url(original_url)
    except:
        try:
            result = is_available(add_www_if_needed(original_url))
        except:
            result = False
    return result


def is_well_known(original_url):
    openai_response = chap_gpt(f"{original_url}\n알고 있는 사이트인지 'True' 또는 'False'로만 답해줘.")

    if "True" in openai_response:
        result = True
    elif "False" in openai_response:
        result = False
    else:
        result = False

    return result


def is_harmfulness(original_url):
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


def is_new_slug(dflink_slug):
    url = f"https://api.short.io/links/expand?domain=dgufilm.link&path={dflink_slug}"
    headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
    response = requests.get(url, headers=headers)

    result = False if response.status_code == 200 else True

    return result


def is_not_swearing(dflink_slug_or_title):
    openai_response = chap_gpt(
        f"'{dflink_slug_or_title}'이라는 말에 폭력적인 표현, 선정적인 표현, 성차별적인 표현이 전혀 없는지 'True' 또는 'False'로만 답해줘."
    )

    if "True" in openai_response:
        result = True
    elif "False" in openai_response:
        result = False
    else:
        result = False

    return result


def validation(request):
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


#
# Main functions
#


def dflink(request):
    # id: create_dflink
    if request.GET["id"] == "create_dflink":
        id = request.GET["id"]
        original_url = request.GET["original_url"]
        dflink_slug = request.GET["dflink_slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        if not is_available(original_url):
            status = "FAIL"
            reason = "무효(접속 불가)"
            msg = "원본 URL이 잘못 입력된 것 같아요."
            element = "id_original_url"

        elif not is_well_known(original_url):
            status = "FAIL"
            reason = "무효(유효성 검사 불가)"
            msg = "이 원본 URL은 관리자의 검토가 필요해요."
            element = "id_original_url"

        elif not is_harmfulness(original_url):
            status = "FAIL"
            reason = "무효(유해 사이트)"
            msg = "이 원본 URL은 사용할 수 없어요."
            element = "id_original_url"

        elif not is_new_slug(dflink_slug):
            status = "FAIL"
            reason = "무효(중복)"
            msg = "앗, 이미 존재하는 동영링크 URL이에요!"
            element = "id_dflink_slug"

        elif not is_not_swearing(dflink_slug):
            status = "FAIL"
            reason = "무효(비속어 또는 욕설)"
            msg = "이 동영링크 URL은 사용할 수 없어요."
            element = "id_dflink_slug"

        elif not is_not_swearing(title):
            status = "FAIL"
            reason = "무효(비속어 또는 욕설)"
            msg = "이 제목은 사용할 수 없어요."
            element = "id_title"

        else:
            original_url = add_www_if_needed(original_url)

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
                reason = "유효"
                msg = "동영링크를 만들었어요! 👍"
            elif (
                response.status_code == 409
                and response.json()["error"] == "Link already exists"
            ):
                status = "FAIL"
                reason = "무효(중복)"
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

    send_msg(request, "DLC", "MGT", extra=response)

    return JsonResponse(response)
