from django.shortcuts import render
from django.core.paginator import Paginator
from utility.img import get_hero_img
from utility.utils import short_io
import random

#
# Main functions
#


def dflink(request):
    search_params = ""
    image_list = get_hero_img("dflink")

    # Short.io
    dflink_list = short_io("retrieve")
    dflink_count = len(dflink_list)

    # Query
    query = request.GET.get("q")
    query_result_count = None

    if dflink_count > 0:
        selected_link = random.choice(dflink_list[: min(dflink_count, 7)])
        query_placeholder = random.choice(
            [selected_link["title"], f"dgufilm.link/{selected_link['slug']}"]
        )
    else:
        query_placeholder = "dgufilm.link/example"

    if query:
        query = query.lower().replace(" ", "")
        query_result_list = []
        for dflink in dflink_list:
            for k, v in dflink.items():
                k = k.lower().replace(" ", "")
                v = v.lower().replace(" ", "")
                if k != "user" and query in v and dflink not in query_result_list:
                    query_result_list.append(dflink)
        dflink_list = query_result_list
        query_result_count = len(query_result_list)
        search_params += f"q={query}&"

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
            "search_params": search_params,
            "image_list": image_list,
            "dflink_count": dflink_count,
            "query_result_count": query_result_count,
            "query_placeholder": query_placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )
