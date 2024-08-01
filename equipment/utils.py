from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.utils import timezone
from urllib.parse import urlencode
from .models import Cart
from utility.hangul import handle_hangul
from utility.utils import (
    mask_personal_information,
    get_equipment_data,
    get_subject,
    find_instructor,
    chat_gpt,
    airtable,
    notion,
    convert_datetime,
)
from utility.msg import send_msg
from fake_useragent import UserAgent
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from collections import Counter
from PIL import Image, ImageOps
from io import BytesIO
import json, ast, base64

#
# Global variables
#

DMD_URL = getattr(settings, "DMD_URL", None)
DMD_COOKIE = getattr(settings, "DMD_COOKIE", None)
headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}

GOOGLE_SA_CREDS = service_account.Credentials.from_service_account_info(
    getattr(settings, "GOOGLE_SA_CREDS", None),
    scopes=[
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
    ],
)

GOOGLE_DRIVE = build("drive", "v3", credentials=GOOGLE_SA_CREDS)
GOOGLE_DOCS = build("docs", "v1", credentials=GOOGLE_SA_CREDS)
GOOGLE_DOCS_TEMPLATE_ID = getattr(settings, "GOOGLE_DOCS_TEMPLATE_ID", None)
EMAIL_HOST_USER = getattr(settings, "EMAIL_HOST_USER", None)

JSON_PATH = (
    "dongguk_film/static/json/equipment.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/equipment.json"
)

#
# Cron functions
#


def synchronize_equipment_data(request):
    data_list = []

    try:
        target_list = ["category", "purpose", "limit", "collection", "hour"]

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
                        "fields": [
                            "ID",
                            "Thumbnail",
                            "Name",
                            "Category priority",
                            "Category keyword",
                            "Subcategory keyword",
                            "Subcategory order",
                            "Brand name",
                            "Model",
                            "Item purpose",
                        ],
                    },
                }
            elif target == "hour":
                data = {
                    "table_name": "equipment-hour",
                    "params": {
                        "view": "Grid view",
                        "fields": [
                            "Name",
                            "Day of the week",
                            "Day of the week in Korean",
                            "Time",
                            "Max capacity",
                        ],
                    },
                }

            record_list = airtable("get_all", "records", data)
            data_list.append({target: record_list})

            with open(JSON_PATH, "r+") as f:
                data = json.load(f)
                data[target] = record_list
                f.seek(0)
                f.write(json.dumps(data, indent=4))
                f.truncate()

        status = "DONE"
    except:
        status = "FAIL"

    data = {
        "status": status,
        "data_list": data_list,
    }

    send_msg(request, "SYNC_EQUIPMENT_DATA", "DEV", data)
    json_data = json.dumps(data, indent=4)

    return HttpResponse(json_data, content_type="application/json")


#
# Sub functions
#


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


def get_start_end_date(cart):
    days_from_now, duration = split_period(cart[0]["period"])
    user_start_date = timezone.now() + timezone.timedelta(days=days_from_now)
    user_end_date = user_start_date + timezone.timedelta(days=duration)

    user_start_date, user_end_date = (
        user_start_date.date(),
        user_end_date.date(),
    )

    return user_start_date, user_end_date


