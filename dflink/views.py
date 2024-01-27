from django.shortcuts import render
from django.core.paginator import Paginator
from utility.img import get_hero_img
from utility.utils import short_io
import random

#
# Main functions
#


def dflink(request):
    query_string = ""
    image_list = get_hero_img("dflink")

    # Short.io
    dflink_list = short_io("retrieve")
    dflink_count = len(dflink_list)

    # Search box
    query = request.GET.get("q")
    search_result_count = None

    if dflink_count > 0:
        selected_link = random.choice(dflink_list[: min(dflink_count, 7)])
        search_placeholder = random.choice(
            [selected_link["title"], f"dgufilm.link/{selected_link['slug']}"]
        )
    else:
        search_placeholder = "dgufilm.link/example"

    if query:
        query = query.lower().replace(" ", "")
        search_result_list = []
        for dflink in dflink_list:
            for k, v in dflink.items():
                k = k.lower().replace(" ", "")
                v = v.lower().replace(" ", "")
                if k != "user" and query in v and dflink not in search_result_list:
                    search_result_list.append(dflink)

        dflink_list = search_result_list
        search_result_count = len(search_result_list)
        query_string += f"q={query}&"

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
            "query_string": query_string,
            "image_list": image_list,
            "dflink_count": dflink_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )
