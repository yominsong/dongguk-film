from django.conf import settings
from django.http import JsonResponse
from utility.msg import send_msg
import openai, json, requests

OPENAI_ORG = getattr(settings, "OPENAI_ORG", "OPENAI_ORG")
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", "OPENAI_API_KEY")

#
# Main functions
#


def branded_link(request):
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
                    "content": f"{original_url}\n(1) 존재하는 사이트인지\n(2) 청소년에게 유해하지 않은 사이트인지\n번호에 맞춰 'True' 또는 'False'로만 답해줘.",
                }
            ],
            "temperature": 0.7,
        }
        openai_response = requests.post(
            url, headers=headers, data=json.dumps(data)
        ).json()
        validation_result = openai_response["choices"][0]["message"]["content"]
        status = None
        msg = None
        concern = None
        available = str(validation_result).split("\n")[0]
        if not "True" in available:
            status = "FAIL"
            msg = "앗, 원본 URL이 잘못 입력된 것 같아요."
            concern = "unavailable"
        elif "True" in available:
            harmful = str(validation_result).split("\n")[1]
            if not "True" in harmful:
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
