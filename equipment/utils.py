from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from urllib.parse import urlencode
from .models import Cart
from utility.hangul import handle_hangul
from utility.utils import airtable
from utility.msg import send_msg

import json

#
# Global variables
#

JSON_PATH = (
    "dongguk_film/static/json/equipment.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/equipment.json"
)

#
# Cron functions
#


def update_equipment_policy(request):
    target_list = ["category", "purpose", "limit"]
    result_list = []

    for target in target_list:
        if target == "category":
            data = {
                "table_name": "equipment-category",
                "params": {
                    "view": "Grid view",
                    "fields": ["Name", "Priority", "Keyword"],
                },
            }
        elif target == "purpose":
            data = {
                "table_name": "equipment-purpose",
                "params": {
                    "view": "Grid view",
                    "fields": [
                        "Name",
                        "Priority",
                        "Keyword",
                        "Up to",
                        "At least",
                        "Max",
                        "In a nutshell",
                        "For instructor",
                    ],
                },
            }
        elif target == "limit":
            data = {
                "table_name": "equipment-limit",
                "params": {
                    "view": "Grid view",
                },
            }

        record_list = airtable("get_all", "records", data=data)
        result_list.append({target: record_list})

        with open(JSON_PATH, "r+") as f:
            data = json.load(f)
            data[target] = record_list
            f.seek(0)
            f.write(json.dumps(data, indent=4))
            f.truncate()

    send_msg(request, "UEP", "DEV", result_list)

    return HttpResponse(f"Updated equipment policy: {result_list}")


def delete_expired_carts(request):
    expired_carts = Cart.objects.filter(will_expire_on__lt=timezone.now())
    count = expired_carts.count()
    if count > 0:
        expired_carts.delete()

    return HttpResponse(f"Number of deleted carts: {count}")


#
# Sub functions
#


def get_equipment_policy(policy: str):
    with open(JSON_PATH, "r") as f:
        item_list = json.load(f)[policy]
        f.close()

    return item_list


def filter_limit_list(limit_list, collection):
    filtered_limit_list = []

    for limit in limit_list:
        if (
            limit["category_priority"] is not None
            and collection["category"]["priority"] == limit["category_priority"]
        ):
            filtered_limit_list.append(limit)

        if (
            limit["subcategory_order"] is not None
            and collection["subcategory"]["order"] == limit["subcategory_order"]
        ):
            filtered_limit_list.append(limit)

        if limit["brand"] is not None and collection["brand"] == limit["brand"]:
            filtered_limit_list.append(limit)

        if (
            limit["group_collection_id"] is not None
            and collection["collection_id"] in limit["group_collection_id"]
        ):
            filtered_limit_list.append(limit)

        if (
            limit["collection_id"] is not None
            and collection["collection_id"] == limit["collection_id"]
        ):
            filtered_limit_list.append(limit)

    return filtered_limit_list


def is_within_limits(
    collection,
    cart,
    limits_by_category,
    limits_by_brand,
    limits_by_subcategory,
    limits_by_group,
    limits_by_collection,
):
    category = collection["category"]["priority"]
    brand = collection["brand"]
    subcategory = collection["subcategory"]["order"]
    collection_id = collection["collection_id"]

    category_count = sum(1 for it in cart if it["category"]["priority"] == category)
    category_limit = limits_by_category.get(category, float("inf"))

    if category_count >= category_limit:
        category_keyword_with_josa = handle_hangul(collection["category"]["keyword"], "은는", True)
        msg = f"{category_keyword_with_josa} 최대 {category_limit}개 대여할 수 있어요."

        return False, "Category별 대여 수량 한도 초과", msg

    subcategory_count = sum(1 for it in cart if it.get("subcategory", {}).get("order") == subcategory)
    subcategory_limit = limits_by_subcategory.get(subcategory, float("inf"))

    if subcategory_count >= subcategory_limit:
        msg = f'{collection["subcategory"]["keyword"]} 기자재는 최대 {subcategory_limit}개 대여할 수 있어요.'

        return False, "Subcategory별 대여 수량 한도 초과", msg

    brand_count = sum(1 for it in cart if it["brand"] == brand)
    brand_limit = limits_by_brand.get(brand, float("inf"))

    if brand_count >= brand_limit:
        msg = f"{brand} 기자재는 최대 {brand_limit}개 대여할 수 있어요."

        return False, "Brand별 대여 수량 한도 초과", msg

    collection_count = sum(1 for it in cart if it["collection_id"] == collection_id)
    collection_limit = limits_by_collection.get(collection_id, float("inf"))

    if collection_count >= collection_limit:
        msg = f'{collection["name"]} 기자재는 최대 {collection_limit}개 대여할 수 있어요.'

        return False, "Collection별 대여 수량 한도 초과", msg

    for group_limit, limit in limits_by_group.items():
        if collection_id in group_limit:
            group_items_count = sum(1 for it in cart if it["collection_id"] in group_limit)

            if group_items_count >= limit:
                msg = "대여 수량 한도를 확인해주세요."

                return False, "Group별 대여 수량 한도 초과", msg

    return True, "", "기자재가 장바구니에 담겼어요."


