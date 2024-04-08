from django.shortcuts import render
from django.core.paginator import Paginator
from equipment.utils import get_equipment_data
from .utils import get_project_policy
from utility.img import get_hero_img
from utility.utils import notion, append_item
import random

#
# Main functions
#


def project(request):
    query_string = ""
    image_list = get_hero_img("project")
    purpose_list = get_equipment_data("purpose")
    position_list = get_project_policy("position")

    for purpose in purpose_list:
        if purpose["for_instructor"] == True:
            purpose_list.remove(purpose)

    # Notion
    project_list = notion("query", "db", data={"db_name": "project"})
    project_count = len(project_list)

    # Search box
    query = request.GET.get("q")
    search_result_count = None
    search_placeholder = (
        random.choice(project_list[: min(project_count, 7)])["title"]
        if project_count > 0
        else "<영화 제목>"
    )

    if query:
        query = query.lower().replace(" ", "")
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
                        full_searchable_text += v.get("keyword", "").lower().replace(" ", "")
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

        project_list = search_result_list
        search_result_count = len(search_result_list)
        query_string += f"q={query}&"

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(project_list, 7)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    return render(
        request,
        "project/project.html",
        {
            "query_string": query_string,
            "image_list": image_list,
            "project_count": project_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "page_value": page_value,
            "page_range": page_range,
            "purpose_list": purpose_list,
            "position_list": position_list,
        },
    )
