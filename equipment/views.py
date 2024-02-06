from django.shortcuts import redirect, render
from django.core.paginator import Paginator
from django.urls import reverse
from urllib.parse import urlencode, parse_qs
from .utils import get_equipment_policy
from utility.img import get_hero_img
from utility.utils import airtable
import random

#
# Sub functions
#


def is_not_two_numeric_format(period):
    parts = period.split(",")

    return not (len(parts) == 2 and all(part.isnumeric() for part in parts))


#
# Main functions
#


def equipment(request):
    query_string = ""
    category_priority = request.GET.get("categoryPriority", "").strip()
    purpose_priority = request.GET.get("purposePriority", "").strip()
    period = request.GET.get("period", "").strip()

    category_list = get_equipment_policy("category")
    purpose_list = get_equipment_policy("purpose")

    if (
        (not category_priority or (bool(purpose_priority) != bool(period)))
        or (category_priority not in [item["priority"] for item in category_list])
        or (
            bool(purpose_priority)
            and purpose_priority not in [item["priority"] for item in purpose_list]
        )
        or (bool(period) and is_not_two_numeric_format(period))
    ):
        base_url = reverse("equipment:equipment")
        query_string = {
            "categoryPriority": category_list[0]["priority"],
        }
        url = f"{base_url}?{urlencode(query_string)}"

        return redirect(url)

    split_period = period.split(",") if period is not None and period != "" else None
    days_from_now = (
        int(split_period[0]) if period is not None and period != "" else None
    )
    duration = int(split_period[1]) if period is not None and period != "" else None

    if period:
        for purpose_item in purpose_list:
            at_least = purpose_item["at_least"]
            up_to = purpose_item["up_to"]
            max = purpose_item["max"]

            if purpose_item["priority"] == purpose_priority:
                if (
                    days_from_now < at_least
                    or days_from_now > up_to
                    or duration < 0
                    or duration > max
                ):
                    base_url = reverse("equipment:equipment")
                    query_string = {
                        "categoryPriority": category_priority,
                        # "purposePriority": purpose_priority,
                    }
                    url = f"{base_url}?{urlencode(query_string)}"

                    return redirect(url)

    image_list = get_hero_img("equipment")

    # Airtable
    data = {
        "table_name": "equipment-collection",
        "params": {
            "view": "Grid view",
            "fields": [
                "ID",
                "Thumbnail",
                "Name",
                "Subcategory keyword",
                "Brand name",
                "Model",
            ],
        },
    }

    if purpose_priority is None or purpose_priority == "":
        data["params"][
            "formula"
        ] = f"FIND('{category_priority}', {{Category name}} & '')"
    else:
        data["params"][
            "formula"
        ] = f"AND(FIND('{category_priority}', {{Category name}} & ''), FIND('{purpose_priority}', {{Item purpose}} & ''))"

    equipment_list = airtable("get_all", "records", data=data)
    equipment_count = len(equipment_list)

    # Parameter and template tag
    query_string += f"categoryPriority={category_priority}&purposePriority={purpose_priority}&period={period}&"
    category_dict = {item["priority"]: item["keyword"] for item in category_list}
    purpose_dict = {item["priority"]: item["keyword"] for item in purpose_list}
    category = {
        "priority": category_priority,
        "keyword": category_dict.get(category_priority),
    }
    purpose = {
        "priority": purpose_priority,
        "keyword": purpose_dict.get(purpose_priority),
    }
    period = {"days_from_now": days_from_now, "duration": duration}

    # Search box
    query = request.GET.get("q")
    search_result_count = None
    search_placeholder = random.choice(equipment_list)["name"]

    if query:
        query = query.lower().replace(" ", "")
        query_result_list = []
        for equipment in equipment_list:
            for k, v in equipment.items():
                if v is not None:
                    v = v.lower().replace(" ", "")
                    if equipment not in query_result_list:
                        if query in v:
                            query_result_list.append(equipment)

        equipment_list = query_result_list
        search_result_count = len(query_result_list)
        query_string += f"q={query}&"

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
            "query_string": query_string,
            "image_list": image_list,
            "category_list": category_list,
            "purpose_list": purpose_list,
            "category": category,
            "purpose": purpose,
            "period": period,
            "equipment_count": equipment_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            "page_value": page_value,
            "page_range": page_range,
        },
    )


