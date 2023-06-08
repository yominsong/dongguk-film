from django.conf import settings
from django.shortcuts import render
from users.models import Metadata
import requests

SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")


def home(request):
    # url = f"https://api.short.io/api/links?domain_id={SHORT_IO_DOMAIN_ID}&dateSortOrder=desc"
    # headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
    # response = requests.get(url, headers=headers).json()
    # dflinks = response["links"]
    dflink_list = []
    # for i in range(len(dflinks) - 1):
    #     dflink = {
    #         "id_string": dflinks[i]["idString"],
    #         "original_url": dflinks[i]["originalURL"],
    #         "slug": dflinks[i]["path"],
    #         "title": dflinks[i]["title"],
    #         "category": dflinks[i]["tags"][0],
    #         "user": Metadata.objects.get(student_id=dflinks[i]["tags"][1]),
    #         "expiration_date": dflinks[i]["tags"][2],
    #     }
        # dflink_list.append(dflink)
    return render(request, "home/home.html", {"dflink_list": dflink_list})


def error_400(request, exception):
    return render(request, "error/400.html")


def error_404(request, exception):
    return render(request, "error/404.html")


def error_408(request, exception):
    return render(request, "error/408.html")


def error_500(request):
    return render(request, "error/500.html")


def error_502(request, exception):
    return render(request, "error/502.html")
