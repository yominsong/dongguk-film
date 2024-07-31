from django.shortcuts import redirect, render
from django.core.paginator import Paginator
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from urllib.parse import urlencode
from .utils import get_equipment_data, get_subject, split_period, filter_limit_list, get_weekday
from utility.img import get_hero_img
from utility.utils import convert_datetime, mask_personal_information, airtable
import random, json

#
# Sub functions
#


def is_query_string_invalid(
    category_priority, purpose_priority, period, category_list, purpose_list
):
    return (
        (not category_priority or (bool(purpose_priority) != bool(period)))
        or (
            category_priority
            not in [category["priority"] for category in category_list]
        )
        or (
            bool(purpose_priority)
            and purpose_priority
            not in [purpose["priority"] for purpose in purpose_list]
        )
        or (bool(period) and is_not_two_numeric_format(period))
    )


def is_not_two_numeric_format(period):
    parts = period.split(",")

    return not (len(parts) == 2 and all(part.isnumeric() for part in parts))


# def has_equipment_room_permission(request):
#     operator_list = notion("query", "db", data={"db_name": "operator"})
#     has_equipment_room_permission = False

#     for operator in operator_list:
#         if operator["student_id"] == request.user.username and (
#             operator["permission"] == "EQUIPMENT_ROOM"
#             or operator["permission"] == "ADMIN"
#         ):
#             has_equipment_room_permission = True
#             break

#     return has_equipment_room_permission


def redirect_with_query_string(base_url, query_string):
    url = f"{base_url}?{urlencode(query_string)}"

    return redirect(url)


def set_template_tag(
    category_priority,
    purpose_priority,
    days_from_now,
    duration,
    category_list,
    purpose_list,
):
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

    return category, purpose, period


def get_subject_list():
    base_date = timezone.now().date()
    base_year = base_date.year
    base_month = base_date.month
    subject_list = get_subject(base_date)

    for subject in subject_list:
        subject["instructor"] = ", ".join(f"{mask_personal_information('instructor_id', instructor['id'])}#{instructor['name']}" for instructor in subject["instructor"])

    target_academic_year_and_semester = f"{base_year}학년도 {'1' if base_month < 7 else '2'}학기"

    return subject_list, target_academic_year_and_semester


#
# Main functions
#


