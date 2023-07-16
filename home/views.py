from django.conf import settings
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.shortcuts import render
from utility.img import get_img
from dflink.utils import short_io

SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")


#
# Sub functions
#


async def is_new_user(user):
    return timezone.now() - user.date_joined < timezone.timedelta(minutes=3)


#
# Main functions
#


async def home(request):
    new_user_bool = (
        await is_new_user(request.user) if request.user.is_authenticated else False
    )

    image_list = await sync_to_async(get_img)("home")
    dflink_list = await sync_to_async(short_io)(5)

    return await sync_to_async(render)(
        request,
        "home/home.html",
        {
            "is_new_user": new_user_bool,
            "image_list": image_list,
            "dflink_list": dflink_list,
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
