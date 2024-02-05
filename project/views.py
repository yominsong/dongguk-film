from django.shortcuts import render
from utility.img import get_hero_img


def project(request):
    image_list = get_hero_img("project")

    return render(request, "project/project.html", {"image_list": image_list})
