from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from utility.utils import airtable, notion
from utility.msg import send_msg
from users.models import Metadata
import json, re

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


def update_project_position(request):
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
    result_list = record_list

    with open(JSON_PATH, "r+") as f:
        data = record_list
        f.seek(0)
        f.write(json.dumps(data, indent=4))
        f.truncate()

    send_msg(request, "UPP", "DEV", result_list)

    return HttpResponse(f"Updated project position: {result_list}")


#
# Sub functions
#


def get_project_position():
    with open(JSON_PATH, "r") as f:
        item_list = json.load(f)
        f.close()

        return item_list


def has_two_hangul_chars(input_str):
    valid_hangul_or_non_hangul_regex = re.compile(r"([\uAC00-\uD7A3]|[^ㄱ-ㅎㅏ-ㅣ])+")
    hangul_syllable_regex = re.compile(r"[\uAC00-\uD7A3]")

    if not valid_hangul_or_non_hangul_regex.fullmatch(input_str):
        return False

    matches = hangul_syllable_regex.findall(input_str)

    return matches


def get_crew(request):
    crew_list = []
    index = 0

    while request.POST.get(f"crewUser_{index}") is not None:
        crew_user = request.POST.get(f"crewUser_{index}")
        crew_position = request.POST.get(f"crewPosition_{index}")

        crew_dict = {
            "position": crew_position,
            "user": User.objects.get(id=crew_user).username,
        }
        crew_list.append(crew_dict)
        index += 1

    return crew_list


#
# Main functions
#


@login_required
def project(request):
    id = request.POST.get("id")
    title = request.POST.get("title")
    category = request.POST.get("category")
    name = request.POST.get("name")

    status = None

    # id: find_user
    if id == "find_user":
        if has_two_hangul_chars(name):
            user_query_set = Metadata.objects.filter(name=name).values(
                "user", "name", "student_id"
            )
            user_list = list(user_query_set)

        if user_list:
            for found_user in user_list:
                student_id = found_user["student_id"]
                found_user["student_id"] = (
                    student_id[:2] + "*" * (len(student_id) - 5) + student_id[-3:]
                )
                user = User.objects.get(id=found_user["user"])
                found_user["avatar_url"] = user.socialaccount_set.all()[
                    0
                ].get_avatar_url()

            status = "DONE"
            reason = "사용자 검색 성공"
        else:
            status = "FAIL"
            reason = "사용자 검색 실패"

        response = {
            "id": id,
            "result": {
                "status": status,
                "reason": reason,
                "user_list": user_list,
            },
        }

    elif id == "create_project":
        crew = get_crew(request)

        data = {
            "db_name": "project",
            "title": title,
            "category": category,
            "crew": crew,
            "user": request.user,
        }
        response = notion("create", "page", data=data)

        if response.status_code == 200:
            status = "DONE"
            reason = "프로젝트 등록"
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
                "reason": reason,
                "msg": msg,
                "notion_url": response.json()["url"] if status == "DONE" else None,
                "title": title,
                "category": category,
                "user": f"{request.user}",
            },
        }

    return JsonResponse(response)
