from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from utility.img import get_hero_img
from utility.utils import format_datetime

#
# Main functions
#


@login_required
def account(request):
    image_list = get_hero_img("account")
    date_joined = format_datetime(request.user.date_joined)

    return render(
        request,
        "users/account.html",
        {"image_list": image_list, "date_joined": date_joined},
    )
