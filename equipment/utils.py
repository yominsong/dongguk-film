from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.utils import timezone
from urllib.parse import urlencode
from .models import Cart
from utility.hangul import handle_hangul
from utility.utils import (
    get_equipment_data,
    find_instructor,
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
import json, ast

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
    target_list = ["category", "purpose", "limit", "collection", "hour"]
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
        elif target == "hour":
            data = {
                "table_name": "equipment-hour",
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


def copy_equipment_use_request_form(project_name, student_id):
    copied_document = (
        GOOGLE_DRIVE.files()
        .copy(
            fileId=GOOGLE_DOCS_TEMPLATE_ID["equipment_use_request_form"],
            body={"name": f"{project_name} {student_id} 기자재 사용 신청서"},
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
    unique_cart = list(reversed({item["collection_id"]: item for item in cart}.values()))
    insert_requests = []
    table_start_index = 649

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

        start_index = 738

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


def insert_signature(document_id, signature_id):
    image_url = f"https://drive.google.com/uc?export=view&id={signature_id}"

    requests = [
        {
            "insertInlineImage": {
                "location": {"index": 1312},
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


#
# Main functions
#


def equipment(request):
    id = request.POST.get("id")
    record_id = request.POST.get("recordId")
    category_priority = request.POST.get("categoryPriority")
    purpose_priority = request.POST.get("purposePriority")
    period = request.POST.get("period")
    requested_quantity = request.POST.get("requestedQuantity")
    cart = request.POST.get("cart")
    start_date = request.POST.get("startDate")
    end_date = request.POST.get("endDate")
    start_day = request.POST.get("startDay")
    end_day = request.POST.get("endDay")

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
                item["status"] == "Available"
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
            "result": {
                "status": status,
                "reason": reason,
                "msg": msg,
                "cart": cart,
            },
        }

    # id: find_project
    elif id == "find_project":
        cart = json.loads(cart)
        project_list = notion("query", "db", data={"db_name": "project"})
        found_project_list = []
        cart_start_date, cart_end_date = get_start_end_date(cart)

        for project in project_list:
            if (
                project["purpose"]["priority"] == cart[0]["purpose"]["priority"]
                and convert_datetime(project["production_end_date"]).date()
                >= cart_end_date
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
            "result": {
                "status": status,
                "found_project_list": found_project_list,
            },
        }

    # id: find_hour
    elif id == "find_hour":
        data = {
            "table_name": "equipment-hour",
            "params": {
                "view": "Grid view",
            },
        }

        hour_list = airtable("get_all", "records", data=data)
        start_day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][int(start_day)]
        end_day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][int(end_day)]
        project_and_date_list = []
        start_hour_list = []
        end_hour_list = []

        for hour in hour_list:
            hour["available"] = True

            if hour["project_and_date"] is not None:
                for project_and_date in hour["project_and_date"]:
                    if (
                        project_and_date["date"] == start_date
                        or project_and_date["date"] == end_date
                    ):
                        project_and_date_list.append(project_and_date)

                if len(project_and_date_list) >= hour["max_capacity"]:
                    hour["available"] = False

            if hour["day_of_the_week"] == start_day:
                start_hour_list.append(hour)

            if hour["day_of_the_week"] == end_day:
                end_hour_list.append(hour)

        if len(start_hour_list) > 0 and len(end_hour_list) > 0:
            status = "DONE"
        else:
            status = "FAIL"

        response = {
            "id": id,
            "result": {
                "status": status,
                "start_hour_list": start_hour_list,
                "end_hour_list": end_hour_list,
            },
        }

    # id: request_application
    elif id == "request_application":
        cart = json.loads(cart)
        project_id = request.POST.get("project")
        start_time = request.POST.get("startTime")
        end_time = request.POST.get("endTime")
        student_id = request.user.username
        signature = request.FILES.get("signature")

        project = notion("retrieve", "page", data={"page_id": project_id}).json()
        project_properties = project["properties"]

        project_name = project_properties["Title"]["title"][0]["plain_text"]
        base_date = timezone.datetime.fromisoformat(project["created_time"]).date()
        base_year = base_date.year
        base_month = base_date.month
        academic_year = f"{base_year}학년도"
        academic_semester = "1학기" if base_month < 7 else "2학기"
        instructor_id = project_properties["Instructor"]["rich_text"][0]["plain_text"]
        purpose_priority = project_properties["Purpose"]["rich_text"][0]["plain_text"]
        found_instructor_list = find_instructor(purpose_priority, base_date)[0]
        instuctor = next(
            (x for x in found_instructor_list if x["id"] == instructor_id), None
        )
        subject_code = instuctor["code"]
        subject_name = instuctor["subject"]
        instructor_name = instuctor["name"]
        staff_list = ast.literal_eval(
            project_properties["Staff"]["rich_text"][0]["plain_text"]
        )

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
        director_of_photography_phone_number = director_of_photography.metadata.phone
        production_sound_mixer = User.objects.get(
            username=production_sound_mixer_student_id
        )
        production_sound_mixer_name = production_sound_mixer.metadata.name
        production_sound_mixer_phone_number = production_sound_mixer.metadata.phone

        purpose_list = get_equipment_data("purpose")

        purpose_keyword = next(
            purpose["keyword"]
            for purpose in purpose_list
            if purpose["priority"] == purpose_priority
        )

        period = cart[0]["period"]
        duration = f"{split_period(period)[1]}일"
        start_date, end_date = get_start_end_date(cart)
        start_datetime = f"{start_date}({get_weekday(str(start_date))}) {'{}:{}'.format(start_time[:2], start_time[2:])}"
        end_datetime = f"{end_date}({get_weekday(str(end_date))}) {'{}:{}'.format(end_time[:2], end_time[2:])}"
        date_str = timezone.now().strftime("%Y-%m-%d")
        time_str = timezone.now().strftime("%H:%M:%S")
        datetime = f"{date_str}({get_weekday(date_str)}) {time_str}"

        replacements = {
            "project_name": project_name,
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
            "student_id": request.user.username,
            "student_name": request.user.metadata.name,
            "signature": "",
        }

        application_id = copy_equipment_use_request_form(project_name, student_id)
        add_editor_permission(application_id)
        signature_id = upload_signature(signature, project_name, student_id)
        make_file_public(signature_id)
        insert_signature(application_id, signature_id)
        GOOGLE_DRIVE.files().delete(fileId=signature_id).execute()
        add_equipment_to_table(application_id, cart)
        response = replace_text(application_id, replacements)

    return JsonResponse(response)


[
    {
        "record_id": "rec6yEAtzZ6cX07sO",
        "collection_id": "A0SF006",
        "item_id": "A0SF00601",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/IZaRTuUjGEyUf9AD8bKrIQ/KetG7tNjJtU9VPaflj0hIgcY5mmG3eyKuRrWmo9FwM1QQUyuFfm8ljCO8Akvn5JCoTa9dX6T57egBpd6WQak7Id-NVzt4J0eOmVZw6nfRzPXMIHsgsmZC8d2KMeHhpjRGIiduNEBKiJslPpYbgmiTg/8Bo3mZN1D9C2JxArwamw4hUWMI98HVuQ1GC-jjIMDqw",
        "name": "Sony FX3",
        "brand": "Sony",
        "category": {"priority": "A", "keyword": "카메라"},
        "subcategory": {"keyword": None, "order": None},
        "order": "A 카메라Sony FX3",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    },
    {
        "record_id": "recm8Z4Kdaaaauu1T",
        "collection_id": "H0SM129",
        "item_id": "H0SM12904",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/bGn07j7eb96wO47M-bwPKw/4SLEIEXsFSgQbhFjgO-yDADWw35_Y-JxtatiKfPFPKkgvJQjAADbSYsPe7MCEKgKKVFOVzDokQVMS1IucBhyU65X10yaMRukxcFyZueo8nkJF1nxgCPcQE7XDAbPO09nuNkkk_ujap_6RCuBP1SDqHqhmeWAoUoCr589xQr_4Ag/ZSPiipGf7o-qCm4JcKkTDCtsZQXakC0AhZ0oSCSTOHg",
        "name": "Sound Devices MixPre-6 II",
        "brand": "Sound Devices",
        "category": {"priority": "H", "keyword": "오디오 레코더"},
        "subcategory": {"keyword": None, "order": None},
        "order": "H 오디오 레코더Sound Devices MixPre-6 II",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    },
    {
        "record_id": "recvmaiFXctNJS7WR",
        "collection_id": "I1RN135",
        "item_id": "I1RN13503",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/NYDCWXsNGxvXsptunHLcRg/4FoEJtcgZASewCHN1iNrW0xiiu2TFwbKz1e5lrr2eBBYZw6FaUKGDKtpSoGXxUQm24b7DbYZ-fvRt8G9d5_DBp_-CLE9rc3zR2g5_6MoDIIg6eNe4VcXaF2d_iZnYORNTs0YIi04ijOFXPr5HzUQlg/b_k2SI5o2X9xz5RuzosvJcj4BwAVkdo82KJl8hu3Ue4",
        "name": "RØDE NTG4+",
        "brand": "RØDE",
        "category": {"priority": "I", "keyword": "마이크"},
        "subcategory": {"keyword": "Shotgun", "order": "I1"},
        "order": "I 마이크I1 ShotgunRØDE NTG4+",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    },
    {
        "record_id": "rechWl5o1dJpKIl5C",
        "collection_id": "J1U3143",
        "item_id": "J1U314301",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/2-E642E2QGU1UmKtqwwbSQ/ox2Edagu7Isd8-bCbxs__zxYRkRUiWka7SvcBSl5Dj1qK6z0-Z4mDU58ItGy8Eu9SFsF64x8SvWcMuYGrCuaxECMh58JCCUwGTKmBS5rD-XXNhCznM2z4KRGjebk1Ntj6r-gjU2z3H9FiP2c4XqZAS7ZNb8eKxo4Hzt3y0Lia-s/cswEbxG_rv65cOJr7War65O0I5LpF3E2e5hS_0_8uoo",
        "name": "3-Section 3.5m Boom Pole",
        "brand": "Unknown",
        "category": {"priority": "J", "keyword": "마이크 액세서리"},
        "subcategory": {"keyword": "Boom Pole", "order": "J1"},
        "order": "J 마이크 액세서리J1 Boom Pole3-Section 3.5m Boom Pole",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    },
    {
        "record_id": "recNyhsP2MIYGFA8M",
        "collection_id": "J2UB145",
        "item_id": "J2UB14502",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/drcBi2KeXkI7c6n_3tV1zQ/zuVDPlzVwAoqaa8AcS3QfUnMDjgwG_-q3D9yA5vIdFYjn94kRm8Q4zFAxf5IfnayEMU6_FCHWzur8kBkg47XE6fxXK-clzC_KhJHCXJ0Z_oESEjZ5zz_gncVX0PQfi2SYPWpO9kZIzz7ZDlDvukHkw/p-wYsYG3FfyH_RN9eVuDcDaCexir-Xn_TfXSbnWP278",
        "name": "Boom Pole Holder",
        "brand": "Unknown",
        "category": {"priority": "J", "keyword": "마이크 액세서리"},
        "subcategory": {"keyword": "Boom Pole Holder", "order": "J2"},
        "order": "J 마이크 액세서리J2 Boom Pole HolderBoom Pole Holder",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    },
    {
        "record_id": "recZamvNWK1QgiNA2",
        "collection_id": "J2UB145",
        "item_id": "J2UB14503",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/drcBi2KeXkI7c6n_3tV1zQ/zuVDPlzVwAoqaa8AcS3QfUnMDjgwG_-q3D9yA5vIdFYjn94kRm8Q4zFAxf5IfnayEMU6_FCHWzur8kBkg47XE6fxXK-clzC_KhJHCXJ0Z_oESEjZ5zz_gncVX0PQfi2SYPWpO9kZIzz7ZDlDvukHkw/p-wYsYG3FfyH_RN9eVuDcDaCexir-Xn_TfXSbnWP278",
        "name": "Boom Pole Holder",
        "brand": "Unknown",
        "category": {"priority": "J", "keyword": "마이크 액세서리"},
        "subcategory": {"keyword": "Boom Pole Holder", "order": "J2"},
        "order": "J 마이크 액세서리J2 Boom Pole HolderBoom Pole Holder",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    },
    {
        "record_id": "recQhdWenQeEo58SY",
        "collection_id": "J2UB145",
        "item_id": "J2UB14501",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/drcBi2KeXkI7c6n_3tV1zQ/zuVDPlzVwAoqaa8AcS3QfUnMDjgwG_-q3D9yA5vIdFYjn94kRm8Q4zFAxf5IfnayEMU6_FCHWzur8kBkg47XE6fxXK-clzC_KhJHCXJ0Z_oESEjZ5zz_gncVX0PQfi2SYPWpO9kZIzz7ZDlDvukHkw/p-wYsYG3FfyH_RN9eVuDcDaCexir-Xn_TfXSbnWP278",
        "name": "Boom Pole Holder",
        "brand": "Unknown",
        "category": {"priority": "J", "keyword": "마이크 액세서리"},
        "subcategory": {"keyword": "Boom Pole Holder", "order": "J2"},
        "order": "J 마이크 액세서리J2 Boom Pole HolderBoom Pole Holder",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    },
]

[
    {
        "record_id": "rec6yEAtzZ6cX07sO",
        "collection_id": "A0SF006",
        "item_id": "A0SF00601",
        "thumbnail": "https://v5.airtableusercontent.com/v3/u/29/29/1718546400000/IZaRTuUjGEyUf9AD8bKrIQ/KetG7tNjJtU9VPaflj0hIgcY5mmG3eyKuRrWmo9FwM1QQUyuFfm8ljCO8Akvn5JCoTa9dX6T57egBpd6WQak7Id-NVzt4J0eOmVZw6nfRzPXMIHsgsmZC8d2KMeHhpjRGIiduNEBKiJslPpYbgmiTg/8Bo3mZN1D9C2JxArwamw4hUWMI98HVuQ1GC-jjIMDqw",
        "name": "Sony FX3",
        "brand": "Sony",
        "category": {"priority": "A", "keyword": "카메라"},
        "subcategory": {"keyword": None, "order": None},
        "order": "A 카메라Sony FX3",
        "purpose": {
            "name": "C 캡스톤 디자인",
            "priority": "C",
            "keyword": "캡스톤 디자인",
            "secondary_keyword": "제작 실기",
            "at_least": 3,
            "up_to": 14,
            "max": 7,
            "in_a_nutshell": "최소 3일 ~ 최대 14일 전 신청 가능, 최대 7일간 대여 가능",
            "curricular": True,
            "for_senior_project": False,
            "for_instructor": False,
        },
        "purpose_priority": "C",
        "period": "3,7",
    }
]

{
    "object": "page",
    "id": "530eaf1b-5b87-4c86-a6ef-70e912d0ebac",
    "created_time": "2024-06-16T06:06:00.000Z",
    "last_edited_time": "2024-06-16T06:06:00.000Z",
    "created_by": {"object": "user", "id": "ce7e5a1e-f949-482c-905f-9e45fef6cfb9"},
    "last_edited_by": {"object": "user", "id": "ce7e5a1e-f949-482c-905f-9e45fef6cfb9"},
    "cover": None,
    "icon": None,
    "parent": {
        "type": "database_id",
        "database_id": "60905426-8f5d-498d-bdb4-3446c266d15c",
    },
    "archived": False,
    "in_trash": False,
    "properties": {
        "Last edited time": {
            "id": "DiBG",
            "type": "last_edited_time",
            "last_edited_time": "2024-06-16T06:06:00.000Z",
        },
        "Production end date": {
            "id": "Evf%3C",
            "type": "date",
            "date": {"start": "2024-09-14", "end": None, "time_zone": None},
        },
        "Staff": {
            "id": "N%3Fy_",
            "type": "rich_text",
            "rich_text": [
                {
                    "type": "text",
                    "text": {
                        "content": "[{'position_priority': ['A01', 'B01', 'C01', 'E02'], 'student_id': '2015113035'}]",
                        "link": None,
                    },
                    "annotations": {
                        "bold": False,
                        "italic": False,
                        "strikethrough": False,
                        "underline": False,
                        "code": False,
                        "color": "default",
                    },
                    "plain_text": "[{'position_priority': ['A01', 'B01', 'C01', 'E02'], 'student_id': '2015113035'}]",
                    "href": None,
                }
            ],
        },
        "Subject code": {
            "id": "Ox~f",
            "type": "rich_text",
            "rich_text": [
                {
                    "type": "text",
                    "text": {"content": "FIL4071", "link": None},
                    "annotations": {
                        "bold": False,
                        "italic": False,
                        "strikethrough": False,
                        "underline": False,
                        "code": False,
                        "color": "default",
                    },
                    "plain_text": "FIL4071",
                    "href": None,
                }
            ],
        },
        "Purpose": {
            "id": "%5Bh_H",
            "type": "rich_text",
            "rich_text": [
                {
                    "type": "text",
                    "text": {"content": "C", "link": None},
                    "annotations": {
                        "bold": False,
                        "italic": False,
                        "strikethrough": False,
                        "underline": False,
                        "code": False,
                        "color": "default",
                    },
                    "plain_text": "C",
                    "href": None,
                }
            ],
        },
        "Instructor": {
            "id": "%5CqvD",
            "type": "rich_text",
            "rich_text": [
                {
                    "type": "text",
                    "text": {"content": "20010743", "link": None},
                    "annotations": {
                        "bold": False,
                        "italic": False,
                        "strikethrough": False,
                        "underline": False,
                        "code": False,
                        "color": "default",
                    },
                    "plain_text": "20010743",
                    "href": None,
                }
            ],
        },
        "User": {"id": "dqsw", "type": "number", "number": 2015113035},
        "Created time": {
            "id": "hYVx",
            "type": "created_time",
            "created_time": "2024-06-16T06:06:00.000Z",
        },
        "Subject name": {
            "id": "vM%3Av",
            "type": "rich_text",
            "rich_text": [
                {
                    "type": "text",
                    "text": {"content": "다큐멘타리제작캡스톤디자인", "link": None},
                    "annotations": {
                        "bold": False,
                        "italic": False,
                        "strikethrough": False,
                        "underline": False,
                        "code": False,
                        "color": "default",
                    },
                    "plain_text": "다큐멘타리제작캡스톤디자인",
                    "href": None,
                }
            ],
        },
        "Title": {
            "id": "title",
            "type": "title",
            "title": [
                {
                    "type": "text",
                    "text": {"content": "<펠덴크라이스의 ATM>", "link": None},
                    "annotations": {
                        "bold": False,
                        "italic": False,
                        "strikethrough": False,
                        "underline": False,
                        "code": False,
                        "color": "default",
                    },
                    "plain_text": "<펠덴크라이스의 ATM>",
                    "href": None,
                }
            ],
        },
    },
    "url": "https://www.notion.so/ATM-530eaf1b5b874c86a6ef70e912d0ebac",
    "public_url": None,
    "request_id": "b7720389-f0ca-4496-aa2d-c94c2a935955",
}
