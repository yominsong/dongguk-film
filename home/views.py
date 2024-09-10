from django.conf import settings
from django.utils import timezone
from django.shortcuts import render
from utility.img import get_hero_img
from utility.utils import short_io, airtable, notion

SHORT_IO = getattr(settings, "SHORT_IO", None)
SHORT_IO_DOMAIN_ID = SHORT_IO["DOMAIN_ID"]
SHORT_IO_API_KEY = SHORT_IO["API_KEY"]


#
# Sub functions
#


def is_new_user(user):
    return user.last_login - user.date_joined < timezone.timedelta(
        minutes=30
    ) and timezone.now() - user.last_login < timezone.timedelta(minutes=3)


#
# Main functions
#


def home(request):
    new_user_bool = (
        is_new_user(request.user) if request.user.is_authenticated else False
    )

    image_list = get_hero_img("home")

    data = {"table_name": "facility-request"}

    facility_request_list = airtable("get_all", "records", data, 5)

    data = {"table_name": "project-team"}

    project_list = airtable("get_all", "records", data, 5)
    dflink_list = short_io("retrieve", limit=5)
    notice_list = notion("query", "db", data={"db_name": "notice"}, limit=5)

    return render(
        request,
        "home/home.html",
        {
            "is_new_user": new_user_bool,
            "image_list": image_list,
            "facility_request_list": facility_request_list,
            "project_list": project_list,
            "dflink_list": dflink_list,
            "notice_list": notice_list,
        },
    )


def error_400(request, exception):
    return render(request, "error/400.html")


def error_404(request, exception):
    return render(request, "error/404.html")


def error_408(request, exception):
    return render(request, "error/408.html")


def error_500(request):
    return render(request, "error/500.html")


def error_502(request, exception):
    return render(request, "error/502.html")