def get_weekday(date: str):
    date_obj = timezone.datetime.strptime(date, "%Y-%m-%d")

    weekday_dict = {
        0: "월",
        1: "화",
        2: "수",
        3: "목",
        4: "금",
        5: "토",
        6: "일",
    }

    weekday_num = date_obj.weekday()

    return weekday_dict[weekday_num]


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
        reason = "EXCEED_CATEGORY_LIMIT"
        msg = f"{category_keyword_with_josa} 최대 {category_limit}개 대여할 수 있어요."

        return False, reason, msg

    subcategory_count = sum(
        1 for it in cart if it.get("subcategory", {}).get("order") == subcategory
    )
    subcategory_limit = limits_by_subcategory.get(subcategory, float("inf"))

    if subcategory_count >= subcategory_limit:
        reason = "EXCEED_SUBCATEGORY_LIMIT"
        msg = f'{collection["subcategory"]["keyword"]} 기자재는 최대 {subcategory_limit}개 대여할 수 있어요.'

        return False, reason, msg

    brand_count = sum(1 for it in cart if it["brand"] == brand)
    brand_limit = limits_by_brand.get(brand, float("inf"))

    if brand_count >= brand_limit:
        reason = "EXCEED_BRAND_LIMIT"
        msg = f"{brand} 기자재는 최대 {brand_limit}개 대여할 수 있어요."

        return False, reason, msg

    collection_count = sum(1 for it in cart if it["collection_id"] == collection_id)
    collection_limit = limits_by_collection.get(collection_id, float("inf"))

    if collection_count >= collection_limit:
        reason = "EXCEED_COLLECTION_LIMIT"
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
                reason = "EXCEED_GROUP_LIMIT"
                msg = f'{collection["name"]} 기자재는 특정 기자재와 함께 도합 최대 {limit}개까지 대여할 수 있어요.'

                return False, reason, msg

    return True, None, None


def is_invalid_signature(signature_bs64_encoded_data, student_name):
    image_url = f"data:image/png;base64,{signature_bs64_encoded_data}"

    prompt = [
        {
            "type": "text",
            "text": f"이 이미지에 포함된 한글이 '{student_name}' 문자열과 동일한지 'True' 또는 'False'로만 답해줘.",
        },
        {
            "type": "image_url",
            "image_url": {"url": image_url},
        },
    ]

    openai_response = chat_gpt("4o", prompt)

    if "True" in openai_response:
        result = False
    elif "False" in openai_response:
        result = True
    else:
        result = True

    return result


def copy_equipment_use_request_form(
    name_of_subject_or_project, student_id, public=False
):
    student_id = (
        mask_personal_information("student_id", student_id) if public else student_id
    )

    copied_document = (
        GOOGLE_DRIVE.files()
        .copy(
            fileId=GOOGLE_DOCS_TEMPLATE_ID["equipment_use_request_form"],
            body={
                "name": f"{name_of_subject_or_project} {student_id} 기자재 사용 신청서"
            },
        )
        .execute()
    )

    return copied_document["id"]


def add_editor_permission(file_id):
    permission = {"type": "user", "role": "writer", "emailAddress": EMAIL_HOST_USER}

    return (
        GOOGLE_DRIVE.permissions()
        .create(fileId=file_id, body=permission, fields="id")
        .execute()
    )


def make_file_public(file_id):
    permission = {"role": "reader", "type": "anyone"}

    return GOOGLE_DRIVE.permissions().create(fileId=file_id, body=permission).execute()


def replace_text(document_id, replacements):
    requests = []

    for key, value in replacements.items():
        requests.append(
            {
                "replaceAllText": {
                    "containsText": {"text": f"{{{key}}}", "matchCase": True},
                    "replaceText": value,
                }
            }
        )

    body = {"requests": requests}

    return (
        GOOGLE_DOCS.documents().batchUpdate(documentId=document_id, body=body).execute()
    )


def add_equipment_to_table(document_id, cart):
    collection_count = Counter(item["collection_id"] for item in cart)
    unique_cart = list(
        reversed({item["collection_id"]: item for item in cart}.values())
    )
    insert_requests = []
    table_start_index = 647

    for item in unique_cart[:-1]:
        insert_requests.append(
            {
                "insertTableRow": {
                    "tableCellLocation": {
                        "tableStartLocation": {"index": table_start_index},
                        "rowIndex": 1,
                    },
                    "insertBelow": True,
                }
            }
        )

        start_index = 736

        for text in [
            item["category"]["keyword"],
            item["name"],
            item["collection_id"],
            str(collection_count[item["collection_id"]]),
        ]:
            insert_requests.append(
                {"insertText": {"location": {"index": start_index}, "text": text}}
            )

            start_index += len(text) + (2 if text != item["name"] else 6)

    delete_request = {
        "deleteTableRow": {
            "tableCellLocation": {
                "tableStartLocation": {"index": table_start_index},
                "rowIndex": len(collection_count.keys()) + 1,
            }
        }
    }

    insert_requests.append(delete_request)
    body = {"requests": insert_requests}
    GOOGLE_DOCS.documents().batchUpdate(documentId=document_id, body=body).execute()
    first_item = cart[0]

    replacements = {
        "category": first_item["category"]["keyword"],
        "collection_name": first_item["name"],
        "collection_id": first_item["collection_id"],
        "quantity": str(collection_count[first_item["collection_id"]]),
        "total_quantity": str(sum(collection_count.values())),
    }

    replace_text(document_id, replacements)


