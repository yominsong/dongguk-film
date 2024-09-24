from django.shortcuts import render
from django.utils import timezone
from utility.img import get_hero_img
from utility.utils import airtable

#
# Main functions
#


def facility(request):
    image_list = get_hero_img("facility")

    return render(
        request,
        "facility/facility.html",
        {"image_list": image_list},
    )
