from django.conf import settings
from django.shortcuts import render
from users.models import Metadata
import requests

SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")


def dflink(request):
    url = f"https://api.short.io/api/links?domain_id={SHORT_IO_DOMAIN_ID}&limit=5&dateSortOrder=desc"
    headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
    response = requests.get(url, headers=headers).json()
    dflinks = response["links"]
    dflink_list = []
    for i in range(len(dflinks) - 1):
        dflink = {
            "slug": dflinks[i]["lcpath"],
            "title": dflinks[i]["title"],
            "category": dflinks[i]["tags"][0],
            "expiration_date": dflinks[i]["tags"][1],
            "user": Metadata.objects.get(student_id=dflinks[i]["tags"][2]).name,
        }
        dflink_list.append(dflink)

    return render(request, "dflink/dflink.html", {"dflink_list": dflink_list})
