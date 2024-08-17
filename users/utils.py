from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.core.paginator import Paginator
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.auth.models import User
from users.models import Metadata, Vcode
from utility.mail import send_mail
from utility.sms import send_sms
from utility.msg import send_msg
from utility.utils import (
    reg_test,
    mask_personal_information,
    airtable,
    short_io,
    notion,
)
from fake_useragent import UserAgent
from requests.sessions import Session
from requests.adapters import HTTPAdapter
import random, string, json

DMD_URL = getattr(settings, "DMD_URL", "DMD_URL")
DMD_COOKIE = getattr(settings, "DMD_COOKIE", "DMD_COOKIE")
headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}

#
# Cron functions
#


def delete_inactive_user(request):
    inactive_user_queryset = User.objects.filter(
        last_login__lt=timezone.now() - timezone.timedelta(days=30)
    )

    inactive_user_count = inactive_user_queryset.count()
    data = {"inactive_user_count": inactive_user_count}
    json_data = json.dumps(data, indent=4)

    if inactive_user_count > 0:
        for i in range(inactive_user_count):
            student_id = inactive_user_queryset[i].username
            email = inactive_user_queryset[i].email

            mail_data = {
                "type": "INACTIVE_USER_AUTO_DELETED",
                "email": email,
                "content": {
                    "student_id": mask_personal_information("student_id", student_id),
                    "datetime": timezone.now().strftime("%Y-%m-%d %H:%M"),
                },
            }

            send_mail(mail_data)

        data["status"] = "DONE"
        send_msg(request, "INACTIVE_USER_AUTO_DELETED", "MGT", data)
        inactive_user_queryset.delete()

    return HttpResponse(json_data, content_type="application/json")


def delete_expired_vcode(request):
    expired_vcode_queryset = Vcode.objects.filter(will_expire_on__lt=timezone.now())
    expired_vcode_count = expired_vcode_queryset.count()
    expired_vcode_list = list(
        expired_vcode_queryset.values(
            "id", "email_vcode", "phone_vcode", "confirmed", "will_expire_on"
        )
    )
    data = {"expired_vcode_list": expired_vcode_list}
    json_data = json.dumps(data, indent=4, cls=DjangoJSONEncoder)

    if expired_vcode_count > 0:
        data["status"] = "DONE"
        send_msg(request, "EXPIRED_VCODE_AUTO_DELETED", "MGT", data)
        expired_vcode_queryset.delete()

    return HttpResponse(json_data, content_type="application/json")


#
# Sub functions
#


def generate_vcode():
    return "".join(random.choice(string.digits) for _ in range(6))


def create_vcode(student_id, email_vcode, phone_vcode):
    will_expire_on = timezone.now() + timezone.timedelta(minutes=5)
    Vcode.objects.filter(student_id=student_id).delete()

    Vcode.objects.create(
        student_id=student_id,
        email_vcode=email_vcode,
        phone_vcode=phone_vcode,
        will_expire_on=will_expire_on,
    )


def send_vcode(email, phone, email_vcode, phone_vcode, target):
    status = "DONE"
    is_email_vcode_sent = is_phone_vcode_sent = False

    if email_vcode:
        mail_data = {
            "type": "IDENTITY_VERIFICATION_REQUIRED",
            "email": email,
            "content": {
                "target": target,
                "email_vcode": email_vcode,
            },
        }
        if send_mail(mail_data) == 1:
            is_email_vcode_sent = True
        else:
            status = "FAIL"

    if phone_vcode and status == "DONE":
        sms_data = {
            "type": "IDENTITY_VERIFICATION_REQUIRED",
            "phone": phone,
            "content": {"phone_vcode": phone_vcode},
        }
        try:
            if json.loads(send_sms(sms_data))["statusCode"] == "202":
                is_phone_vcode_sent = True
            else:
                status = "FAIL"
        except:
            status = "FAIL"

    if status == "DONE":
        if is_email_vcode_sent and is_phone_vcode_sent:
            msg = "이메일 주소 및 휴대전화 번호 인증번호가 전송되었어요!"
        elif is_email_vcode_sent:
            msg = "이메일 주소 인증번호가 전송되었어요!"
        elif is_phone_vcode_sent:
            msg = "휴대전화 번호 인증번호가 전송되었어요!"
        else:
            status = "FAIL"
            msg = "앗, 다시 한 번 시도해주세요!"
    else:
        msg = "앗, 다시 한 번 시도해주세요!"

    return status, msg, is_email_vcode_sent, is_phone_vcode_sent


