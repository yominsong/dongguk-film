from django.shortcuts import render
from django.core.paginator import Paginator
from utility.img import get_hero_img
from utility.utils import get_workspace_data
import random

#
# Main functions
#


def workspace(request):
    query_string = ""
    image_list = get_hero_img("workspace")
    category_list = get_workspace_data("category")
    category_list_count = len(category_list)

    # Search box
    query = request.GET.get("q")
    search_result_count = None
    search_placeholder = random.choice(category_list)["keyword"]

    if query:
        query = query.lower().replace(" ", "")
        query_result_list = []

        for category in category_list:
            unit_keyword = category.get("unit_keyword", None)
            unit_keyword = unit_keyword.lower().replace(" ", "") if unit_keyword else ""
            
            searchable_text = (
                category.get("name", "").lower().replace(" ", "")
                + category.get("priority", "").lower().replace(" ", "")
                + category.get("keyword", "").lower().replace(" ", "")
                + category.get("room_code", "").lower().replace(" ", "")
                + unit_keyword
            )
            
            if query in searchable_text:
                query_result_list.append(category)

        category_list = query_result_list
        search_result_count = len(query_result_list)
        query_string += f"q={query}&"
    
    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(category_list, 7)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    return render(
        request,
        "workspace/workspace.html",
        {
            "query_string": query_string,
            "image_list": image_list,
            "category_list_count": category_list_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )