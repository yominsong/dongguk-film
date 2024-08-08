from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from utility.img import get_hero_img
from utility.utils import format_datetime, mask_personal_information

#
# Main functions
#


@login_required
def account(request):
    image_list = get_hero_img("account")

    masked_student_id = mask_personal_information(
        "student_id", request.user.metadata.student_id
    )

    masked_name = mask_personal_information("name", request.user.metadata.name)
    masked_email = mask_personal_information("email_address", request.user.email)
    masked_phone = mask_personal_information("phone_number", request.user.metadata.phone)
    date_joined = format_datetime(request.user.date_joined)

    return render(
        request,
        "users/account.html",
        {
            "image_list": image_list,
            "masked_student_id": masked_student_id,
            "masked_name": masked_name,
            "masked_email": masked_email,
            "masked_phone": masked_phone,
            "date_joined": date_joined,
        },
    )
