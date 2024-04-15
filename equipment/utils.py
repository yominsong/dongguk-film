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


def synchronize_equipment_data(request):
    target_list = ["category", "purpose", "limit", "collection"]
    result_list = []

    for target in target_list:
        if target == "category":
            data = {
                "table_name": "equipment-category",
                "params": {
                    "view": "Grid view",
                },
            }
        elif target == "purpose":
            data = {
                "table_name": "equipment-purpose",
                "params": {
                    "view": "Grid view",
                },
            }
        elif target == "limit":
            data = {
                "table_name": "equipment-limit",
                "params": {
                    "view": "Grid view",
                },
            }
        elif target == "collection":
            data = {
                "table_name": "equipment-collection",
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

    send_msg(request, "SED", "DEV", result_list)

    return HttpResponse(f"Synchronized Equipment data: {result_list}")


def delete_expired_carts(request):
    expired_carts = Cart.objects.filter(will_expire_on__lt=timezone.now())
    count = expired_carts.count()
    if count > 0:
        expired_carts.delete()

    return HttpResponse(f"Number of deleted carts: {count}")


#
# Sub functions
#


def get_equipment_data(target: str):
    with open(JSON_PATH, "r") as f:
        item_list = json.load(f)[target]
        f.close()

    return item_list


def split_period(period: str):
    split_period = period.split(",") if period else None
    days_from_now = int(split_period[0]) if period else None
    duration = int(split_period[1]) if period else None

    return days_from_now, duration


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
        category_keyword_with_josa = handle_hangul(
            collection["category"]["keyword"], "은는", True
        )
        reason = "CATEGORY LIMIT 초과"
        msg = f"{category_keyword_with_josa} 최대 {category_limit}개 대여할 수 있어요."

        return False, reason, msg

    subcategory_count = sum(
        1 for it in cart if it.get("subcategory", {}).get("order") == subcategory
    )
    subcategory_limit = limits_by_subcategory.get(subcategory, float("inf"))

    if subcategory_count >= subcategory_limit:
        reason = "SUBCATEGORY LIMIT 초과"
        msg = f'{collection["subcategory"]["keyword"]} 기자재는 최대 {subcategory_limit}개 대여할 수 있어요.'

        return False, reason, msg

    brand_count = sum(1 for it in cart if it["brand"] == brand)
    brand_limit = limits_by_brand.get(brand, float("inf"))

    if brand_count >= brand_limit:
        reason = "BRAND LIMIT 초과"
        msg = f"{brand} 기자재는 최대 {brand_limit}개 대여할 수 있어요."

        return False, reason, msg

    collection_count = sum(1 for it in cart if it["collection_id"] == collection_id)
    collection_limit = limits_by_collection.get(collection_id, float("inf"))

    if collection_count >= collection_limit:
        reason = "COLLECTION LIMIT 초과"
        msg = (
            f'{collection["name"]} 기자재는 최대 {collection_limit}개 대여할 수 있어요.'
        )

        return False, reason, msg

    for group_limit, limit in limits_by_group.items():
        if collection_id in group_limit:
            group_items_count = sum(
                1 for it in cart if it["collection_id"] in group_limit
            )

            if group_items_count >= limit:
                reason = "GROUP LIMIT 초과"
                msg = "도합 대여 수량 한도를 확인해주세요."

                return False, reason, msg

    return True, "", ""


#
# Main functions
#


def equipment(request):
    id = request.GET.get("id")
    record_id = request.GET.get("recordId")
    category_priority = request.GET.get("categoryPriority")
    purpose_priority = request.GET.get("purposePriority")
    period = request.GET.get("period")
    quantity = request.GET.get("quantity")
    cart = request.GET.get("cart")

    # id: filter_equipment
    if id == "filter_equipment":
        pathname = "/equipment/"
        query_string = {"categoryPriority": category_priority}

        if record_id:
            data = {
                "table_name": "equipment-collection",
                "params": {"record_id": record_id},
            }

            collection = airtable("get", "record", data=data)

            if collection["collection_id"][0] == category_priority:
                pathname += f'{collection["collection_id"]}/'

            if purpose_priority and period:
                is_rental_allowed = any(
                    purpose_priority in collection_purpose
                    for collection_purpose in collection.get("item_purpose", [])
                )

                if not is_rental_allowed:
                    query_string["rentalLimited"] = collection.get("name")

        if purpose_priority and period:
            query_string.update(
                {
                    "purposePriority": purpose_priority,
                    "period": period,
                }
            )

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

        equipment_collection_list = get_equipment_data("collection")

        for ec in equipment_collection_list:
            if ec["record_id"] == record_id:
                collection["thumbnail"] = ec["thumbnail"]
                break

        limit_list = get_equipment_data("limit")

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

        purpose_list = get_equipment_data("purpose")
        item_to_add, reason, msg = None, None, None
        added_count = 0

        for item in collection["item"]:
            if added_count >= int(quantity):
                break

            if (
                item["status"] == "Available"
                and "🟢" in item["validation"]
                and purpose_priority in str(item["purpose"])
            ):
                if any(it["item_id"] == item["item_id"] for it in cart):
                    reason = "ITEM 중복"
                    msg = (
                        "장바구니에 재고 수량이 모두 담겼어요. 장바구니를 확인해주세요."
                    )
                    continue

                if len(cart) != 0:
                    if not any(
                        it["purpose_priority"] == purpose_priority for it in cart
                    ):
                        purpose_keyword = next(
                            purpose["keyword"]
                            for purpose in purpose_list
                            if purpose["priority"] == cart[0]["purpose_priority"]
                        )

                        purpose_keyword_with_josa = handle_hangul(
                            purpose_keyword, "으로로", True
                        ).replace(purpose_keyword, f"'{purpose_keyword}'")

                        reason = "PURPOSE 불일치"
                        msg = f"검색 필터에 대여 목적을 {purpose_keyword_with_josa} 적용하거나 장바구니를 비우고 다시 담아주세요."
                        break
                    elif not any(it["period"] == period for it in cart):
                        days_from_now, duration = split_period(cart[0]["period"])
                        user_start_date = timezone.now() + timezone.timedelta(
                            days=days_from_now
                        )

                        user_end_date = user_start_date + timezone.timedelta(
                            days=duration
                        )

                        user_start_date, user_end_date = (
                            user_start_date.date(),
                            user_end_date.date(),
                        )

                        reason = "PERIOD 불일치"
                        msg = f"검색 필터에 대여 기간을 '{user_start_date} 대여 ~ {user_end_date} 반납'으로 적용하거나 장바구니를 비우고 다시 담아주세요."
                        break

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
                        "record_id": item["record_id"],
                        "collection_id": collection["collection_id"],
                        "item_id": item["item_id"],
                        "thumbnail": collection["thumbnail"],
                        "name": collection["name"],
                        "brand": collection["brand"],
                        "category": collection["category"],
                        "subcategory": collection["subcategory"],
                        "order": collection["order"],
                        "purpose_priority": purpose_priority,
                        "period": period,
                    }

                    cart.append(item_to_add)
                    added_count += 1

        if added_count < int(quantity) and msg is None:
            reason = "LIMIT 초과"
            msg = f"대여 수량 한도 내에서 {added_count}개만 장바구니에 담았어요."

        status = "DONE" if item_to_add else "FAIL"
        cart.sort(key=lambda item: item["order"])

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