def upload_signature(signature, project_name, student_id):
    media = MediaIoBaseUpload(signature, mimetype="image/png", resumable=True)
    file_metadata = {"name": f"{project_name}_{student_id}_signature.png"}

    uploaded_signature = (
        GOOGLE_DRIVE.files()
        .create(body=file_metadata, media_body=media, fields="id")
        .execute()
    )

    return uploaded_signature["id"]


def process_signature(signature):
    signature_file_data = signature.read()
    signature_image = Image.open(BytesIO(signature_file_data))
    a = signature_image.split()[3]  # Get the alpha channel

    white_signature_image = Image.new(
        "RGBA", signature_image.size, (255, 255, 255, 0)
    )

    white_signature_image.paste(signature_image, (0, 0), mask=a)
    buffered = BytesIO()
    white_signature_image.save(buffered, format="PNG")

    signature_bs64_encoded_data = base64.b64encode(buffered.getvalue()).decode(
        "utf-8"
    )

    return signature_bs64_encoded_data


def insert_signature(document_id, signature_id):
    image_url = f"https://drive.google.com/uc?export=view&id={signature_id}"

    requests = [
        {
            "insertInlineImage": {
                "location": {"index": 1254},
                "uri": image_url,
                "objectSize": {
                    "height": {
                        "magnitude": 28.3465,
                        "unit": "PT",
                    }
                },
            }
        }
    ]

    return (
        GOOGLE_DOCS.documents()
        .batchUpdate(documentId=document_id, body={"requests": requests})
        .execute()
    )


def update_equipment_hour(data: dict):
    start_hour = {
        "date": data["start_date"],
        "time_record_id": data["start_time_record_id"],
    }

    end_hour = {
        "date": data["end_date"],
        "time_record_id": data["end_time_record_id"],
    }

    project_id = data["project_id"]

    for hour in [start_hour, end_hour]:
        date = hour["date"]
        time_record_id = hour["time_record_id"]

        data = {
            "table_name": "equipment-hour",
            "params": {
                "record_id": time_record_id,
            },
        }

        hour = airtable("get", "record", data)
        project_and_date_list = hour["project_and_date"]
        max_capacity = hour["max_capacity"]

        if len(project_and_date_list) < max_capacity:
            new_project_and_date = {
                "project": project_id,
                "date": str(date),
            }

            project_and_date_list.append(new_project_and_date)

            data = {
                "table_name": "equipment-hour",
                "params": {
                    "record_id": time_record_id,
                    "fields": {
                        "Project and date": str(project_and_date_list),
                    },
                },
            }

            airtable("update", "record", data)


#
# Main functions
#