@ensure_csrf_cookie
def equipment(request):
    category_priority = request.GET.get("categoryPriority", "").strip()
    purpose_priority = request.GET.get("purposePriority", "").strip()
    period = request.GET.get("period", "").strip()

    category_list = get_equipment_data("category")
    purpose_list = get_equipment_data("purpose")

    # Query string validation
    if is_query_string_invalid(
        category_priority, purpose_priority, period, category_list, purpose_list
    ):
        base_url = reverse("equipment:equipment")

        query_string = {
            "categoryPriority": category_list[0]["priority"],
        }

        return redirect_with_query_string(base_url, query_string)

    days_from_now, duration = split_period(period)

    if period:
        for purpose_item in purpose_list:
            if purpose_item["priority"] == purpose_priority:
                at_least = purpose_item["at_least"]
                up_to = purpose_item["up_to"]
                max = purpose_item["max"]

                if (
                    days_from_now < at_least
                    or days_from_now > up_to
                    or duration < 0
                    or duration > max
                ):
                    base_url = reverse("equipment:equipment")

                    query_string = {
                        "categoryPriority": category_priority,
                    }

                    return redirect_with_query_string(base_url, query_string)

    query_string = ""
    image_list = get_hero_img("equipment")
    equipment_collection_list = get_equipment_data("collection")

    if not purpose_priority:
        equipment_collection_list = [
            equipment
            for equipment in equipment_collection_list
            if equipment["category"]["priority"] == category_priority
        ]
    else:
        equipment_collection_list = [
            equipment
            for equipment in equipment_collection_list
            if (
                equipment["category"]["priority"] == category_priority
                and any(
                    purpose_priority in purpose for purpose in equipment["item_purpose"]
                )
            )
        ]

    equipment_collection_count = len(equipment_collection_list)
    subject_list, target_academic_year_and_semester = get_subject_list()

    # Query string and template tag
    query_string = f"categoryPriority={category_priority}&"
    query_string += (
        f"purposePriority={purpose_priority}&period={period}&"
        if purpose_priority and period
        else ""
    )

    category, purpose, period = set_template_tag(
        category_priority,
        purpose_priority,
        days_from_now,
        duration,
        category_list,
        purpose_list,
    )

    # Search box
    query = request.GET.get("q")
    search_result_count = None
    search_placeholder = random.choice(equipment_collection_list)["name"]

    if query:
        query = query.lower().replace(" ", "")
        query_result_list = []
        for equipment in equipment_collection_list:
            for k, v in equipment.items():
                if isinstance(v, str):
                    v = v.lower().replace(" ", "")
                    if equipment not in query_result_list:
                        if query in v:
                            query_result_list.append(equipment)

        equipment_collection_list = query_result_list
        search_result_count = len(query_result_list)
        query_string += f"q={query}&"

    # Pagination
    try:
        page = request.GET["page"]
    except:
        page = 1

    paginator = Paginator(equipment_collection_list, 16)
    page_value = paginator.get_page(page)
    page_range = paginator.page_range

    return render(
        request,
        "equipment/equipment.html",
        {
            "query_string": query_string,
            "image_list": image_list,
            "equipment_collection_count": equipment_collection_count,
            "search_result_count": search_result_count,
            "search_placeholder": search_placeholder,
            # "has_equipment_room_permission": has_equipment_room_permission(request),
            "page_value": page_value,
            "page_range": page_range,
            "category_list": category_list,
            "purpose_list": purpose_list,
            "subject_list": subject_list,
            "target_academic_year_and_semester": target_academic_year_and_semester,
            "category": category,
            "purpose": purpose,
            "period": period,
        },
    )


