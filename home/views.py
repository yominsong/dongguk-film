from django.conf import settings
from django.utils import timezone
from django.shortcuts import render
from utility.img import get_img
from utility.utils import short_io, notion

SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")


#
# Sub functions
#


def is_new_user(user):
    return timezone.now() - user.date_joined < timezone.timedelta(minutes=3)


#
# Main functions
#


def home(request):
    new_user_bool = (
        is_new_user(request.user) if request.user.is_authenticated else False
    )

    image_list = get_img("home")
    dflink_list = short_io("retrieve", limit=5)
    notice_list = notion("query", "db", data={"db_name": "notice-db"}, limit=5)

    return render(
        request,
        "home/home.html",
        {
            "is_new_user": new_user_bool,
            "image_list": image_list,
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
