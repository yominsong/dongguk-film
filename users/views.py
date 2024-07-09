from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from utility.img import get_hero_img
from utility.utils import short_io, notion

#
# Main functions
#


@login_required
def account(request):
    image_list = get_hero_img("account")

    return render(request, "users/account.html", {"image_list": image_list})
