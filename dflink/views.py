from django.conf import settings
from django.shortcuts import render
from django.core.paginator import Paginator
from .utils import short_io


def dflink(request):
    # Short.io
    dflink_list = short_io()
    dflink_count = len(dflink_list)

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
