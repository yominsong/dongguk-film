from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib.auth.models import User
from users.models import Vcode
from utility.msg import send_msg
from utility.mail import send_mail
from utility.sms import send_sms
from fake_useragent import UserAgent
from requests.sessions import Session
from requests.adapters import HTTPAdapter
import requests, re, random, string, json, time

DMD_URL = getattr(settings, "DMD_URL", "DMD_URL")

DMD_COOKIE = getattr(settings, "DMD_COOKIE", "DMD_COOKIE")

headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}

#
# Cron functions
#


def delete_inactive_users(request):
    inactive_users = User.objects.filter(
        last_login__lt=timezone.now() - timezone.timedelta(days=30)
    )
    count = inactive_users.count()
    if count > 0:
        for i in range(count):
            student_id = inactive_users[i].username
            email = inactive_users[i].email
            data = {
                "type": "ADL",
                "email": email,
                "content": {
                    "student_id": student_id,
                    "datetime": timezone.now().strftime("%Y-%m-%d %H:%M"),
                },
            }
            send_mail(data)
        inactive_users.delete()
    return HttpResponse(f"Number of deleted users: {count}")


def delete_expired_vcodes(request):
    expired_vcodes = Vcode.objects.filter(will_expire_on__lt=timezone.now())
    count = expired_vcodes.count()
    if count > 0:
        expired_vcodes.delete()
    return HttpResponse(f"Number of deleted verification codes: {count}")


#
# Sub functions
#


def is_valid_student(student_id, name):
    """
    This function relies on the 'Find Student ID' feature of Dongguk University's mDRIMS.
    """

    headers["Cookie"] = DMD_COOKIE
    params = {"strCampFg": "S", "strEntrYy": student_id[:4], "strKorNm": name}

    with Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=3))
        response = session.get(DMD_URL, params=params, headers=headers)
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


def is_non_member(student_id):
    result = True if User.objects.filter(username=student_id).count() == 0 else False
    return result


def validation(request):
    agree = request.POST["agree"]
    student_id = request.POST["student_id"]
    name = request.POST["name"]
    email = request.POST["email"]
    phone = "".join(filter(str.isalnum, request.POST["phone"]))

    if (
        agree == "true"
        and int(student_id[0:4]) <= timezone.now().year
        and reg_test(student_id, "NUM")
        and reg_test(name, "HGL")
        and reg_test(email, "EML")
        and reg_test(phone, "NUM")
    ):
        result = True
    else:
        result = False

    return result


def reg_test(value, type):
    """
    value: String to test regular expression for
    type: "HGL", "NUM", "EML"

    HGL: Hangul
    NUM: Number
    EML: Email
    """

    reg_hangul = re.compile("[가-힣]+")
    reg_number = re.compile("[0-9]")
    reg_email = re.compile(
        "^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9}$"
    )

    if type == "HGL":
        tested_value = "".join(re.findall(reg_hangul, value))
    elif type == "NUM":
        tested_value = "".join(re.findall(reg_number, value))
    elif type == "EML":
        tested_value = reg_email.match(value).group()
    else:
        tested_value = None

    result = True if value == tested_value else False

    return result


#
# Main functions
#


def vcode(request):
    # id: create_vcode_for_SNP
    if request.POST["id"] == "create_vcode_for_SNP":
        id = request.POST["id"]
        student_id = request.POST["student_id"]
        name = request.POST["name"]
        email = request.POST["email"]
        phone = "".join(filter(str.isalnum, request.POST["phone"]))

        if not is_valid_student(student_id, name):
            status = "FAIL"
            msg = "학번이나 성명이 잘못 입력된 것 같아요."

        elif not is_non_member(student_id):
            status = "FAIL"
            msg = f"앗, 이미 {student_id} 학번으로 가입된 계정이 있어요!"

        elif not validation(request):
            status = "FAIL"
            msg = "앗, 뭔가 잘못 입력된 것 같아요."

        elif (
            is_valid_student(student_id, name)
            and is_non_member(student_id)
            and validation(request)
        ):
            email_vcode = ""
            phone_vcode = ""
            will_expire_on = timezone.now() + timezone.timedelta(minutes=5)
            for i in range(6):
                email_vcode += random.choice(string.digits)
                phone_vcode += random.choice(string.digits)
            Vcode.objects.filter(student_id=student_id).delete()
            Vcode.objects.create(
                student_id=student_id,
                email_vcode=email_vcode,
                phone_vcode=phone_vcode,
                will_expire_on=will_expire_on,
            )
            data = {
                "type": "SNP",
                "email": email,
                "phone": phone,
                "content": {
                    "email_vcode": email_vcode,
                    "phone_vcode": phone_vcode,
                },
            }
            mail_response = send_mail(data)
            sms_response = json.loads(send_sms(data))
            if mail_response == 1 and sms_response["statusCode"] == "202":
                status = "DONE"
                msg = "인증번호가 전송되었어요!"
            else:
                status = "FAIL"
                msg = "앗, 다시 한 번 시도해주세요!"

    # id: confirm_vcode_for_SNP
    elif request.POST["id"] == "confirm_vcode_for_SNP":
        id = request.POST["id"]
        student_id = request.POST["student_id"]
        name = request.POST["name"]
        email = request.POST["email"]
        phone = "".join(filter(str.isalnum, request.POST["phone"]))
        email_vcode = request.POST["email_vcode"]
        phone_vcode = request.POST["phone_vcode"]

        if not is_valid_student(student_id, name):
            status = "FAIL"
            msg = "학번이나 성명이 잘못 입력된 것 같아요."

        elif not is_non_member(student_id):
            status = "FAIL"
            msg = f"앗, 이미 {student_id} 학번으로 가입된 계정이 있어요!"

        elif not validation(request):
            status = "FAIL"
            msg = "앗, 뭔가 잘못 입력된 것 같아요."

        elif (
            is_valid_student(student_id, name)
            and is_non_member(student_id)
            and validation(request)
        ):
            try:
                vcode = Vcode.objects.get(
                    student_id=student_id,
                    email_vcode=email_vcode,
                    phone_vcode=phone_vcode,
                )
                if vcode.will_expire_on > timezone.datetime.now():
                    vcode.confirmed = True
                    vcode.save()
                    status = "DONE"
                    msg = "회원가입이 완료되었어요. 환영해요! 👋"
                else:
                    status = "FAIL"
                    msg = "앗, 인증번호가 만료되었어요. 😢\n새로고침 후 다시 시도해주세요."
            except:
                status = "FAIL"
                msg = "인증번호가 잘못 입력된 것 같아요."

    response = {"id": id, "result": {"status": status, "msg": msg}}

    return JsonResponse(response)
