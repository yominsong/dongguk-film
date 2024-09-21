from django.shortcuts import render
from django.core.paginator import Paginator
from utility.img import get_hero_img


def facility(request):
    query_string = ""
    image_list = get_hero_img("facility")

    return render(
        request,
        "facility/facility.html",
        {"query_string": query_string, "image_list": image_list},
    )