def is_registered_student(student_id: str, name: str):
    """
    This function relies on the 'Find Student ID' feature of Dongguk University's mDRIMS.

    - student_id | `str`
    - name | `str`
    """

    headers["Cookie"] = DMD_COOKIE
    params = {"strCampFg": "S", "strEntrYy": student_id[:4], "strKorNm": name}

    with Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=3))
        response = session.get(DMD_URL["directory"], params=params, headers=headers)
        student_info = response.json()["out"]
        matched_element = [
            element for element in student_info if element["stdNo"] == student_id
        ]
        result = (
            True
            if len(matched_element) == 1 and "영화" in matched_element[0]["deptNm"]
            else False
        )

    return result


def is_non_member(student_id: str):
    result = True if User.objects.filter(username=student_id).count() == 0 else False
    return result


def is_valid(request):
    """
    - request | `HttpRequest`:
        - agree
        - student_id
        - name
        - email
    """
    agree = request.POST["agree"]
    student_id = request.POST["student_id"]
    name = request.POST["name"]
    email = request.POST["email"]
    phone = "".join(filter(str.isalnum, request.POST["phone"]))

    try:
        result = (
            True
            if (
                agree == "true"
                and int(student_id[0:4]) <= timezone.now().year
                and reg_test(student_id, "NUM")
                and reg_test(name, "HGL")
                and reg_test(email, "EML")
                and reg_test(phone, "NUM")
            )
            else False
        )
    except:
        result = False

    return result


def validation(data: dict):
    """
    - data | `dict`:
        - student_id
        - name
        - request
    """

    student_id = data["student_id"]
    name = data["name"]
    request = data["request"]

    if not is_registered_student(student_id, name):
        status = "FAIL"
        msg = "학번이나 성명이 잘못 입력된 것 같아요."

    elif not is_non_member(student_id):
        status = "FAIL"
        msg = f"앗, 이미 {student_id} 학번으로 가입된 계정이 있어요!"

    elif not is_valid(request):
        status = "FAIL"
        msg = "뭔가 잘못 입력된 것 같아요."

    else:
        status = None
        msg = None

    return status, msg


def verify_authentication(request):
    if request.GET["id"] == "verify_authentication":
        id = request.GET["id"]

        if request.user.is_authenticated:
            status = "DONE"
            pk = request.user.pk
            name = request.user.metadata.name
            student_id = request.user.username
        else:
            status = "FAIL"
            pk = None
            name = None
            student_id = None

    response = {
        "id": id,
        "result": {
            "status": status,
            "pk": pk,
            "name": name,
            "student_id": student_id,
        },
    }

    return JsonResponse(response)


def pinpoint_user(request):
    if request.POST["id"] == "pinpoint_user":
        id = request.POST["id"]
        pk = request.POST["pk"]
        name = request.POST["name"]
        student_id = request.POST["student_id"]

        user = User.objects.get(pk=pk)
        actual_pk = user.pk
        actual_name = user.metadata.name
        actual_student_id = user.username

        if (
            (int(pk) == actual_pk)
            and (name == actual_name)
            and (student_id == actual_student_id)
        ):
            status = "DONE"
        else:
            status = "FAIL"

    response = {
        "id": id,
        "result": {
            "status": status,
        },
    }

    return JsonResponse(response)


#
# Main functions
#


