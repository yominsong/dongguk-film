from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from equipment.utils import get_equipment_data
from utility.utils import airtable, notion
from utility.msg import send_msg
from fake_useragent import UserAgent
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from users.models import Metadata
import json, re

DMD_URL = getattr(settings, "DMD_URL", "DMD_URL")
DMD_COOKIE = getattr(settings, "DMD_COOKIE", "DMD_COOKIE")
headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}

#
# Global variables
#

JSON_PATH = (
    "dongguk_film/static/json/project.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/project.json"
)

#
# Cron functions
#


def update_project_policy(request):
    target_list = ["position"]
    result_list = []

    for target in target_list:
        if target == "position":
            data = {
                "table_name": "project-position",
                "params": {
                    "view": "Grid view",
                    "fields": [
                        "Function",
                        "Function priority",
                        "Name",
                        "Priority",
                        "Keyword",
                        "In English",
                        "Note",
                        "Required",
                    ],
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

    send_msg(request, "UPP", "DEV", result_list)

    return HttpResponse(f"Updated project policy: {result_list}")


#
# Sub functions
#


def get_project_policy(policy: str):
    with open(JSON_PATH, "r") as f:
        item_list = json.load(f)[policy]
        f.close()

        return item_list


def get_subject(base_date: str):
    base_date = timezone.datetime.strptime(base_date, "%Y-%m-%d").date()
    base_year = base_date.year
    base_month = base_date.month
    headers["Cookie"] = DMD_COOKIE

    params = {
        "strCampFg": "S",
        "strUnivGrscFg": "U0001001",
        "strLtYy": str(base_year),
        "strLtShtmCd": "U0002001" if base_month < 7 else "U0002002",
        "strFindType": "CODE",
        "strSbjt": "FIL",
    }

    result_list = []
    subject_dict = {}

    with Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=3))
        response = session.get(DMD_URL["timetable"], params=params, headers=headers)
        subject_list = response.json()["out"]["DS_COUR110"]

    for subject in subject_list:
        key = (
            subject["sbjtKorNm"],
            subject["sbjtEngNm"],
            subject["haksuNo"],
            subject["openShyrNm"],
        )

        instructor = {"id": subject["ltSprfNo"], "name": subject["ltSprfNm"]}

        if key not in subject_dict:
            subject_dict[key] = [instructor]
        else:
            subject_dict[key].append(instructor)

    for (kor_name, eng_name, code, target_year), instructors in subject_dict.items():
        target_year = [
            int(num) for num in re.sub(r"[^\d,]", "", target_year).split(",")
        ]

        result = {
            "kor_name": kor_name,
            "eng_name": eng_name,
            "code": code,
            "target_year": target_year,
            "instructor": instructors,
        }

        result_list.append(result)

    return result_list


def has_hangul_chars(input_str):
    valid_hangul_or_non_hangul_regex = re.compile(r"([\uAC00-\uD7A3]|[^ㄱ-ㅎㅏ-ㅣ])+")
    hangul_syllable_regex = re.compile(r"[\uAC00-\uD7A3]")

    if not valid_hangul_or_non_hangul_regex.fullmatch(input_str):
        return False

    matches = hangul_syllable_regex.findall(input_str)

    return matches


def get_staff(request):
    staff_list = []
    index = 0

    while request.POST.get(f"staffPk_{index}") is not None:
        staff_pk = request.POST.get(f"staffPk_{index}")
        staff_position_priority = json.loads(
            request.POST.get(f"staffPositionPriority_{index}")
        )

        staff_dict = {
            "position_priority": staff_position_priority,
            "student_id": User.objects.get(id=staff_pk).username,
        }

        staff_list.append(staff_dict)
        index += 1

    return staff_list


#
# Main functions
#


