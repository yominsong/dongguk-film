from django.shortcuts import render
from django.core.paginator import Paginator
from django.http import Http404
from django.contrib.auth.models import User
from utility.img import get_hero_img
from utility.utils import notion, convert_datetime, append_item
import re, ast, random

#
# Main functions
#


def notice(request):
    query_string = ""
    image_list = get_hero_img("notice")

    # Notion
    notice_list = notion("query", "db", data={"db_name": "notice"})
    notice_count = len(notice_list)
    operator_list = notion("query", "db", data={"db_name": "operator"})
    has_notice_permission = False

    for operator in operator_list:
        if operator["student_id"] == request.user.username:
            has_notice_permission = True
            break

    # Search box
    query = request.GET.get("q")
    search_result_count = None
    default_search_placeholder_list = [
        "복학 신청",
        "희망강의 신청",
        "수강신청",
        "등록금 납부",
        "학위수여식",
        "촬영 협조공문",
        "제작지원비",
        "학교현장실습",
        "캡스톤디자인",
        "전주국제영화제",
        "교직과정",
        "계절학기",
        "졸업논문",
        "성적처리",
        "부산국제영화제 시네필",
        "부산국제영화제",
    ]
    search_placeholder = (
        random.choice(notice_list[: min(notice_count, 7)])["title"]
        if notice_count > 0
        else random.choice(default_search_placeholder_list)
    )

    if query:
        query = query.lower().replace(" ", "")
        search_result_list = []

        for notice in notice_list:
            searchable_text = (
                notice.get("notice_id", "").lower().replace(" ", "")
                + notice.get("title", "").lower().replace(" ", "")
                + notice.get("category", "").lower().replace(" ", "")
                + notice.get("keyword", "").lower().replace(" ", "")
                + notice.get("listed_date", "").lower().replace(" ", "")
                + User.objects.get(
                    username=notice.get("user", "").lower().replace(" ", "")
                ).metadata.name
            )

            img_key_list_search = "".join(
                item.replace("_", "").lower() for item in notice.get("img_key_list", [])
            )
            file_name_search = "".join(
                file["name"].lower().replace(" ", "").replace("_", "")
                for file in notice.get("file", [])
            )
            full_searchable_text = (
                searchable_text + img_key_list_search + file_name_search
            )

            if query in full_searchable_text:
                search_result_list.append(notice)

        notice_list = search_result_list
        search_result_count = len(search_result_list)
        query_string += f"q={query}&"

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
            "query_string": query_string,
            "image_list": image_list,
            "notice_count": notice_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "has_notice_permission": has_notice_permission,
            "page_value": page_value,
            "page_range": page_range,
        },
    )


def notice_detail(request, notice_id):
    image_list = get_hero_img("notice")

    # Notion
    filter = {
        "property": "ID",
        "formula": {"string": {"equals": notice_id}},
    }

    page_id = notion(
        "query",
        "db",
        data={"db_name": "notice", "filter": filter},
    )[
        0
    ]["page_id"]

    response = notion("retrieve", "page", data={"page_id": page_id})

    if response.status_code != 200 or response.json()["archived"]:
        raise Http404
    elif response.status_code == 200:
        notice = response.json()
        properties = notice["properties"]

        title = properties["Title"]["title"][0]["plain_text"]
        category = properties["Category"]["select"]["name"]
        keyword_string = properties["Keyword"]["rich_text"][0]["plain_text"]
        keyword_list = re.findall(r"#\w+", keyword_string)
        student_id = str(properties["User"]["number"])

        user = None
        name = "사용자"
        profile_img = "/static/images/d_dot_f_logo.jpg"

        try:
            user = User.objects.get(username=student_id)
        except:
            pass

        if user:
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
            "notice_id": notice_id,
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
