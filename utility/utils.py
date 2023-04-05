from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from users.models import Vcode
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from .msg import send_msg
import openai, json, requests

OPENAI_ORG = getattr(settings, "OPENAI_ORG", "OPENAI_ORG")
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", "OPENAI_API_KEY")

#
# Cron functions
#


def update_dmd_cookie(request):
    with Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=3))
        response = session.get("https://util.dgufilm.link/get-dmd-cookie")
        cookie = response.text.rstrip()

    if "WMONID" in cookie:
        with open("secrets.json", "r+") as f:
            data = json.load(f)
            data["DMD_COOKIE"] = cookie
            f.seek(0)
            f.write(json.dumps(data, indent=4))
            f.truncate()

    return HttpResponse(f"dmd-cookie: {cookie}")


#
# Main functions
#


def dflink(request):
    # id: validate_site
    if request.GET["id"] == "validate_site":
        id = request.GET["id"]
        original_url = request.GET["original_url"]
        slug = request.GET["slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

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
                    "content": f"{original_url}\n(1) Whether the site exists\n(2) Whether the site is not harmful to young people\nAnswer only with 'true' or 'false'.",
                }
            ],
            "temperature": 0.7,
        }
        openai_response = requests.post(
            url, headers=headers, data=json.dumps(data)
        ).json()
        validation_result = openai_response["choices"][0]["message"]["content"]
        available = str(validation_result).split("\n")[0]
        if not "true" in available:
            status = "FAIL"
            msg = "앗, 원본 URL이 잘못 입력된 것 같아요."
            concern = "unavailable"
        elif "true" in available:
            harmful = str(validation_result).split("\n")[1]
            if not "true" in harmful:
                status = "FAIL"
                msg = "이 원본 URL은 사용할 수 없어요."
                concern = "harmful"
        else:
            status = "DONE"
            msg = "동영링크를 만들었어요! 👍"
            concern = None
        send_msg(
            request,
            "DFL",
            "MGT",
            extra={
                "status": status,
                "concern": concern,
                "original_url": original_url,
                "dflink": f"https://dgufilm.link/{slug}",
                "title": title,
                "category": category,
                "expiration_date": expiration_date,
            },
        )

    response = {"id": id, "result": {"status": status, "msg": msg, "concern": concern}}

    return JsonResponse(response)
