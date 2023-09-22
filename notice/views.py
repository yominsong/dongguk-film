from django.shortcuts import render
from django.core.paginator import Paginator
from django.http import Http404
from django.contrib.auth.models import User
from utility.img import get_hero_img
from utility.utils import notion, convert_datetime
import re, ast

#
# Main functions
#


def notice(request):
    image_list = get_hero_img("notice")

    # Notion
    notice_list = notion("query", "db", data={"db_name": "notice-db"})
    notice_count = len(notice_list)

    # Query
    q = request.GET.get("q")
    query_result_count = None
    query_param = None

    if q:
        q = q.lower().replace(" ", "")
        query_result_list = []
        for notice in notice_list:
            for k, v in notice.items():
                if k != "user" and v is not None:
                    if (
                        k != "img_key_list"
                        and k != "file"
                        and q in v.lower().replace(" ", "")
                    ):
                        if notice not in query_result_list:
                            query_result_list.append(notice)
                    elif k == "img_key_list":
                        for item in v:
                            if q in item:
                                if notice not in query_result_list:
                                    query_result_list.append(notice)
                                break
                    elif k == "file":
                        for file_dict in v:
                            if "name" in file_dict and q in file_dict["name"].lower().replace(" ", ""):
                                if notice not in query_result_list:
                                    query_result_list.append(notice)
                                break

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


def notice_detail(request, page_id):
    image_list = get_hero_img("notice")

    # Notion
    response = notion("retrieve", "page", data={"page_id": page_id})
    if response.status_code != 200:
        raise Http404
    elif response.status_code == 200:
        notice = response.json()
        title = notice["properties"]["Title"]["title"][0]["plain_text"]
        category = notice["properties"]["Category"]["select"]["name"]
        keyword_string = notice["properties"]["Keyword"]["rich_text"][0]["plain_text"]
        keyword_list = re.findall(r"#\w+", keyword_string)
        student_id = str(notice["properties"]["User"]["number"])
        user = User.objects.get(username=student_id)
        name = user.metadata.name
        profile_img = user.socialaccount_set.all()[0].get_avatar_url()
        try:
            file_string = notice["properties"]["File"]["rich_text"][0]["plain_text"]
            file_dict = ast.literal_eval(file_string)
        except:
            file_string = None
            file_dict = None
        listed_time = notice["properties"]["Listed time"]["created_time"]
        listed_time = convert_datetime(listed_time).strftime("%Y-%m-%d")

        notice = {
            "page_id": page_id,
            "title": title,
            "category": category,
            "keyword": {"string": keyword_string, "list": keyword_list},
            "user": {
                "student_id": student_id,
                "name": name,
                "profile_img": profile_img,
            },
            "file": {"string": file_string, "dict": file_dict},
            "listed_date": listed_time,
        }

        notice["content"] = notion(
            "retrieve", "block_children", data={"page_id": page_id}
        )[1]

    return render(
        request,
        "notice/notice_detail.html",
        {"image_list": image_list, "notice": notice},
    )
