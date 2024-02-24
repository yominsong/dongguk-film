from django.shortcuts import render
from django.core.paginator import Paginator
from .utils import get_project_position
from utility.img import get_hero_img
from utility.utils import notion
import random

#
# Main functions
#


def project(request):
    query_string = ""
    image_list = get_hero_img("project")
    position_list = get_project_position()

    # Notion
    project_list = notion("query", "db", data={"db_name": "project"})
    project_count = len(project_list)

    # Search box
    query = request.GET.get("q")
    search_result_count = None
    search_placeholder = random.choice(project_list[: min(project_count, 7)])["title"] if project_count > 0 else "<영화 제목>"
    
    if query:
        query = query.lower().replace(" ", "")
        search_result_list = []
        for project in project_list:
            for k, v in project.items():
                if k != "staff" and query in v and project not in search_result_list:
                    search_result_list.append(project)
                elif k == "staff":
                    for staff in v:
                        for k, v in staff.items():
                            if query in v and project not in search_result_list:
                                search_result_list.append(project)

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
            "position_list": position_list,
        },
    )
