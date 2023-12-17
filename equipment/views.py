from django.shortcuts import render
from django.core.paginator import Paginator
from utility.img import get_hero_img
from utility.utils import notion
import random


def equipment(request):
    sort = request.GET.get("sort", "ascending")
    category = request.GET.get("category", "Cameras")
    grade = request.GET.get("grade", "4학년")
    purpose = request.GET.get("purpose", "전공과목 수업")

    image_list = get_hero_img("equipment")
    param = ""

    # Notion
    data = {
        "db_name": "equipment",
        "filter_property": ["zI~%5E", "H%3ENe"],
        "filter": {
            "and": [
                {"property": "Validation", "formula": {"string": {"contains": "🟢"}}},
                {
                    "property": "Category",
                    "rollup": {"every": {"select": {"equals": category}}},
                },
                {
                    "property": "Allocated quantity per grade",
                    "rollup": {"every": {"rich_text": {"does_not_contain": f"{grade} 00"}}},
                },
                {
                    "property": "Allocated quantity per purpose",
                    "rollup": {"every": {"rich_text": {"does_not_contain": f"{purpose} 00"}}},
                },
            ]
        },
        "sort": [
            {"property": "Category order", "direction": "ascending"},
            {"property": "Title", "direction": sort},
        ]
    }
    equipment_list = notion("query", "db", data=data)
    equipment_count = len(equipment_list)
    param += f"sort={sort}&category={category}&grade={grade}&purpose={purpose}&"

    # Query
    q = request.GET.get("q")
    query_result_count = None
    placeholder = ""

    if q:
        q = q.lower().replace(" ", "")
        query_result_list = []
        for equipment in equipment_list:
            for k, v in equipment.items():
                if v is not None:
                    if equipment not in query_result_list:
                        if q in v.lower().replace(" ", ""):
                            query_result_list.append(equipment)

        equipment_list = query_result_list
        query_result_count = len(query_result_list)
        param += f"q={q}&"
    else:
        placeholder = random.choice(equipment_list)["title"]

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1
    paginator = Paginator(equipment_list, 16)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    return render(
        request,
        "equipment/equipment.html",
        {
            "image_list": image_list,
            "param": param,
            "equipment_count": equipment_count,
            "query_result_count": query_result_count,
            "placeholder": placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )
