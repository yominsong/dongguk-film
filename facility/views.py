from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from utility.img import get_hero_img
from utility.utils import notion

#
# Global variables
#

NOTION = getattr(settings, "NOTION", None)
NOTION_SECRET = NOTION["SECRET"]
NOTION_DB_ID = NOTION["DB_ID"]

#
# Sub functions
#


def get_permission_type_list(request):
    permission_list = notion("query", "db", data={"db_name": "PERMISSION"})
    permission_type_list = []

    for permission in permission_list:
        if permission["student_id"] == request.user.username:
            permission_type_list = permission["type_list"]
            break

    return permission_type_list


#
# Main functions
#


@ensure_csrf_cookie
def facility(request):
    image_list = get_hero_img("facility")

    return render(
        request,
        "facility/facility.html",
        {
            "image_list": image_list,
            "permission_type_list": get_permission_type_list(request),
        },
    )
