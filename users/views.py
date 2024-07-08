from django.shortcuts import render
from utility.img import get_hero_img


def account(request):
    image_list = get_hero_img("account")

    return render(request, "users/account.html", {"image_list": image_list})