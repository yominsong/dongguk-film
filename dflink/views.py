from django.shortcuts import render
from django.core.paginator import Paginator
from utility.img import get_hero_img
from utility.utils import short_io, append_item
from gksdudaovld import KoEnMapper
import re, random

with open("dongguk_film/static/words_alpha.txt") as f:
    english_words = set(line.strip().lower() for line in f)

#
# Sub functions
#


def is_valid_english_word(word: str) -> bool:
    return word.lower() in english_words


def search_dflink(query, dflink_list):
    search_result_list = []

    for dflink in dflink_list:
        for k, v in dflink.items():
            k = k.lower().replace(" ", "")
            v = v.lower().replace(" ", "")
            if k != "user" and query in v and dflink not in search_result_list:
                append_item(dflink, search_result_list)

    return search_result_list, len(search_result_list), f"q={query}&"


#
# Main functions
#


def dflink(request):
    query = request.GET.get("q")
    original_query = request.GET.get("oq")
    params = request.GET.copy()
    query_string = ""
    search_result_count = 0

    if original_query:
        dflink_list = request.GET.get("dflinkList")
    else:
        dflink_list = short_io("retrieve")
        params["dflinkList"] = dflink_list
        request.GET = params

    dflink_count = len(dflink_list)

    if query:
        if original_query:
            query = query.replace(" ", "")
        else:
            query = query.replace(" ", "").lower()

        dflink_list, search_result_count, query_string = search_dflink(
            query, dflink_list
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

                return dflink(request)

    if dflink_count > 0:
        selected_link = random.choice(
            request.GET.get("dflinkList")[: min(dflink_count, 7)]
        )
        search_placeholder = random.choice(
            [selected_link["title"], f"dgufilm.link/{selected_link['slug']}"]
        )
    else:
        search_placeholder = "dgufilm.link/example"

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(dflink_list, 7)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    params.pop("dflinkList", None)
    request.GET = params

    return render(
        request,
        "dflink/dflink.html",
        {
            "query_string": query_string,
            "image_list": get_hero_img("dflink"),
            "dflink_count": dflink_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )
