from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from utility.utils import airtable
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
            "fields": ["Function", "Function priority", "Name", "Priority", "Keyword", "In English", "Note", "Required"],
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
    valid_hangul_or_non_hangul_regex = re.compile(r'([\uAC00-\uD7A3]|[^ㄱ-ㅎㅏ-ㅣ])+')
    hangul_syllable_regex = re.compile(r'[\uAC00-\uD7A3]')
    
    if not valid_hangul_or_non_hangul_regex.fullmatch(input_str):
        return False

    matches = hangul_syllable_regex.findall(input_str)

    return matches
    

#
# Main functions
#

@login_required
def project(request):
    id = request.POST.get("id")
    page_id = request.POST.get("page_id")
    title = request.POST.get("title")
    category = request.POST.get("category")
    name = request.POST.get("name")
    crew = request.POST.get("crew")

    status = None
    reason = None
    msg = None
    element = None

    # id: find_user
    if id == "find_user":
        if has_two_hangul_chars(name):
            user_query_set = Metadata.objects.filter(name=name).values("user", "name", "student_id")
            user_list = list(user_query_set)
        
        if user_list:
            for found_user in user_list:
                student_id = found_user["student_id"]
                found_user["student_id"] = student_id[:2] + "*" * (len(student_id) - 5) + student_id[-3:]
                user = User.objects.get(id=found_user["user"])
                found_user["avatar_url"] = user.socialaccount_set.all()[0].get_avatar_url()
                
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
        
    return JsonResponse(response)