#
# Main functions
#


def equipment(request):
    id = request.POST.get("id")
    record_id = request.POST.get("recordId")
    category_priority = request.POST.get("categoryPriority")
    purpose_priority = request.POST.get("purposePriority")
    period = request.POST.get("period")
    cart = request.POST.get("cart")

    # id: filter_equipment
    if id == "filter_equipment":
        if record_id:
            data = {
                "table_name": "equipment-collection",
                "params": {
                    "record_id": record_id,
                },
            }

            collection = airtable("get", "record", data=data)
            pathname = f'/equipment/{collection["collection_id"]}/'
        else:
            pathname = "/equipment/"

        query_string = {"categoryPriority": category_priority}

        if purpose_priority and period:
            query_string["purposePriority"] = purpose_priority
            query_string["period"] = period

        if record_id and purpose_priority and period:
            is_rental_allowed = any(
                purpose_priority in collection_purpose
                for collection_purpose in collection["item_purpose"]
            )

            if not is_rental_allowed:
                query_string["rentalLimited"] = collection["name"]

        next_url = f"{pathname}?{urlencode(query_string)}"

        response = {
            "id": id,
            "result": {
                "status": "DONE",
                "next_url": next_url,
            },
        }

    # id: add_to_cart
    elif id == "add_to_cart":
        cart = json.loads(cart)

        collection = airtable(
            "get",
            "record",
            data={
                "table_name": "equipment-collection",
                "params": {"record_id": record_id},
            },
        )

        limit_list = get_equipment_policy("limit")

        limits_by_category = {
            limit["category_priority"]: limit["limit"]
            for limit in limit_list
            if limit["depth"] == "Category"
        }

        limits_by_subcategory = {
            limit["subcategory_order"]: limit["limit"]
            for limit in limit_list
            if limit["depth"] == "Subcategory"
        }

        limits_by_brand = {
            limit["brand"]: limit["limit"]
            for limit in limit_list
            if limit["depth"] == "Brand"
        }

        limits_by_group = {
            frozenset(limit["group_collection_id"]): limit["limit"]
            for limit in limit_list
            if limit["depth"] == "Group" and limit["group_collection_id"]
        }

        limits_by_collection = {
            limit["collection_id"]: limit["limit"]
            for limit in limit_list
            if limit["depth"] == "Collection"
        }

        item_to_add, reason, msg = None, None, None

        for item in collection["item"]:
            if (
                item["status"] == "Available"
                and "🟢" in item["validation"]
                and purpose_priority in str(item["purpose"])
            ):
                valid, reason, msg = is_within_limits(
                    collection,
                    cart,
                    limits_by_category,
                    limits_by_brand,
                    limits_by_subcategory,
                    limits_by_group,
                    limits_by_collection,
                )

                if valid:
                    item_to_add = {
                        "collection_id": collection["collection_id"],
                        "thumbnail": collection["thumbnail"],
                        "name": collection["name"],
                        "category": collection["category"],
                        "subcategory": collection["subcategory"],
                        "brand": collection["brand"],
                        "record_id": item["record_id"],
                        "item_id": item["item_id"],
                        "serial_number": item["serial_number"],
                    }

                    cart.append(item_to_add)
                    break

        status = "DONE" if item_to_add else "FAIL"
        cart.sort(key=lambda item: item["item_id"])

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason,
                "msg": msg,
                "cart": cart,
            },
        }

    return JsonResponse(response)