def equipment_detail(request, record_id):
    category_priority = request.GET.get("categoryPriority", "").strip()
    purpose_priority = request.GET.get("purposePriority", "").strip()
    period = request.GET.get("period", "").strip()

    category_list = get_equipment_policy("category")
    purpose_list = get_equipment_policy("purpose")

    # Airtable
    data = {
        "table_name": "equipment-collection",
        "params": {
            "record_id": record_id,
        },
    }
    equipment = airtable("get", "record", data=data)

    if (
        (not category_priority or (bool(purpose_priority) != bool(period)))
        or (category_priority not in [item["priority"] for item in category_list])
        or (
            bool(purpose_priority)
            and purpose_priority not in [item["priority"] for item in purpose_list]
        )
        or (bool(period) and is_not_two_numeric_format(period))
    ):
        base_url = reverse(
            "equipment:equipment_detail", kwargs={"record_id": record_id}
        )
        query_string = {"categoryPriority": equipment["category"]["priority"]}
        url = f"{base_url}?{urlencode(query_string)}"

        return redirect(url)

    split_period = period.split(",") if period is not None and period != "" else None
    days_from_now = (
        int(split_period[0]) if period is not None and period != "" else None
    )
    duration = int(split_period[1]) if period is not None and period != "" else None

    if period:
        for purpose_item in purpose_list:
            at_least = purpose_item["at_least"]
            up_to = purpose_item["up_to"]
            max = purpose_item["max"]

            if purpose_item["priority"] == purpose_priority:
                if (
                    days_from_now < at_least
                    or days_from_now > up_to
                    or duration < 0
                    or duration > max
                ):
                    base_url = reverse(
                        "equipment:equipment_detail", kwargs={"record_id": record_id}
                    )
                    query_string = {
                        "categoryPriority": equipment["category"]["priority"]
                    }
                    url = f"{base_url}?{urlencode(query_string)}"

                    return redirect(url)

    for purpose in purpose_list:
        if purpose["name"] in equipment["item_purpose"]:
            purpose["available"] = True
        else:
            purpose["available"] = False
    
    image_list = get_hero_img("equipment")
    limit_list = get_equipment_policy("limit")
    filtered_limit_list = []

    for limit in limit_list:
        if (
            limit["category_priority"] is not None
            and equipment["category"]["priority"] == limit["category_priority"]
        ):
            filtered_limit_list.append(limit)
        if (
            limit["subcategory_order"] is not None
            and equipment["subcategory"]["order"] == limit["subcategory_order"]
        ):
            filtered_limit_list.append(limit)
        if limit["brand"] is not None and equipment["brand"] == limit["brand"]:
            filtered_limit_list.append(limit)
        if (
            limit["group_collection_id"] is not None
            and equipment["collection_id"] in limit["group_collection_id"]
        ):
            filtered_limit_list.append(limit)
        if (
            limit["collection_id"] is not None
            and equipment["collection_id"] == limit["collection_id"]
        ):
            filtered_limit_list.append(limit)

    limit_list = filtered_limit_list

    # Parameter and template tag
    category_dict = {item["priority"]: item["keyword"] for item in category_list}
    purpose_dict = {item["priority"]: item["keyword"] for item in purpose_list}
    split_period = period.split(",") if period is not None and period != "" else None
    days_from_now = (
        int(split_period[0]) if period is not None and period != "" else None
    )
    duration = int(split_period[1]) if period is not None and period != "" else None
    category = {
        "priority": category_priority,
        "keyword": category_dict.get(category_priority),
    }
    purpose = {
        "priority": purpose_priority,
        "keyword": purpose_dict.get(purpose_priority),
    }
    period = {"days_from_now": days_from_now, "duration": duration}

    return render(
        request,
        "equipment/equipment_detail.html",
        {
            "image_list": image_list,
            "category_list": category_list,
            "purpose_list": purpose_list,
            "limit_list": limit_list,
            "category": category,
            "purpose": purpose,
            "purpose_priority": purpose_priority,
            "period": period,
            "equipment": equipment,
        },
    )