def vcode(request):
    id = request.POST["id"]
    student_id = request.POST["student_id"]
    name = request.POST.get("name", None)
    email = request.POST["email"]
    phone = "".join(filter(str.isalnum, request.POST["phone"]))

    status = msg = None
    is_email_vcode_sent = is_phone_vcode_sent = False

    # id: create_vcode_for_SNP
    if id == "create_vcode_for_SNP":
        data = {"student_id": student_id, "name": name, "request": request}
        status, msg = validation(data)

        if status is None:
            email_vcode = generate_vcode()
            phone_vcode = generate_vcode()
            create_vcode(student_id, email_vcode, phone_vcode)

            status, msg, is_email_vcode_sent, is_phone_vcode_sent = send_vcode(
                email, phone, email_vcode, phone_vcode, "회원가입 페이지"
            )

    # id: confirm_vcode_for_SNP
    elif id == "confirm_vcode_for_SNP":
        email_vcode = request.POST["email_vcode"]
        phone_vcode = request.POST["phone_vcode"]
        data = {"student_id": student_id, "name": name, "request": request}
        status, msg = validation(data)

        if status is None and msg is None:
            try:
                vcode = Vcode.objects.get(
                    student_id=student_id,
                    email_vcode=email_vcode,
                    phone_vcode=phone_vcode,
                )

                if vcode.will_expire_on > timezone.now():
                    vcode.confirmed = True
                    vcode.save()
                    status, msg = "DONE", "회원가입이 완료되었어요. 환영해요! 👋"
                else:
                    status, msg = (
                        "FAIL",
                        "앗, 인증번호가 만료되었어요! 😢\n새로고침 후 다시 시도해주세요.",
                    )
            except:
                status, msg = "FAIL", "인증번호가 잘못 입력된 것 같아요."

    # id: create_vcode_for_account
    elif id == "create_vcode_for_account":
        original_email = request.user.email
        original_phone = request.user.metadata.phone
        email_vcode = generate_vcode() if email != original_email else ""
        phone_vcode = (
            generate_vcode()
            if phone != "".join(filter(str.isalnum, original_phone))
            else ""
        )

        create_vcode(student_id, email_vcode, phone_vcode)

        status, msg, is_email_vcode_sent, is_phone_vcode_sent = send_vcode(
            email, phone, email_vcode, phone_vcode, "내 계정 페이지"
        )

    # id: confirm_vcode_for_account
    elif id == "confirm_vcode_for_account":
        email_vcode = request.POST.get("email_vcode", "")
        phone_vcode = request.POST.get("phone_vcode", "")

        try:
            vcode = Vcode.objects.get(
                student_id=student_id,
                email_vcode=email_vcode,
                phone_vcode=phone_vcode,
            )

            if vcode.will_expire_on > timezone.now():
                vcode.confirmed = True
                vcode.save()
                user = User.objects.get(username=student_id)
                user.email = email
                user.save()
                user_metadata = Metadata.objects.get(user=user)
                user_metadata.phone = f"{phone[:3]}-{phone[3:7]}-{phone[7:]}"
                user_metadata.save()
                status, msg = "DONE", "회원정보 수정이 완료되었어요! 👍"
            else:
                status, msg = (
                    "FAIL",
                    "앗, 인증번호가 만료되었어요! 😢\n새로고침 후 다시 시도해주세요.",
                )
        except:
            status, msg = "FAIL", "인증번호가 잘못 입력된 것 같아요."

    response = {
        "id": id,
        "status": status,
        "msg": msg,
        "is_email_vcode_sent": is_email_vcode_sent,
        "is_phone_vcode_sent": is_phone_vcode_sent,
    }

    return JsonResponse(response)


def account(request):
    id = request.GET.get("id")

    # id: get_paginated_data
    if id == "get_paginated_data":
        target = request.GET.get("target")
        page_number = request.GET.get("page", 1)
        items_per_page = 4

        if target == "facility":
            formula = f"AND(User = '{request.user.username}', FIND('🟢', Validation))"

            data = {
                "table_name": "facility-request",
                "params": {
                    "view": "Grid view",
                    "formula": formula,
                },
            }

            item_list = airtable("get_all", "records", data)
        elif target == "project":
            formula = f"FIND('{request.user.username}', Staff)"

            data = {
                "table_name": "project-team",
                "params": {
                    "view": "Grid view",
                    "formula": formula,
                },
            }

            item_list = airtable("get_all", "records", data)
        elif target == "dflink":
            filter = {"user": request.user.username}
            item_list = short_io("retrieve", filter=filter, mask=True)
        elif target == "notice":
            filter = {
                "property": "User",
                "rich_text": {"equals": str(request.user.pk)},
            }

            item_list = notion(
                "query", "db", data={"db_name": "notice", "filter": filter}, mask=True
            )

        paginator = Paginator(item_list, items_per_page)
        page = paginator.get_page(page_number)

        response = {
            "id": id,
            "target": target,
            "item_list": list(page),
            "has_next": page.has_next(),
            "has_previous": page.has_previous(),
            "page_number": page.number,
            "total_items": paginator.count,
            "total_pages": paginator.num_pages,
        }

    # id: delete_user
    elif id == "delete_user":
        data = {
            "table_name": "facility-request",
            "params": {
                "view": "Grid view",
                "formula": f"AND(OR(Status = 'Pending', Status = 'Approved', Status = 'In Progress'), OR(User = '{request.user.username}', FIND('{request.user.username}', {{Project team staff}}) = 0))",
            },
        }

        facility_request_list = airtable("get_all", "records", data)

        if len(facility_request_list) == 0:
            user = request.user

            mail_data = {
                "type": "USER_DELETED",
                "email": user.email,
                "content": {
                    "student_id": mask_personal_information(
                        "student_id", user.username
                    ),
                    "datetime": timezone.now().strftime("%Y-%m-%d %H:%M"),
                },
            }

            send_mail(mail_data)
            user.delete()
            data = {"status": "DONE"}
            send_msg(request, "USER_DELETED", "MGT", data)
            status = "DONE"
            msg = "지금까지 디닷에프를 이용해주셔서 감사합니다. 🙇"
        else:
            status = "FAIL"
            msg = "시설 사용이 진행 중이거나 예정되어 있어 탈퇴할 수 없어요."

        response = {"id": id, "status": status, "msg": msg}

    return JsonResponse(response)
