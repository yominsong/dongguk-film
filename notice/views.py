from django.conf import settings
from django.shortcuts import render
from django.core.paginator import Paginator
from django.http import Http404
from django.contrib.auth.models import User
from utility.img import get_hero_img
from utility.utils import get_permission_type_list, notion, parse_datetime
from bs4 import BeautifulSoup
from gksdudaovld import KoEnMapper
import re, ast, random

with open("dongguk_film/static/words_alpha.txt") as f:
    english_words = set(line.strip().lower() for line in f)

#
# Global variables
#

AWS = getattr(settings, "AWS", None)
AWS_REGION_NAME = AWS["REGION_NAME"]
AWS_S3_BUCKET_NAME = AWS["S3"]["BUCKET_NAME"]

NOTION = getattr(settings, "NOTION", None)
NOTION_SECRET = NOTION["SECRET"]
NOTION_DB_ID = NOTION["DB_ID"]

#
# Sub functions
#


def is_valid_english_word(word: str) -> bool:
    return word.lower() in english_words


def search_notice(query, notice_list):
    search_result_list = []

    for notice in notice_list:
        try:
            user_name = User.objects.get(
                pk=str(notice.get("user", "")).lower().replace(" ", "")
            ).metadata.name
        except User.DoesNotExist:
            user_name = ""

        searchable_text = (
            notice.get("notice_id", "").lower().replace(" ", "")
            + notice.get("title", "").lower().replace(" ", "")
            + notice.get("category", "").lower().replace(" ", "")
            + notice.get("keyword", "").lower().replace(" ", "")
            + notice.get("listed_date", "").lower().replace(" ", "")
            + user_name
        )
        
        data = {"page_id": notice["page_id"]}

        content = notion("retrieve", "block_children", data)[1]

        content_search = remove_html_tags(content).lower().replace(" ", "")

        img_key_list_search = "".join(
            item.replace("_", "").lower() for item in notice.get("img_key_list", [])
        )
        file_name_search = "".join(
            file["name"].lower().replace(" ", "").replace("_", "")
            for file in notice.get("file", [])
        )
        full_searchable_text = (
            searchable_text + img_key_list_search + file_name_search + content_search
        )

        if query in full_searchable_text:
            search_result_list.append(notice)

    return search_result_list, len(search_result_list), f"q={query}&"


def remove_html_tags(html_string: str) -> str:
    soup = BeautifulSoup(html_string, "html.parser")

    return soup.get_text()


#
# Main functions
#


def notice(request):
    query = request.GET.get("q")
    original_query = request.GET.get("oq")
    params = request.GET.copy()
    query_string = ""
    search_result_count = 0

    if original_query:
        notice_list = request.GET.get("noticeList")
    else:
        notice_list = notion("query", "db", data={"db_name": "NOTICE"})
        params["noticeList"] = notice_list
        request.GET = params

    notice_count = len(notice_list)

    if query:
        if original_query:
            query = query.replace(" ", "")
        else:
            query = query.replace(" ", "").lower()

        notice_list, search_result_count, query_string = search_notice(
            query, notice_list
        )

        if search_result_count == 0:
            if original_query:
                params["q"] = request.GET.get("oq")
                params["oq"] = None
                request.GET = params
            elif re.fullmatch(r"[가-힣ㄱ-ㅎㅏ-ㅣ]+", query):
                ko2en_query = KoEnMapper.conv_ko2en(" ".join(query.split()))

                if is_valid_english_word(ko2en_query):
                    params["s"] = ko2en_query
                    request.GET = params
            elif query.isascii() and query.isalpha():
                query = request.GET.get("q")
                params["q"] = KoEnMapper.conv_en2ko(" ".join(query.split()))
                params["oq"] = query
                request.GET = params

                return notice(request)

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
        "전주국제영화제 ACADEMY 배지",
        "교직과정",
        "계절학기",
        "졸업논문",
        "성적처리",
        "부산국제영화제 시네필",
        "부산국제영화제",
    ]

    search_placeholder = (
        random.choice(request.GET.get("noticeList")[: min(notice_count, 7)])["title"]
        if notice_count > 0
        else random.choice(default_search_placeholder_list)
    )

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(notice_list, 7)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    params.pop("noticeList", None)
    request.GET = params

    return render(
        request,
        "notice/notice.html",
        {
            "query_string": query_string,
            "image_list": get_hero_img("notice"),
            "notice_count": notice_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "page_value": page_value,
            "page_range": page_range,
            "permission_type_list": get_permission_type_list(request),
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
        data={"db_name": "NOTICE", "filter": filter},
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
        pk = int(properties["User"]["rich_text"][0]["plain_text"])
        user = None
        name = "사용자"
        profile_img = "/static/images/d_dot_f_logo.jpg"

        try:
            user = User.objects.get(pk=pk)
        except:
            pass

        if user:
            try:
                name = user.metadata.name
                profile_img = user.socialaccount_set.all()[0].get_avatar_url()
            except:
                pass

        try:
            file_string = notice["properties"]["File"]["rich_text"][0]["plain_text"]
            file_dict = ast.literal_eval(file_string)
        except:
            file_string = None
            file_dict = None

        listed_time = notice["properties"]["Listed time"]["created_time"]
        listed_time = parse_datetime(listed_time).strftime("%Y-%m-%d")

        notice = {
            "page_id": page_id,
            "notice_id": notice_id,
            "title": title,
            "category": category,
            "keyword": {"string": keyword_string, "list": keyword_list},
            "user": {
                "pk": pk,
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
        {
            "image_list": image_list,
            "notice": notice,
            "AWS_S3_BUCKET_NAME": AWS_S3_BUCKET_NAME,
            "AWS_REGION_NAME": AWS_REGION_NAME,
            "permission_type_list": get_permission_type_list(request),
        },
    )
