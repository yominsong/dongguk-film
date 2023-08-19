from django.shortcuts import render
from django.core.paginator import Paginator
from utility.img import get_img
from utility.utils import notion

#
# Main functions
#


def notice(request):
    image_list = get_img("notice")

    # Notion
    notice_list = notion("query", "db", {"db_name": "notice-db"})
    notice_count = len(notice_list)

    # Query
    q = request.GET.get("q")
    query_result_count = None
    query_param = None
    if q:
        query_result_list = []
        for notice in notice_list:
            for k, v in notice.items():
                if (
                    k != "user"
                    and (
                        (k != "file" and q.lower() in v.lower())
                        or (
                            k == "file"
                            and v is not None
                            and q.lower() in v["name"].lower()
                        )
                    )
                    and notice not in query_result_list
                ):
                    query_result_list.append(notice)
        notice_list = query_result_list
        query_result_count = len(query_result_list)
        query_param = f"q={q}&"

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(notice_list, 7)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    return render(
        request,
        "notice/notice.html",
        {
            "image_list": image_list,
            "notice_count": notice_count,
            "query_result_count": query_result_count,
            "query_param": query_param,
            "page_value": page_value,
            "page_range": page_range,
        },
    )
