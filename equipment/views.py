from django.shortcuts import render
from django.core.paginator import Paginator
from .utils import get_equipment_category_or_policy
from utility.img import get_hero_img
from utility.utils import notion
import random


def equipment(request):
    sort = request.GET.get("sort", "ascending")
    category = request.GET.get("category", "A")
    policy = request.GET.get("policy", "A")

    image_list = get_hero_img("equipment")
    category_list = get_equipment_category_or_policy("category")
    policy_list = get_equipment_category_or_policy("policy")
    param = ""

    # Notion
    data = {
        "db_name": "equipment-display",
        "filter_property": [
            "zI~%5E",  # Product name
            "aULM",  # Subcategory
            "pBcK",  # Brand
            "Uf%60r",  # Model
            "Gk~F",  # Available quantity
        ],
        "filter": {
            "and": [
                {"property": "Validation", "formula": {"string": {"contains": "🟢"}}},
                {
                    "property": "Category as string",
                    "formula": {"string": {"contains": category}},
                },
                {
                    "property": "Allocated quantity per policy",
                    "rollup": {
                        "every": {"rich_text": {"does_not_contain": f"({policy}) 00"}}
                    },
                },
            ]
        },
        "sort": [
            {"property": "Category order", "direction": "ascending"},
            {"property": "Title", "direction": sort},
        ],
    }
    equipment_list = notion("query", "db", data=data)
    equipment_count = len(equipment_list)

    # Parameter and template tag
    param += f"sort={sort}&category={category}&policy={policy}&"
    category_dict = {item["priority"]: item["keyword"] for item in category_list}
    policy_dict = {item["priority"]: item["keyword"] for item in policy_list}
    category = {"priority": category, "keyword": category_dict.get(category)}
    policy = {"priority": policy, "keyword": policy_dict.get(policy)}

    # Query
    q = request.GET.get("q")
    query_result_count = None
    placeholder = random.choice(equipment_list)["title"]

    if q:
        q = q.lower().replace(" ", "")
        query_result_list = []
        for equipment in equipment_list:
            for k, v in equipment.items():
                v = v.lower().replace(" ", "")
                if v is not None:
                    if equipment not in query_result_list:
                        if q in v:
                            query_result_list.append(equipment)

        equipment_list = query_result_list
        query_result_count = len(query_result_list)
        param += f"q={q}&"

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
            "category_list": category_list,
            "policy_list": policy_list,
            "param": param,
            "category": category,
            "policy": policy,
            "equipment_count": equipment_count,
            "query_result_count": query_result_count,
            "placeholder": placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )
