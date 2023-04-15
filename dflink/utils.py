from django.conf import settings
from django.http import JsonResponse
from utility.msg import send_msg
from utility.utils import reg_test
from fake_useragent import UserAgent
import openai, json, requests

SCRAPEOPS_API_KEY = getattr(settings, "SCRAPEOPS_API_KEY", "SCRAPEOPS_API_KEY")
OPENAI_ORG = getattr(settings, "OPENAI_ORG", "OPENAI_ORG")
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", "OPENAI_API_KEY")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")
headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}

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


def is_available(original_url):
    try:
        response = requests.get(original_url)
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
        f"{original_url}\n유해하지 않은 사이트인지 'True' 또는 'False'로만 답해줘."
    )

    if "True" in openai_response:
        result = True
    elif "False" in openai_response:
        result = False
    else:
        result = False

    return result


def is_new_slug(slug):
    url = f"https://api.short.io/links/expand?domain=dgufilm.link&path={slug}"
    headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
    response = requests.get(url, headers=headers)

    result = False if response.status_code == 200 else True

    return result


def validation(request):
    original_url = request.GET["original_url"]
    slug = request.GET["slug"]
    expiration_date = request.GET["expiration_date"]

    try:
        result = (
            True
            if (
                reg_test(original_url, "URL")
                and reg_test(slug, "LRN")
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
        slug = request.GET["slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        if not is_available(original_url):
            status = "FAIL"
            reason = "무효(접속 불가)"
            msg = "원본 URL이 잘못 입력된 것 같아요."

        elif not is_well_known(original_url):
            status = "FAIL"
            reason = "무효(유효성 검사 불가)"
            msg = "이 원본 URL은 관리자 승인이 필요해요."

        elif not is_harmfulness(original_url):
            status = "FAIL"
            reason = "무효(유해 사이트)"
            msg = "이 원본 URL은 사용할 수 없어요."

        elif not is_new_slug(slug):
            status = "FAIL"
            reason = "무효(중복)"
            msg = "앗, 이미 존재하는 동영링크 URL이에요!"

        else:
            url = "https://api.short.io/links"
            payload = {
                "tags": [category, expiration_date, f"{request.user}"],
                "domain": "dgufilm.link",
                "allowDuplicates": True,
                "originalURL": original_url,
                "path": slug,
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
                reason = "already exist"
                msg = "앗, 이미 존재하는 동영링크 URL이에요!"

    response = {
        "id": id,
        "result": {
            "status": status,
            "reason": reason,
            "msg": msg,
            "original_url": original_url,
            "dflink": f"https://dgufilm.link/{slug}",
            "title": title,
            "category": category,
            "expiration_date": expiration_date,
            "user": f"{request.user}",
        },
    }

    send_msg(request, "DFL", "MGT", extra=response)

    return JsonResponse(response)
