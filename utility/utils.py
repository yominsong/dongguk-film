from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib.auth.models import User
import requests, json

#
# Main functions
#


def update_dmd_cookie(request):
    if "23:59" < timezone.now().strftime("%H:%M") < "00:01":
        response = requests.get("https://dgufilm.link/get-dmd-cookie")
        cookie = response.text.rstrip()
        if "WMONID" in cookie:
            with open("secrets.json", "r+") as f:
                data = json.load(f)
                data["DMD_COOKIE"] = cookie
                f.seek(0)
                f.write(json.dumps(data, indent=4))
                f.truncate()
    return HttpResponse(status=200)
