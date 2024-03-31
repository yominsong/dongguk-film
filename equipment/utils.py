from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from urllib.parse import urlencode
from .models import Cart
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


#
# Main functions
#


def filter_equipment(request):
    id = request.POST.get("id")
    record_id = request.POST.get("recordId", None)
    category_priority = request.POST.get("categoryPriority")
    purpose_priority = request.POST.get("purposePriority")
    period = request.POST.get("period")

    # id: filter_equipment
    if id == "filter_equipment":
        query_string = {"categoryPriority": category_priority}

        if purpose_priority and period:
            query_string["purposePriority"] = purpose_priority
            query_string["period"] = period

        execute_from_detail_page, execute_within_same_category, collection_id, name, rental_allowed = (
            False,
            False,
            None,
            None,
            False,
        )

        # detail page only
        if purpose_priority:
            execute_from_detail_page = True

            data = {
                "table_name": "equipment-collection",
                "params": {
                    "record_id": record_id,
                },
            }

            collection = airtable("get", "record", data=data)

            if collection["category"]["priority"] == category_priority:
                execute_within_same_category = True

            collection_id = collection["collection_id"]
            name = collection["name"]

            rental_allowed = any(
                purpose_priority in collection_purpose
                for collection_purpose in collection["item_purpose"]
            )

        query_string = urlencode(query_string)

        response = {
            "id": id,
            "result": {
                "status": "DONE",
                "query_string": query_string,
                "execute_from_detail_page": execute_from_detail_page,
                "execute_within_same_category": execute_within_same_category,
                "collection_id": collection_id,
                "name": name,
                "rental_allowed": rental_allowed,
            },
        }

    return JsonResponse(response)


@login_required
def equipment(request):
    id = request.POST.get("id")
    purpose_priority = request.POST.get("purposePriority")
    period = request.POST.get("period")

    status = None

    # id: create_cart
    if id == "create_cart":
        if not purpose_priority or not period:
            status = "FAIL"
            reason = "대여 목적 및 기간 미설정"
        elif Cart.objects.filter(user=request.user).exists():
            status = "FAIL"
            reason = "이미 존재하는 장바구니"
        else:
            cart = Cart(
                user=request.user,
                student_id=request.user.username,
                purpose_priority=purpose_priority,
                period=period,
                equipment={},
                will_expire_on=timezone.now() + timezone.timedelta(minutes=30),
            )

            cart.save()
            status = "DONE"

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason if status == "FAIL" else None,
                "purpose_priority": purpose_priority if status == "DONE" else None,
                "period": period if status == "DONE" else None,
                "will_expire_on": cart.will_expire_on if status == "DONE" else None,
            },
        }

    # id: read_cart
    elif id == "read_cart":
        try:
            cart = Cart.objects.get(user=request.user)
            equipment = cart.equipment
            status = "DONE"
        except:
            status = "FAIL"
            reason = response.json()

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason if status == "FAIL" else None,
                "equipment": equipment,
            },
        }

    return JsonResponse(response)
