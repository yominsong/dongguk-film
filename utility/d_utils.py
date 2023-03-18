from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib.auth.models import User
from users.models import Vcode
from .d_discord import send_msg
from .mail import send_mail
from .sms import send_sms
import json, re, random, string, requests


DMD_URL = getattr(settings, "DMD_URL", "DMD_URL")
DMD_COOKIE = getattr(settings, "DMD_COOKIE", "DMD_COOKIE")
NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36"
}
notion_headers = {
    "Authorization": f"Bearer {NOTION_SECRET}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
}


def check_for_duplicate_signup(dict_raw_data):
    data = dict_raw_data
    result = False
    student_id = data["student_id"]
    user_registered_with_this_student_id = User.objects.filter(username=student_id)
    if user_registered_with_this_student_id.count() > 0:
        result = True
    boolean_result = result
    return boolean_result


def check_if_student_id_exists(dict_raw_data):
    data = dict_raw_data
    student_id = data["student_id"]
    name = data["name"]
    result = False
    headers["Cookie"] = DMD_COOKIE
    params = {"strCampFg": "S", "strEntrYy": student_id[:4], "strKorNm": name}
    response = requests.get(DMD_URL, params=params, headers=headers).json()["out"]
    matched_element = [
        element for element in response if element["stdNo"] == student_id
    ]
    if len(matched_element) == 1 and "영화" in matched_element[0]["deptNm"]:
        result = True
    boolean_result = result
    return boolean_result


def validation(
    dict_raw_data,
    str_validation_type,
):
    data = dict_raw_data
    type = str_validation_type
    result = False
    if type == "sign up":
        agree = parse_json(data, "agree")
        student_id = parse_json(data, "student_id")
        name = parse_json(data, "name")
        email = parse_json(data, "email")
        phone = "".join(filter(str.isalnum, parse_json(data, "phone")))
        try:
            if (
                agree == "true"
                and int(student_id[0:4]) <= timezone.now().year
                and reg_test(student_id, "number")
                and reg_test(name, "hangul")
                and reg_test(email, "email")
                and reg_test(phone, "number")
            ):
                result = True
        except:
            pass
    boolean_result = result
    return boolean_result


def create_vcode(request):
    if request.method == "POST":
        raw_data = json.loads(request.body)
        if check_for_duplicate_signup(raw_data) == False:
            if check_if_student_id_exists(raw_data):
                if validation(raw_data, "sign up"):
                    student_id = parse_json(raw_data, "student_id")
                    email = parse_json(raw_data, "email")
                    phone = parse_json(raw_data, "phone")
                    email_vcode = ""
                    phone_vcode = ""
                    will_expire_on = timezone.now() + timezone.timedelta(minutes=20)
                    for i in range(6):
                        email_vcode += random.choice(string.digits)
                        phone_vcode += random.choice(string.digits)
                    try:
                        vcode = Vcode.objects.get(student_id=student_id)
                        vcode.delete()
                    except:
                        pass
                    Vcode.objects.create(
                        student_id=student_id,
                        email_vcode=email_vcode,
                        phone_vcode=phone_vcode,
                        will_expire_on=will_expire_on,
                    )
                    data_to_send = {
                        "type": "sign up",
                        "email": email,
                        "phone": phone,
                        "content": {
                            "email_vcode": email_vcode,
                            "phone_vcode": phone_vcode,
                        },
                    }
                    mail_response = send_mail(data_to_send)
                    sms_response = json.loads(send_sms(data_to_send))
                    status = (
                        "vcode created and sent via mail, sms"
                        if mail_response == 1 and sms_response["statusCode"] == "202"
                        else "vcode created and sent via mail"
                        if mail_response == 1
                        else "vcode created and sent via sms"
                        if sms_response["statusCode"] == "202"
                        else "vcode created but not sent"
                    )
                    context = {"status": status}
                else:
                    context = {"status": "server-side validation failed"}
                    send_msg(request, "server-side validation failed")
            else:
                context = {"status": "the student id does not exist"}
        else:
            context = {"status": "duplicate sign up attempted"}
    else:
        context = {"status": "unexpected request"}
        send_msg(request, "unexpected request")
    return JsonResponse(context)


