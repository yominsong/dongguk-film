from django.shortcuts import render
from django.core.paginator import Paginator
from equipment.utils import get_equipment_data
from .utils import get_project_policy
from utility.img import get_hero_img
from utility.utils import airtable, append_item
from gksdudaovld import KoEnMapper
import re, random

with open("dongguk_film/static/words_alpha.txt") as f:
    english_words = set(line.strip().lower() for line in f)

#
# Sub functions
#


def is_valid_english_word(word: str) -> bool:
    return word.lower() in english_words


def search_project(query, project_list):
    search_result_list = []

    for project in project_list:
        full_searchable_text = ""

        for k, v in project.items():
            if k not in [
                "page_id",
                "user",
                "director",
                "producer",
                "producer_student_id",
            ]:
                if isinstance(v, dict) and k == "purpose":
                    full_searchable_text += (
                        v.get("keyword", "").lower().replace(" ", "")
                    )
                elif isinstance(v, str):
                    full_searchable_text += v.lower().replace(" ", "")

        for staff in ["staff"]:
            for person in project.get(staff, []):
                person_str = "".join(
                    str(v).lower().replace(" ", "")
                    for k, v in person.items()
                    if isinstance(v, str)
                )
                full_searchable_text += person_str

        if query in full_searchable_text:
            append_item(project, search_result_list)

    return search_result_list, len(search_result_list), f"q={query}&"


#
# Main functions
#


def project(request):
    query = request.GET.get("q")
    original_query = request.GET.get("oq")
    params = request.GET.copy()
    query_string = ""
    search_result_count = 0

    if original_query:
        project_list = request.GET.get("projectList")
    else:
        data = {
            "table_name": "project-team",
            "params": {"formula": f"FIND('🟢', Validation)"},
        }

        project_list = airtable("get_all", "records", data)
        params["projectList"] = project_list
        request.GET = params

    project_count = len(project_list)

    if query:
        if original_query:
            query = query.replace(" ", "")
        else:
            query = query.replace(" ", "").lower()

        project_list, search_result_count, query_string = search_project(
            query, project_list
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

                return project(request)

    search_placeholder = (
        random.choice(request.GET.get("projectList")[: min(project_count, 7)])[
            "film_title"
        ]
        if project_count > 0
        else "<영화 제목>"
    )

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(project_list, 7)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    purpose_list = get_equipment_data("purpose")

    for purpose in purpose_list:
        if purpose["is_for_instructor"] == True:
            purpose_list.remove(purpose)

    params.pop("projectList", None)
    request.GET = params

    return render(
        request,
        "project/project.html",
        {
            "query_string": query_string,
            "image_list": get_hero_img("project"),
            "project_count": project_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "page_value": page_value,
            "page_range": page_range,
            "purpose_list": purpose_list,
            "position_list": get_project_policy("position"),
        },
    )
