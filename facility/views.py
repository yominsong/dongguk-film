from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from utility.img import get_hero_img
from utility.utils import get_permission_type_list


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