@login_required
def project(request):
    id = request.POST.get("id")
    page_id = request.POST.get("page_id")
    title = request.POST.get("title")
    purpose = request.POST.get("purpose")
    instructor = request.POST.get("instructor")
    production_end_date = request.POST.get("production_end_date")
    name = request.POST.get("name")
    base_date = request.POST.get("base_date")

    status = None

    # id: find_instructor
    if id == "find_instructor":
        purpose_list = get_equipment_data("purpose")

        for purpose_item in purpose_list:
            if purpose_item["priority"] == purpose:
                purpose_keyword = purpose_item["keyword"].replace(" ", "")
                purpose_secondary_keyword = purpose_item.get("secondary_keyword", None)
                purpose_secondary_keyword = (
                    purpose_secondary_keyword.replace(" ", "")
                    if purpose_secondary_keyword
                    else None
                )
                purpose_curricular = purpose_item["curricular"]
                purpose_for_senior_project = purpose_item["for_senior_project"]
                break

        found_instructor_list = []

        if purpose_curricular:
            subject_list = get_subject(base_date)

            for subject in subject_list:
                if (
                    purpose_keyword in subject["kor_name"]
                    or (
                        purpose_secondary_keyword in subject["kor_name"]
                        if purpose_secondary_keyword
                        else False
                    )
                ) and (
                    subject["target_year"] == [4]  # 졸업
                    if purpose_for_senior_project
                    else subject["target_year"] != [4]  # exclude 졸업
                ):
                    for instructor in subject["instructor"]:
                        found_instructor = {
                            "id": instructor["id"],
                            "name": instructor["name"],
                            "subject": subject["kor_name"],
                            "code": subject["code"],
                        }

                        if found_instructor not in found_instructor_list:
                            found_instructor_list.append(found_instructor)

        found_instructor_list.sort(key=lambda x: (x["code"], x["name"]))

        if len(found_instructor_list) > 0:
            status = "DONE"
        else:
            status = "FAIL"

        response = {
            "id": id,
            "result": {
                "status": status,
                "found_instructor_list": found_instructor_list,
            },
        }

    # id: find_user
    elif id == "find_user":
        if has_hangul_chars(name):
            found_user_query_set = Metadata.objects.filter(name__icontains=name).values(
                "user", "name", "student_id"
            )
            found_user_list = list(found_user_query_set)

        if found_user_list:
            for found_user in found_user_list:
                student_id = found_user["student_id"]
                found_user["student_id"] = (
                    student_id[:2] + "*" * (len(student_id) - 5) + student_id[-3:]
                )
                user = User.objects.get(id=found_user["user"])
                found_user["avatar_url"] = user.socialaccount_set.all()[
                    0
                ].get_avatar_url()
                found_user["pk"] = found_user.pop("user")

            status = "DONE"
        else:
            status = "FAIL"

        response = {
            "id": id,
            "result": {
                "status": status,
                "found_user_list": found_user_list,
            },
        }

    # id: create_project
    elif id == "create_project":
        staff = get_staff(request)

        data = {
            "db_name": "project",
            "title": title,
            "purpose": purpose,
            "instructor": instructor,
            "production_end_date": production_end_date,
            "staff": staff,
            "user": request.user,
        }
        response = notion("create", "page", data=data)

        if response.status_code == 200:
            status = "DONE"
            msg = "프로젝트가 등록되었어요! 👍"
        elif response.status_code == 400:
            status = "FAIL"
            reason = response.json()
            msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
        elif response.status_code == 429:
            status = "FAIL"
            reason = "Notion API rate limit 초과"
            msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
        else:
            status = "FAIL"
            reason = response.json()
            msg = "앗, 알 수 없는 오류가 발생했어요!"

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason if status == "FAIL" else None,
                "msg": msg,
                "notion_url": response.json()["url"] if status == "DONE" else None,
                "title": title,
                "purpose": purpose,
                "user": f"{request.user}",
            },
        }

    # id: update_project
    elif id == "update_project":
        staff = get_staff(request)

        data = {
            "db_name": "project",
            "page_id": page_id,
            "title": title,
            "purpose": purpose,
            "instructor": instructor,
            "production_end_date": production_end_date,
            "staff": staff,
            "user": request.user,
        }
        response = notion("update", "page_properties", data=data)

        if response.status_code == 200:
            status = "DONE"
            msg = "프로젝트가 수정되었어요! 👍"
        elif response.status_code == 400:
            status = "FAIL"
            reason = response.json()
            msg = "앗, 잠시 후 다시 한 번 시도해주세요!"
        else:
            status = "FAIL"
            reason = response.json()
            msg = "앗, 알 수 없는 오류가 발생했어요!"

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason if status == "FAIL" else None,
                "msg": msg,
                "notion_url": response.json()["url"] if status == "DONE" else None,
                "title": title,
                "purpose": purpose,
                "user": f"{request.user}",
            },
        }

    # id: delete_project
    elif id == "delete_project":
        staff = json.loads(request.POST.get("staff"))
        data = {"page_id": page_id}
        response = notion("delete", "page", data=data)

        if response.status_code == 200:
            status = "DONE"
            msg = "프로젝트가 삭제되었어요! 🗑️"
        elif response.status_code != 200:
            status = "FAIL"
            reason = response.json()
            msg = "앗, 삭제할 수 없는 프로젝트예요!"

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason if status == "FAIL" else None,
                "msg": msg,
                "notion_url": response.json()["url"] if status == "DONE" else None,
                "title": title,
                "purpose": purpose,
                "user": f"{request.user}",
            },
        }

    return JsonResponse(response)
