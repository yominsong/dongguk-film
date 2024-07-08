from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from itertools import islice
from utility.img import get_hero_img
from utility.utils import short_io, notion


@login_required
def account(request):
    image_list = get_hero_img("account")
    dflink_list = short_io("retrieve")

    user_created_dflink_list = list(
        islice(
            (
                dflink
                for dflink in dflink_list
                if dflink["user"] == request.user.username
            ),
            5,
        )
    )

    filter = {
        "property": "User",
        "formula": {"number": {"equals": int(request.user.username)}},
    }

    user_created_notice_list = notion(
        "query", "db", data={"db_name": "notice", "filter": filter}, limit=5
    )

    return render(
        request,
        "users/account.html",
        {
            "image_list": image_list,
            "user_created_dflink_list": user_created_dflink_list,
            "user_created_notice_list": user_created_notice_list,
        },
    )