def equipment(request):
    id = request.POST.get("id", None)
    record_id = request.POST.get("recordId", None)
    category_priority = request.POST.get("categoryPriority", None)
    purpose_priority = request.POST.get("purposePriority", None)
    period = request.POST.get("period", None)
    cart = json.loads(request.POST.get("cart", "[]"))

    # id: filter_equipment
    if id == "filter_equipment":
        pathname = "/equipment/"
        query_string = {"categoryPriority": category_priority}

        if record_id:
            data = {
                "table_name": "equipment-collection",
                "params": {"record_id": record_id},
            }

            collection = airtable("get", "record", data)

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
            "status": "DONE",
            "next_url": next_url,
        }

    # id: add_to_cart
    elif id == "add_to_cart":
        requested_quantity = request.POST.get("requestedQuantity")

        collection = airtable(
            "get",
            "record",
            data={
                "table_name": "equipment-collection",
                "params": {"record_id": record_id},
            },
        )

        collection_list = get_equipment_data("collection")

        for it in collection_list:
            if it["record_id"] == record_id:
                collection["thumbnail"] = it["thumbnail"]
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

        available_item_list = []
        added_quantity, requested_quantity = 0, int(requested_quantity)
        purpose_list = get_equipment_data("purpose")
        item_to_add, reason, msg = None, None, None

        for item in collection["item"]:
            if added_quantity >= requested_quantity:
                break

            if (
                item["status"] != "Unavailable"
                and "🟢" in item["validation"]
                and purpose_priority in str(item["purpose"])
            ):
                available_item_list.append(item)

                if any(it["item_id"] == item["item_id"] for it in cart):
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

                        reason = "MISMATCHED_PURPOSE"
                        msg = f"검색 필터에 대여 목적을 {purpose_keyword_with_josa} 적용하거나 장바구니를 비우고 다시 담아주세요."
                        break
                    elif not any(it["period"] == period for it in cart):
                        user_start_date, user_end_date = get_start_end_date(cart)

                        reason = "MISMATCHED_PERIOD"
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
                        "purpose": next(
                            purpose
                            for purpose in purpose_list
                            if purpose["priority"] == purpose_priority
                        ),
                        "purpose_priority": purpose_priority,
                        "period": period,
                    }

                    cart.append(item_to_add)
                    added_quantity += 1

        if added_quantity != requested_quantity:
            if reason is None:
                purpose_keyword = next(
                    purpose["keyword"]
                    for purpose in purpose_list
                    if purpose["priority"] == purpose_priority
                )

                msg = f"현재 {collection['name']} 기자재는 {purpose_keyword} 목적으로 최대 {len(available_item_list)}개까지 대여할 수 있어요."

                if added_quantity == 0:
                    reason = "OUT_OF_STOCK"
                elif added_quantity < requested_quantity:
                    reason = "PARTIALLY_ADDED"
                    msg += f" 장바구니에 이미 {len(available_item_list) - added_quantity}개가 담겨 있어 {added_quantity}개만 추가했어요."

            elif reason and added_quantity != 0 and added_quantity < requested_quantity:
                msg += f" 장바구니에 이미 {int([char for char in msg if char.isdigit()][-1]) - added_quantity}개가 담겨 있어 {added_quantity}개만 추가했어요."

        status = "DONE" if item_to_add else "FAIL"
        cart.sort(key=lambda item: item["order"])

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "cart": cart,
        }

    # id: find_subject
    elif id == "find_subject":
        base_date = timezone.now().date()
        found_subject_list = get_subject(base_date)

        if len(found_subject_list) > 0:
            status = "DONE"
        else:
            status = "FAIL"

        response = {
            "id": id,
            "status": status,
            "found_subject_list": found_subject_list,
        }

    # id: find_project
    elif id == "find_project":
        data = {
            "table_name": "project-team",
            "params": {
                "view": "Grid view",
            },
        }

        project_list = airtable("get_all", "records", data)
        found_project_list = []
        cart_end_date = get_start_end_date(cart)[1]

        for project in project_list:
            if (
                project["purpose"]["priority"] == cart[0]["purpose"]["priority"]
                and convert_datetime(project["production_end_date"]).date()
                >= cart_end_date
                and project["facility_request"] is None
            ):
                for staff in project["staff"]:
                    if int(staff["pk"]) == request.user.pk and (
                        "A01" in staff["position_priority"]
                        or "C01" in staff["position_priority"]
                        or "E02" in staff["position_priority"]
                    ):
                        found_project_list.append(project)

        if len(found_project_list) > 0:
            status = "DONE"
        else:
            status = "FAIL"

        response = {
            "id": id,
            "status": status,
            "found_project_list": found_project_list,
        }

    # id: find_hour
    elif id == "find_hour":
        start_date = request.POST.get("startDate")
        end_date = request.POST.get("endDate")
        start_day = request.POST.get("startDay")
        end_day = request.POST.get("endDay")

        data = {
            "table_name": "equipment-hour",
            "params": {
                "view": "Grid view",
            },
        }

        hour_list = airtable("get_all", "records", data)
        start_day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][int(start_day)]
        end_day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][int(end_day)]
        start_hour_list = []
        end_hour_list = []

        for hour in hour_list:
            start_hour = hour.copy()
            end_hour = hour.copy()
            start_hour["available"] = True
            end_hour["available"] = True

            if len(hour["project_and_date"]) > 0:
                date_count = {}

                for project_and_date in hour["project_and_date"]:
                    date = project_and_date["date"]
                    date_count[date] = date_count.get(date, 0) + 1

                if date_count.get(start_date, 0) >= hour["max_capacity"]:
                    start_hour["available"] = False
                
                if date_count.get(end_date, 0) >= hour["max_capacity"]:
                    end_hour["available"] = False

            if hour["day_of_the_week"] == start_day:
                start_hour_list.append(start_hour)

            if hour["day_of_the_week"] == end_day:
                end_hour_list.append(end_hour)

        if len(start_hour_list) > 0 and len(end_hour_list) > 0:
            status = "DONE"
        else:
            status = "FAIL"

        response = {
            "id": "find_hour",
            "status": status,
            "start_hour_list": start_hour_list,
            "end_hour_list": end_hour_list,
        }

    # id: create_application
    elif id == "create_application":
        public_application_id = None
        private_application_id = None
        unavailable_item_list = []
        alternative_item_list = []
        status = "FAIL"
        reason = "UNAVAILABLE_ITEM"
        msg = "앗, 대여할 수 없는 기자재가 있어요!"
        item_id_list = [f"ID = '{item['item_id']}'" for item in cart]
        item_id_string = ", ".join(item_id_list)
        fields = ["Collection ID", "ID", "Name", "Status"]
        formula = f"AND(OR({item_id_string}), Status != 'Available')"

        data = {
            "table_name": "equipment-item",
            "params": {
                "view": "Grid view",
                "fields": fields,
                "formula": formula,
            },
        }

        unavailable_item_list = airtable("get_all", "records", data)

        if (len(unavailable_item_list)) > 0:
            purpose_keyword = cart[0]["purpose"]["keyword"]

            collection_id_list = [
                f"{{Collection ID}} = '{item['collection_id']}'"
                for item in unavailable_item_list
            ]

            collection_id_string = ", ".join(collection_id_list)
            fields = ["Collection ID"]
            formula = f"AND(OR({collection_id_string}), FIND('{purpose_keyword}', Purpose), Status = 'Available')"

            data = {
                "table_name": "equipment-item",
                "params": {
                    "view": "Grid view",
                    "fields": fields,
                    "formula": formula,
                },
            }

            alternative_item_list = airtable("get_all", "records", data)

        if len(alternative_item_list) > 0:
            alternative_items_by_collection = {}

            for item in alternative_item_list:
                collection_id = item["collection_id"]

                if collection_id not in alternative_items_by_collection:
                    alternative_items_by_collection[collection_id] = []

                alternative_items_by_collection[collection_id].append(item)

            for i, cart_item in enumerate(cart):
                cart_item_id = cart_item["item_id"]
                cart_collection_id = cart_item["collection_id"]

                unavailable = any(
                    unavailable_item["collection_id"] == cart_collection_id
                    and unavailable_item["item_id"] == cart_item_id
                    for unavailable_item in unavailable_item_list
                )

                if (
                    unavailable
                    and cart_collection_id in alternative_items_by_collection
                ):
                    alternative_item = alternative_items_by_collection[
                        cart_collection_id
                    ][0]

                    cart[i]["item_id"] = alternative_item["item_id"]
                    cart[i]["record_id"] = alternative_item["record_id"]

                    unavailable_item_list = [
                        unavailable_item
                        for unavailable_item in unavailable_item_list
                        if not (
                            unavailable_item["collection_id"] == cart_collection_id
                            and unavailable_item["item_id"] == cart_item_id
                        )
                    ]

        signature = request.FILES.get("signature")
        signature_bs64_encoded_data = process_signature(signature)
        student_name = request.user.metadata.name

        if is_invalid_signature(signature_bs64_encoded_data, student_name):
            reason = "INVALID_SIGNATURE"
            msg = "앗, 서명이 잘못된 것 같아요!"

        elif len(unavailable_item_list) == 0:
            status = "DONE"
            reason = "NOTHING_UNUSUAL"
            msg = "기자재 사용 신청서가 제출되었어요! 👍"
            is_for_instructor = cart[0]["purpose"]["for_instructor"]

            if is_for_instructor:
                project_record_id = None
                film_title = "-"
                project_id = subject_code = request.POST.get("subjectCode", None)
                academic_year = request.POST.get("academicYear", None)
                academic_semester = request.POST.get("academicSemester", None)
                subject_name = request.POST.get("subjectName", None)
                instructor_id = request.POST.get("instructor", None)
                instructor_name = request.POST.get("instructorName", None)
                director_student_id = director_name = director_phone_number = "-"

                director_of_photography_student_id = director_of_photography_name = (
                    director_of_photography_phone_number
                ) = "-"

                production_sound_mixer_student_id = production_sound_mixer_name = (
                    production_sound_mixer_phone_number
                ) = "-"

                purpose_priority = cart[0]["purpose"]["priority"]
            else:
                project_record_id = request.POST.get("project", None)

                data = {
                    "table_name": "project-team",
                    "params": {
                        "view": "Grid view",
                        "record_id": project_record_id,
                    },
                }

                project = airtable("get", "record", data)
                project_id = project["project_id"]
                film_title = project["film_title"]

                base_date = timezone.datetime.fromisoformat(
                    project["created_time"]
                ).date()

                base_year = base_date.year
                base_month = base_date.month
                academic_year = f"{base_year}학년도"
                academic_semester = "1학기" if base_month < 7 else "2학기"
                instructor_id = project["instructor"]
                purpose_priority = project["purpose"]["priority"]
                found_instructor_list = find_instructor(purpose_priority, base_date)[0]

                instuctor = next(
                    (x for x in found_instructor_list if x["id"] == instructor_id), None
                )

                subject_code = instuctor["code"]
                subject_name = instuctor["subject"]
                instructor_name = instuctor["name"]
                staff_list = project["staff"]

                for staff in staff_list:
                    position_priority = staff["position_priority"]
                    student_id = staff["student_id"]

                    if "A01" in position_priority:
                        director_student_id = student_id
                    if "C01" in position_priority:
                        director_of_photography_student_id = student_id
                    if "E02" in position_priority:
                        production_sound_mixer_student_id = student_id

                director = User.objects.get(username=director_student_id)
                director_name = director.metadata.name
                director_phone_number = director.metadata.phone

                director_of_photography = User.objects.get(
                    username=director_of_photography_student_id
                )

                director_of_photography_name = director_of_photography.metadata.name

                director_of_photography_phone_number = (
                    director_of_photography.metadata.phone
                )

                production_sound_mixer = User.objects.get(
                    username=production_sound_mixer_student_id
                )

                production_sound_mixer_name = production_sound_mixer.metadata.name

                production_sound_mixer_phone_number = (
                    production_sound_mixer.metadata.phone
                )

            purpose_list = get_equipment_data("purpose")

            purpose_keyword = next(
                purpose["keyword"]
                for purpose in purpose_list
                if purpose["priority"] == purpose_priority
            )

            period = cart[0]["period"]
            duration = split_period(period)[1]
            duration = f"{duration}일" if duration > 0 else "당일"
            start_date, end_date = get_start_end_date(cart)
            start_time = request.POST.get("startTime")
            end_time = request.POST.get("endTime")
            start_time_record_id = request.POST.get("startTimeRecordId")
            end_time_record_id = request.POST.get("endTimeRecordId")
            start_datetime = f"{start_date}({get_weekday(str(start_date))}) {'{}:{}'.format(start_time[:2], start_time[2:])}"
            end_datetime = f"{end_date}({get_weekday(str(end_date))}) {'{}:{}'.format(end_time[:2], end_time[2:])}"
            date_str = timezone.now().strftime("%Y-%m-%d")
            time_str = timezone.now().strftime("%H:%M:%S")
            datetime = f"{date_str}({get_weekday(date_str)}) {time_str}"
            student_id = request.user.username
            student_name = request.user.metadata.name

            replacements = {
                "film_title": film_title,
                "academic_year": academic_year,
                "academic_semester": academic_semester,
                "subject_code": subject_code,
                "subject_name": subject_name,
                "instructor_id": instructor_id,
                "instructor_name": instructor_name,
                "director_student_id": director_student_id,
                "director_name": director_name,
                "director_phone_number": director_phone_number,
                "director_of_photography_student_id": director_of_photography_student_id,
                "director_of_photography_name": director_of_photography_name,
                "director_of_photography_phone_number": director_of_photography_phone_number,
                "production_sound_mixer_student_id": production_sound_mixer_student_id,
                "production_sound_mixer_name": production_sound_mixer_name,
                "production_sound_mixer_phone_number": production_sound_mixer_phone_number,
                "purpose": purpose_keyword,
                "duration": duration,
                "start_datetime": start_datetime,
                "end_datetime": end_datetime,
                "datetime": datetime,
                "student_id": student_id,
                "student_name": student_name,
                "signature": "",
            }

            name_of_subject_or_project = (
                subject_name if is_for_instructor else film_title
            )

            private_application_id = copy_equipment_use_request_form(
                name_of_subject_or_project, student_id
            )

            add_editor_permission(private_application_id)
            signature_id = upload_signature(signature, film_title, student_id)
            make_file_public(signature_id)
            insert_signature(private_application_id, signature_id)
            GOOGLE_DRIVE.files().delete(fileId=signature_id).execute()
            add_equipment_to_table(private_application_id, cart)
            replace_text(private_application_id, replacements)

            if not is_for_instructor:
                fields_to_mask = {
                    "director": ["student_id", "name", "phone_number"],
                    "director_of_photography": ["student_id", "name", "phone_number"],
                    "production_sound_mixer": ["student_id", "name", "phone_number"],
                }

                for role, fields in fields_to_mask.items():
                    for field in fields:
                        key = f"{role}_{field}"
                        if key in replacements:
                            replacements[key] = mask_personal_information(
                                field, replacements[key]
                            )

            replacements["instructor_id"] = mask_personal_information(
                "instructor_id", instructor_id
            )

            replacements["instructor_name"] = mask_personal_information(
                "name", instructor_name
            )

            replacements["student_id"] = mask_personal_information(
                "student_id", student_id
            )

            replacements["student_name"] = mask_personal_information(
                "name", student_name
            )

            replacements["datetime"] = f"{date_str}({get_weekday(date_str)}) **:**:**"
            replacements["signature"] = "(서명 마스킹됨)"

            public_application_id = copy_equipment_use_request_form(
                name_of_subject_or_project, student_id, public=True
            )

            add_editor_permission(public_application_id)
            add_equipment_to_table(public_application_id, cart)
            replace_text(public_application_id, replacements)
            make_file_public(public_application_id)

            data = {
                "start_date": start_date,
                "start_time_record_id": start_time_record_id,
                "end_date": end_date,
                "end_time_record_id": end_time_record_id,
                "project_id": project_id,
            }

            update_equipment_hour(data)

            fields = {
                "Category": "Equipment",
                "Project team": [project_record_id] if not is_for_instructor else None,
                "Subject name": subject_name,
                "Start datetime": start_datetime,
                "End datetime": end_datetime,
                "Equipment item": [item["record_id"] for item in cart],
                "User": request.user.username,
                "Public ID": public_application_id,
                "Private ID": private_application_id,
                "For instructor": True if is_for_instructor else False,
            }

            data = {
                "table_name": "facility-request",
                "params": {
                    "view": "Grid view",
                    "fields": fields,
                },
            }

            airtable("create", "record", data)

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "public_application_id": public_application_id,
            "private_application_id": private_application_id,
            "unavailable_item_list": unavailable_item_list,
        }

        send_msg(request, "CREATE_EQUIPMENT_APPLICATION", "MGT", response)

    return JsonResponse(response)