def equipment_detail(request, collection_id):
    # Extract query parameters
    category_priority = request.GET.get("categoryPriority", "").strip()
    purpose_priority = request.GET.get("purposePriority", "").strip()
    period = request.GET.get("period", "").strip()

    # Fetch necessary data
    category_list = get_equipment_data("category")
    purpose_list = get_equipment_data("purpose")

    # Airtable query optimization
    data = {
        "table_name": "equipment-collection",
        "params": {
            "view": "Grid view",
            "formula": f"{{ID}} = '{collection_id}'",
        },
    }
    collection = airtable("get_all", "records", data)[0]
    
    # Add thumbnail to collection
    equipment_collection_list = get_equipment_data("collection")
    collection["thumbnail"] = next((ec["thumbnail"] for ec in equipment_collection_list if ec["record_id"] == collection["record_id"]), None)

    # Query string validation and redirect if necessary
    if collection_id[0] != category_priority or is_query_string_invalid(category_priority, purpose_priority, period, category_list, purpose_list):
        base_url = reverse("equipment:equipment_detail", kwargs={"collection_id": collection_id})
        query_string = {"categoryPriority": collection["category"]["priority"]}
        return redirect_with_query_string(base_url, query_string)

    # Process period
    days_from_now, duration = split_period(period)

    # Check if rental is allowed and redirect if necessary
    if period:
        is_category_same = collection["category"]["priority"] == category_priority
        is_rental_allowed = any(purpose_priority in collection_purpose for collection_purpose in collection["item_purpose"])
        
        if not is_category_same or not is_rental_allowed:
            base_url = reverse("equipment:equipment")
            query_string = {
                "categoryPriority": category_priority,
                "purposePriority": purpose_priority,
                "period": period,
            }
            if not is_rental_allowed:
                query_string["rentalLimited"] = collection["name"]
            return redirect_with_query_string(base_url, query_string)

        # Validate period against purpose constraints
        for purpose in purpose_list:
            if purpose["priority"] == purpose_priority:
                at_least, up_to, max_duration = purpose["at_least"], purpose["up_to"], purpose["max"]
                if days_from_now < at_least or days_from_now > up_to or duration < 0 or duration > max_duration:
                    base_url = reverse("equipment:equipment")
                    query_string = {"categoryPriority": category_priority}
                    return redirect_with_query_string(base_url, query_string)

    # Prepare data for template
    image_list = get_hero_img("equipment")
    subject_list, target_academic_year_and_semester = get_subject_list()

    # Process stock and unavailable periods
    stock_list = []
    unavailable_period_list = []
    user_start_date = timezone.now().date() + timezone.timedelta(days=days_from_now) if period else None
    user_end_date = user_start_date + timezone.timedelta(days=duration) if user_start_date else None

    for purpose in purpose_list:
        purpose["permitted"] = purpose["name"] in collection["item_purpose"]
        purpose["in_stock"] = False

        if period and purpose["permitted"]:
            for item in collection["item"]:
                if purpose["name"] in item["purpose"] and "🟢" in item["validation"] and item["status"] != "Unavailable":
                    item_unavailable_periods = [
                        {
                            "start_date": convert_datetime(start).date(),
                            "end_date": convert_datetime(end).date()
                        }
                        for start, end in zip(item["start_datetime"], item["end_datetime"])
                        if start and end
                    ]
                    
                    item_unavailable_periods.sort(key=lambda x: x["start_date"])
                    unavailable_period_list.extend(item_unavailable_periods)

                    item_available = all(
                        user_end_date < period["start_date"] or user_start_date > period["end_date"]
                        for period in item_unavailable_periods
                    )

                    if item_available:
                        purpose["in_stock"] = True
                        if purpose_priority == purpose["priority"] and item not in stock_list:
                            stock_list.append(item)

    # Remove duplicates and sort unavailable periods
    unavailable_period_list = sorted(
        [dict(t) for t in {tuple(d.items()) for d in unavailable_period_list}],
        key=lambda x: x["start_date"]
    )

    # Merge overlapping periods and add weekday information
    merged_unavailable_period_list = []
    for period in unavailable_period_list:
        if not merged_unavailable_period_list or period["start_date"] > merged_unavailable_period_list[-1]["end_date"]:
            start_weekday = get_weekday(period["start_date"].strftime("%Y-%m-%d"))
            end_weekday = get_weekday(period["end_date"].strftime("%Y-%m-%d"))
            merged_unavailable_period_list.append({
                "start_date": period["start_date"],
                "end_date": period["end_date"],
                "start_weekday": start_weekday,
                "end_weekday": end_weekday
            })
        else:
            merged_unavailable_period_list[-1]["end_date"] = max(merged_unavailable_period_list[-1]["end_date"], period["end_date"])
            merged_unavailable_period_list[-1]["end_weekday"] = get_weekday(merged_unavailable_period_list[-1]["end_date"].strftime("%Y-%m-%d"))

    # Get and filter limit list
    limit_list = get_equipment_data("limit")
    limit_list = filter_limit_list(limit_list, collection)
    limit_list_json = json.dumps(limit_list)

    # Set template tags
    category, purpose, period = set_template_tag(
        category_priority,
        purpose_priority,
        days_from_now,
        duration,
        category_list,
        purpose_list,
    )

    # Render template
    return render(
        request,
        "equipment/equipment_detail.html",
        {
            "image_list": image_list,
            "category_list": category_list,
            "purpose_list": purpose_list,
            "subject_list": subject_list,
            "target_academic_year_and_semester": target_academic_year_and_semester,
            "limit_list": limit_list,
            "limit_list_json": limit_list_json,
            "category": category,
            "purpose": purpose,
            "purpose_priority": purpose_priority,
            "period": period,
            "collection": collection,
            "stock_list": stock_list,
            "unavailable_period_list": merged_unavailable_period_list,
        },
    )