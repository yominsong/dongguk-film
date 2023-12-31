from django.shortcuts import render
from django.core.paginator import Paginator
from django.http import Http404
from .utils import get_equipment_category_or_purpose
from utility.img import get_hero_img
from utility.utils import notion
import random


def equipment(request):
    sort = request.GET.get("sort", "ascending")
    category = request.GET.get("category", "A")
    purpose = request.GET.get("purpose", "A")

    image_list = get_hero_img("equipment")
    category_list = get_equipment_category_or_purpose("category")
    purpose_list = get_equipment_category_or_purpose("purpose")
    param = ""

    # Notion
    data = {
        "db_name": "equipment-display",
        "filter_property": [
            "zp%3Ae",  # Page ID
            "zI~%5E",  # Product name
            "%7Cc%5Ek",  # Subcategory as string
            "%7CcHQ",  # Brand
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
                    "property": "Allocated quantity per purpose",
                    "rollup": {
                        "every": {"rich_text": {"does_not_contain": f"({purpose}) 00"}}
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
    param += f"sort={sort}&category={category}&purpose={purpose}&"
    category_dict = {item["priority"]: item["keyword"] for item in category_list}
    purpose_dict = {item["priority"]: item["keyword"] for item in purpose_list}
    category = {"priority": category, "keyword": category_dict.get(category)}
    purpose = {"priority": purpose, "keyword": purpose_dict.get(purpose)}

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
            "purpose_list": purpose_list,
            "param": param,
            "category": category,
            "purpose": purpose,
            "equipment_count": equipment_count,
            "query_result_count": query_result_count,
            "placeholder": placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )


def equipment_detail(request, page_id):
    image_list = get_hero_img("equipment")

    # Notion
    response = notion("retrieve", "page", data={"page_id": page_id})
    if response.status_code != 200 or response.json()["archived"]:
        raise Http404
    elif response.status_code == 200:
        equipment = response.json()
        properties = equipment["properties"]

        title = properties["Title"]["title"][0]["plain_text"]
        category = properties["Category keyword"]["formula"]["string"]
        subcategory = properties["Subcategory keyword"]["rollup"]["array"][0]["rich_text"][0]["plain_text"]
        brand = properties["Brand as string"]["formula"]["string"]
        model = properties["Model"]["select"]["name"]
        shown_as = properties["Shown as"]["relation"][0]["id"]

        equipment = {
            "title": title,
            "category": category,
            "subcategory": subcategory,
            "brand": brand,
            "model": model,
        }

        equipment["cover"] = notion(
            "retrieve", "page", data={"page_id": shown_as}
        ).json()["cover"]["file"]["url"]

    return render(
        request,
        "equipment/equipment_detail.html",
        {"image_list": image_list, "equipment": equipment},
    )