def confirm_vcode(request):
    if request.method == "POST":
        raw_data = json.loads(request.body)
        if check_for_duplicate_signup(raw_data) == False:
            if check_if_student_id_exists(raw_data):
                if validation(raw_data, "sign up"):
                    student_id = parse_json(raw_data, "student_id")
                    email_vcode = parse_json(raw_data, "email_vcode")
                    phone_vcode = parse_json(raw_data, "phone_vcode")
                    try:
                        vcode = Vcode.objects.get(
                            student_id=student_id,
                            email_vcode=email_vcode,
                            phone_vcode=phone_vcode,
                        )
                        context = {"status": "vcode confirmed"}
                        vcode.confirmed = True
                        vcode.save()
                    except:
                        context = {"status": "invalid vcode"}
                else:
                    context = {"status": "server-side validation failed"}
                    send_msg(request, "server-side validation failed")
            else:
                context = {"status": "the student id does not exist"}
        else:
            context = {"status": "duplicate sign up attempted"}
    else:
        context = {"status": "unexpected request"}
        send_msg(request, "unexpected request")
    return JsonResponse(context)


def parse_json(dict_raw_data, str_key):
    str_value = json.dumps(dict_raw_data[str_key], ensure_ascii=False).strip('"')
    return str_value


def reg_test(str_raw_data, str_test_type):
    data = str_raw_data
    type = str_test_type
    reg_hangul = re.compile("[가-힣]+")
    reg_number = re.compile("[0-9]")
    reg_email = re.compile(
        "^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9}$"
    )
    result = False
    try:
        if type == "hangul":
            tested_data = "".join(re.findall(reg_hangul, data))
        elif type == "number":
            tested_data = "".join(re.findall(reg_number, data))
        elif type == "email":
            tested_data = reg_email.match(data).group()
    except:
        tested_data = None
    if data == tested_data:
        result = True
    boolean_result = result
    return boolean_result


def split_list(lst_raw_data, int_number):
    data = lst_raw_data
    num = int_number
    result = [data[i:i+num] for i in range(0, len(data), num)]
    lst_result = result
    return lst_result


def get_raw_notion_data(str_db_name):
    db_name = str_db_name
    filter_and_sorts = {
        "filter": {"property": "Visible", "checkbox": {"equals": True}},
        "sorts": [{"property": "Priority", "direction": "ascending"}],
    }
    db_id = NOTION_DB_ID[db_name]
    db_data = json.loads(
        requests.post(
            f"https://api.notion.com/v1/databases/{db_id}/query",
            headers=notion_headers,
            data=json.dumps(filter_and_sorts),
        ).text
    )["results"]
    db_raw_data_list = []
    for db_datum in db_data:
        properties = db_datum["properties"]
        del properties["Status"]
        del properties["Priority"]
        del properties["Visible"]
        sorted_properties = sorted(properties.items())
        db_raw_data_list.append(sorted_properties)
    return db_raw_data_list


def get_cleaned_notion_data(str_db_name):
    db_name = str_db_name
    db_raw_data_list = get_raw_notion_data(db_name)
    db_cleansed_data_list = []
    db_datum_len = len(db_raw_data_list[0])
    for i, db_datum in enumerate(db_raw_data_list):
        for j, property in enumerate(db_datum):
            property_dict = property[1]
            property_type = property_dict["type"]
            if property_type == "title":
                value = property_dict[property_type][0]["plain_text"]
            elif property_type == "number":
                value = property_dict[property_type]
            elif property_type == "select":
                value = property_dict[property_type]["name"]
            elif property_type == "formula":
                value = property_dict[property_type]["string"]
            db_cleansed_data_list.append(value)
    db_splited_list = split_list(db_cleansed_data_list, db_datum_len)
    return db_splited_list


def update_dmd_cookie(request):
    if "23:59" < timezone.now().strftime("%H:%M") < "00:01":
        response = requests.get("https://dgufilm.link/get-dmd-cookie")
        cookie = response.text.rstrip()
        if "WMONID" in cookie:
            with open("secrets.json", "r+") as f:
                data = json.load(f)
                data["DMD_COOKIE"] = cookie
                f.seek(0)
                f.write(json.dumps(data, indent=4))
                f.truncate()
    return HttpResponse(status=200)


def delete_expired_vcodes(request):
    expired_vcodes = Vcode.objects.filter(will_expire_on__lt=timezone.now())
    if expired_vcodes.count() > 0:
        expired_vcodes.delete()
    return HttpResponse(status=200)


def delete_inactive_users(request):
    inactive_users = User.objects.filter(
        last_login__lte=timezone.now() - timezone.timedelta(days=30)
    )
    if inactive_users.count() > 0:
        inactive_users.delete()
    return HttpResponse(status=200)
