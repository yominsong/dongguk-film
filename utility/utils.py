from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from users.models import Vcode
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from .msg import send_msg
import openai, json, requests

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


def ai(request):
    # id: validate_site
    if request.GET["id"] == "validate_site":
        id = request.GET["id"]
        original_url = request.GET["original_url"]
        dflink = request.GET["dflink"]
        title = request.GET["title"]

        openai.organization = "org-OfbeZYoH3To8cRQJn4Y04evT"
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
                    "content": f"{original_url}\n(1) 존재하는 사이트인지\n(2) 청소년에게 유해한 사이트인지\n'예' 또는 '아니오'로만 답해줘.",
                }
            ],
            "temperature": 0.7,
        }
        openai_response = requests.post(
            url, headers=headers, data=json.dumps(data)
        ).json()
        validation_result = openai_response["choices"][0]["message"]["content"]
        available = str(validation_result).split("\n")[0]
        harmful = str(validation_result).split("\n")[1]

        if "아니오" in available:
            status = "FAIL"
            msg = "동영링크를 만들 수 없어요."
            concern = "unavailable"
            send_msg(
                request,
                "DFF",
                "MGT",
                extra={
                    "original_url": original_url,
                    "dflink": dflink,
                    "title": title,
                    "concern": concern,
                },
            )
        elif not "아니오" in harmful:
            status = "FAIL"
            msg = "동영링크를 만들 수 없어요."
            concern = "harmful"
            send_msg(
                request,
                "DFF",
                "MGT",
                extra={
                    "original_url": original_url,
                    "dflink": dflink,
                    "title": title,
                    "concern": concern,
                },
            )
        else:
            status = "DONE"
            msg = "동영링크가 저장되었어요!"
            concern = None
            send_msg(
                request,
                "DFD",
                "MGT",
                extra={
                    "original_url": original_url,
                    "dflink": dflink,
                    "title": title,
                },
            )

    response = {"id": id, "result": {"status": status, "msg": msg, "concern": concern}}

    return JsonResponse(response)
