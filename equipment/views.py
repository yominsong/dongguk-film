from django.shortcuts import render
from django.core.paginator import Paginator
from django.http import Http404
from .utils import get_equipment_policy
from utility.img import get_hero_img
from utility.utils import airtable
import random


def equipment(request):
    purpose = request.GET.get("purpose", "A")
    category = request.GET.get("category", "A")

    image_list = get_hero_img("equipment")
    purpose_list = get_equipment_policy("purpose")
    category_list = get_equipment_policy("category")
    param = ""

    # Airtable
    data = {
        "table_name": "equipment-collection",
        "param": {
            "view": "Grid view",
            "fields": [
                "Thumbnail",
                "Name",
                "Subcategory keyword",
                "Brand name",
                "Model",
            ],
            "formula": f"AND(FIND('{purpose}', {{Item purpose}} & ''), FIND('{category}', {{Category name}} & ''))",
        },
    }
    equipment_list = airtable("get_all", "records", data=data)
    equipment_count = len(equipment_list)

    # Parameter and template tag
    param += f"purpose={purpose}&category={category}&"
    purpose_dict = {item["priority"]: item["keyword"] for item in purpose_list}
    category_dict = {item["priority"]: item["keyword"] for item in category_list}
    purpose = {"priority": purpose, "keyword": purpose_dict.get(purpose)}
    category = {"priority": category, "keyword": category_dict.get(category)}

    # Query
    q = request.GET.get("q")
    query_result_count = None
    placeholder = random.choice(equipment_list)["name"]

    if q:
        q = q.lower().replace(" ", "")
        query_result_list = []
        for equipment in equipment_list:
            for k, v in equipment.items():
                if v is not None:
                    v = v.lower().replace(" ", "")
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
            "purpose_list": purpose_list,
            "category_list": category_list,
            "param": param,
            "purpose": purpose,
            "category": category,
            "equipment_count": equipment_count,
            "query_result_count": query_result_count,
            "placeholder": placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )


def equipment_detail(request, record_id):
    image_list = get_hero_img("equipment")
    purpose_list = get_equipment_policy("purpose")

    # Airtable
    data = {
        "table_name": "equipment-collection",
        "param": {
            "record_id": record_id,
        },
    }
    equipment = airtable("get", "record", data=data)

    for purpose in purpose_list:
        if purpose["name"] in equipment["item_purpose"]:
            purpose["available"] = True
        else:
            purpose["available"] = False

    return render(
        request,
        "equipment/equipment_detail.html",
        {
            "image_list": image_list,
            "purpose_list": purpose_list,
            "equipment": equipment,
        },
    )
