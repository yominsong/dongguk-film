from django.shortcuts import render
from django.core.paginator import Paginator
from django.http import Http404
from .utils import get_equipment_policy
from utility.img import get_hero_img
from utility.utils import airtable, notion
import random


def equipment(request):
    sort = request.GET.get("sort", "ascending")
    category = request.GET.get("category", "A")
    purpose = request.GET.get("purpose", "A")

    image_list = get_hero_img("equipment")
    category_list = get_equipment_policy("category")
    purpose_list = get_equipment_policy("purpose")
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
            "formula": f"AND(FIND('{category}', {{Category name}} & ''), FIND('{purpose}', {{Item purpose}} & ''))",
        },
    }
    equipment_list = airtable("get_all", "records", data=data)
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

    # Notion
    # response = notion("retrieve", "page", data={"page_id": page_id})
    # if response.status_code != 200 or response.json()["archived"]:
    #     raise Http404
    # elif response.status_code == 200:
    #     equipment = response.json()
    #     properties = equipment["properties"]

    #     title = ""
    #     for part in properties["Title"]["title"]:
    #         title += part["plain_text"]

    #     equipment_id = properties["Equipment ID"]["formula"]["string"]
    #     category = properties["Category keyword"]["formula"]["string"]
    #     subcategory = properties["Subcategory keyword"]["rollup"]["array"][0][
    #         "rich_text"
    #     ][0]["plain_text"]
    #     brand = properties["Brand as string"]["formula"]["string"]
    #     model = properties["Model"]["select"]["name"]

    #     allocated_quantity_by_purpose = [
    #         quantity
    #         for quantity in properties["Allocated quantity by purpose"]["formula"][
    #             "string"
    #         ].split("   ")
    #         if "00" not in quantity
    #     ]
    #     priority_list = [
    #         quantity.split(" ")[0][1] for quantity in allocated_quantity_by_purpose
    #     ]

    #     shown_as = properties["Shown as"]["relation"][0]["id"]

    #     equipment = {
    #         "page_id": page_id,
    #         "equipment_id": equipment_id,
    #         "title": title,
    #         "category": category,
    #         "subcategory": subcategory,
    #         "brand": brand,
    #         "model": model,
    #     }

    #     equipment["cover"] = notion(
    #         "retrieve", "page", data={"page_id": shown_as}
    #     ).json()["cover"]["file"]["url"]

        # for purpose in purpose_list:
        #     if purpose["priority"] in priority_list:
        #         purpose["available"] = True
        #     else:
        #         purpose["available"] = False

    return render(
        request,
        "equipment/equipment_detail.html",
        {
            "image_list": image_list,
            "equipment": equipment,
            "purpose_list": purpose_list,
        },
    )
