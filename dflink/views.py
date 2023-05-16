from django.conf import settings
from django.shortcuts import render
from django.core.paginator import Paginator
from users.models import Metadata
import requests

SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")


def dflink(request):
    # Short.io
    url = f"https://api.short.io/api/links?domain_id={SHORT_IO_DOMAIN_ID}&dateSortOrder=desc"
    headers = {"accept": "application/json", "Authorization": SHORT_IO_API_KEY}
    response = requests.get(url, headers=headers).json()
    dflink_count = int(response["count"]) - 1
    dflinks = response["links"]
    dflink_list = []
    for i in range(dflink_count):
        dflink = {
            "id_string": dflinks[i]["idString"],
            "original_url": dflinks[i]["originalURL"],
            "slug": dflinks[i]["path"],
            "title": dflinks[i]["title"],
            "category": dflinks[i]["tags"][0],
            "user": Metadata.objects.get(student_id=dflinks[i]["tags"][1]),
            "expiration_date": dflinks[i]["tags"][2],
        }
        dflink_list.append(dflink)

    # Query
    q = request.GET.get("q")
    query_result_count = None
    query_param = None
    if q:
        query_result_list = []
        for dflink in dflink_list:
            for k, v in dflink.items():
                if k != "user" and q in v and dflink not in query_result_list:
                    query_result_list.append(dflink)
        dflink_list = query_result_list
        query_result_count = len(query_result_list)
        query_param = f"q={q}&"

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(dflink_list, 7)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    return render(
        request,
        "dflink/dflink.html",
        {
            "dflink_count": dflink_count,
            "query_result_count": query_result_count,
            "query_param": query_param,
            "page_value": page_value,
            "page_range": page_range,
        },
    )
