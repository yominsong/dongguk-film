from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth.models import User
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
from django.urls import reverse
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from concurrent.futures import ThreadPoolExecutor, as_completed
from fake_useragent import UserAgent
from .img import save_hero_img
from .msg import send_msg
from .sms import send_sms
from .mail import send_mail
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dateutil import parser
import json, re, requests, pytz, datetime, pyairtable, openai, boto3, random, string, uuid, time, ast

#
# Global variablesㅣ
#

SECRET_KEY = getattr(settings, "SECRET_KEY", None)

NCP_CLOVA_OCR_SECRET_KEY = getattr(settings, "NCP_CLOVA_OCR_SECRET_KEY", None)
NCP_CLOVA_OCR_APIGW_INVOKE_URL = getattr(
    settings, "NCP_CLOVA_OCR_APIGW_INVOKE_URL", None
)

AIRTABLE_TOKEN = getattr(settings, "AIRTABLE_TOKEN", None)
AIRTABLE_BASE_ID = getattr(settings, "AIRTABLE_BASE_ID", None)
AIRTABLE_TABLE_ID = getattr(settings, "AIRTABLE_TABLE_ID", None)
AIRTABLE_SCRIPT_API_KEY = getattr(settings, "AIRTABLE_SCRIPT_API_KEY", None)
AIRTABLE = pyairtable.Api(AIRTABLE_TOKEN)

NOTION_SECRET = getattr(settings, "NOTION_SECRET", None)
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", None)

OPENAI_ORG = getattr(settings, "OPENAI_ORG", None)
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", None)

SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", None)
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", None)

GOOGLE_SA_CREDS = service_account.Credentials.from_service_account_info(
    getattr(settings, "GOOGLE_SA_CREDS", "GOOGLE_SA_CREDS"),
    scopes=["https://www.googleapis.com/auth/drive"],
)
GOOGLE_DRIVE = build("drive", "v3", credentials=GOOGLE_SA_CREDS)

AWS_ACCESS_KEY = getattr(settings, "AWS_ACCESS_KEY", None)
AWS_SECRET_ACCESS_KEY = getattr(settings, "AWS_SECRET_ACCESS_KEY", None)
AWS_S3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="ap-northeast-2",
)

#
# Airtable functions
#


@csrf_exempt
@require_http_methods(["GET", "POST"])
def send_facility_request_status_update(request):
    if request.method == "GET":
        return HttpResponseRedirect(reverse("home:home"))

    def get_record(record_id):
        data = {
            "table_name": "facility-request",
            "params": {"record_id": record_id},
        }

        facility_request = airtable("get", "record", data)
        validation = facility_request["validation"]
        record = None

        if "🟢" in validation:
            film_title = facility_request["film_title"]
            subject_name = facility_request["subject_name"]
            is_for_instructor = facility_request["for_instructor"]
            name_of_subject_or_project = (
                subject_name if is_for_instructor else film_title
            )
            status = facility_request["status"]

            if status == "Approved":
                msg_type = "APPROVE_FACILITY_REQUEST"
                sms_and_mail_type = "FACILITY_REQUEST_APPROVED"
            elif status == "Canceled":
                msg_type = "CANCEL_FACILITY_REQUEST"
                sms_and_mail_type = "FACILITY_REQUEST_CANCELED"
            elif status == "Rejected":
                msg_type = "REJECT_FACILITY_REQUEST"
                sms_and_mail_type = "FACILITY_REQUEST_REJECTED"

            record = {
                "film_title": film_title,
                "category_in_korean": facility_request["category_in_korean"],
                "subject_name": subject_name,
                "user": facility_request["user"],
                "public_id": facility_request["public_id"],
                "private_id": facility_request["private_id"],
                "for_instructor": is_for_instructor,
                "status": status,
                "name_of_subject_or_project": name_of_subject_or_project,
                "msg_type": msg_type,
                "sms_and_mail_type": sms_and_mail_type,
            }

        return record

    MAX_REQUESTS_PER_MINUTE = 10
    REQUEST_TIMEOUT = 5 * 60

    if request.headers.get("X-API-Key") != AIRTABLE_SCRIPT_API_KEY:
        return JsonResponse({"error": "Invalid Secret key"}, status=403)

    client_ip = request.META.get("REMOTE_ADDR")
    request_count = cache.get(f"request_count:{client_ip}", 0)

    if request_count >= MAX_REQUESTS_PER_MINUTE:
        return JsonResponse({"error": "Too many requests"}, status=429)

    cache.set(f"request_count:{client_ip}", request_count + 1, 60)

    try:
        data = json.loads(request.body)
        required_fields = ["recordId", "timestamp"]

        if not all(field in data for field in required_fields):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        timestamp = datetime.datetime.fromtimestamp(data["timestamp"] / 1000.0)

        if abs((datetime.datetime.now() - timestamp).total_seconds()) > REQUEST_TIMEOUT:
            return JsonResponse({"error": "Invalid timestamp"}, status=400)

        record_id = data["recordId"]
        record = get_record(record_id)

        response = {
            "status": "DONE",
            "reason": "NOTHING_UNUSUAL",
            "public_id": record["public_id"],
            "private_id": record["private_id"],
        }

        send_msg(request, record["msg_type"], "MGT", response)

        user = User.objects.get(username=record["user"])

        data = {
            "type": record["sms_and_mail_type"],
            "email": user.email,
            "phone": user.metadata.phone,
            "content": {
                "is_for_instructor": record["for_instructor"],
                "name_of_subject_or_project": record["name_of_subject_or_project"],
                "facility_category": record["category_in_korean"],
            },
        }

        send_mail(data)
        send_sms(data)

        return JsonResponse({"message": "Request processed successfully"}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse(
            {
                "error": str(e),
                "recieved_data": json.loads(request.body),
            },
            status=500,
        )


#
# Cron functions
#


def remind_facility_use(request):
    formula = "AND(Status = 'Approved', DATETIME_DIFF({Start datetime}, NOW(), 'minutes') > 0, DATETIME_DIFF({Start datetime}, NOW(), 'minutes') <= 30, FIND('🟢', Validation))"

    data = {
        "table_name": "facility-request",
        "params": {"formula": formula},
    }

    target_facility_request_list = airtable("get_all", "records", data)

    for facility_request in target_facility_request_list:
        user = User.objects.get(username=facility_request["user"])
        subject_name = facility_request["subject_name"]
        project_name = facility_request["film_title"]
        is_for_instructor = facility_request["for_instructor"]
        name_of_subject_or_project = subject_name if is_for_instructor else project_name

        data = {
            "type": "FACILITY_REQUEST_STARTING_SOON",
            "phone": user.metadata.phone,
            "content": {
                "name_of_subject_or_project": name_of_subject_or_project,
                "facility_category": facility_request["category_in_korean"],
            },
        }

        send_sms(data)

    return HttpResponse(f"{len(target_facility_request_list)}")


def warn_facility_request_not_processed(request):
    formula = "AND(Status = 'Pending', DATETIME_DIFF({Created time}, NOW(), 'minutes') > 30, FIND('🟢', Validation))"

    data = {
        "table_name": "facility-request",
        "params": {"formula": formula},
    }

    target_facility_request_list = airtable("get_all", "records", data)

    for facility_request in target_facility_request_list:
        public_id = facility_request["public_id"]
        private_id = facility_request["private_id"]

        data = {"public_id": public_id, "private_id": private_id}
        send_msg(request, "FACILITY_REQUEST_NOT_PROCESSED", "MGT", data)

    return HttpResponse(f"{len(target_facility_request_list)}")


def warn_facility_use_start_delay(request):
    formula = "AND(Status = 'Approved', {Is after start datetime}, NOT({Is after end datetime}), FIND('🟢', Validation))"

    data = {
        "table_name": "facility-request",
        "params": {"formula": formula},
    }

    target_facility_request_list = airtable("get_all", "records", data)

    for facility_request in target_facility_request_list:
        public_id = facility_request["public_id"]
        private_id = facility_request["private_id"]

        data = {"public_id": public_id, "private_id": private_id}
        send_msg(request, "FACILITY_USE_START_DELAYED", "MGT", data)

    return HttpResponse(f"{len(target_facility_request_list)}")


def warn_facility_use_end_delay(request):
    formula = "AND(Status = 'In Progress', {Is after end datetime}, FIND('🟢', Validation))"

    data = {
        "table_name": "facility-request",
        "params": {"formula": formula},
    }

    target_facility_request_list = airtable("get_all", "records", data)

    for facility_request in target_facility_request_list:
        public_id = facility_request["public_id"]
        private_id = facility_request["private_id"]

        data = {"public_id": public_id, "private_id": private_id}
        send_msg(request, "FACILITY_USE_END_DELAYED", "MGT", data)

    return HttpResponse(f"{len(target_facility_request_list)}")


def update_dmd_cookie(request):
    cookie = ""

    with Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=3))
        response = session.get("https://util.dgufilm.link/get-dmd-cookie")
        cookie = response.text.rstrip()

    if "WMONID" in cookie:
        with open("secrets.json", "r+") as f:
            data = json.load(f)
            data["DMD_COOKIE"] = cookie
            f.seek(0)
            f.write(json.dumps(data, indent=4))
            f.truncate()

    status = "DONE" if "WMONID" in cookie else "FAIL"

    data = {
        "status": status,
        "cookie": cookie,
    }

    send_msg(request, "UPDATE_DMD_COOKIE", "DEV", data)
    json_data = json.dumps(data, indent=4)

    return HttpResponse(json_data, content_type="application/json")


def update_hero_img(request):
    img_list = {}

    try:
        home_img = save_hero_img("video-camera", "home")
        equipment_img = save_hero_img("cinema-lens", "equipment")
        project_img = save_hero_img("film-production", "project")
        dflink_img = save_hero_img("keyboard", "dflink")
        notice_img = save_hero_img("office", "notice")
        account_img = save_hero_img("bookmark", "account")

        img_list = {
            "home": home_img,
            "equipment": equipment_img,
            "project": project_img,
            "dflink": dflink_img,
            "notice": notice_img,
            "account": account_img,
        }

        status = "DONE"
    except:
        status = "FAIL"

    data = {
        "status": status,
        "img_list": img_list,
    }

    send_msg(request, "UPDATE_HERO_IMAGE", "DEV", data)
    json_data = json.dumps(data, indent=4)

    return HttpResponse(json_data, content_type="application/json")


#
# Sub functions
#


def convert_datetime(datetime_str: str) -> datetime.datetime:
    """
    - datetime_str | `str`: DateTime string
    """

    try:
        dt = parser.isoparse(datetime_str)

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=pytz.UTC)

        kor_tz = pytz.timezone("Asia/Seoul")

        return dt.astimezone(kor_tz)
    except:
        dt = datetime.datetime.strptime(datetime_str, "%Y-%m-%d")
        kor_tz = pytz.timezone("Asia/Seoul")

        return kor_tz.localize(dt)


def format_datetime(
    dt: datetime.datetime, format_str: str = "%Y-%m-%d(%a) %H:%M"
) -> str:
    """
    - dt | `datetime.datetime`: Datetime object to format
    - format_str | `str`: Format string (default: "%Y-%m-%d(%a) %H:%M")
    """
    weekdays = {
        "Mon": "월",
        "Tue": "화",
        "Wed": "수",
        "Thu": "목",
        "Fri": "금",
        "Sat": "토",
        "Sun": "일",
    }

    formatted = dt.strftime(format_str)

    for eng, kor in weekdays.items():
        formatted = formatted.replace(eng, kor)

    return formatted


def generate_random_string(int: int):
    """
    - int | `int`: Any string length you want
    """

    random_string = "".join(random.choices(string.ascii_letters, k=int))

    return random_string


def mask_personal_information(type: str, string: str):
    if type == "instructor_id":
        masked_string = f"{'*' * 4}{string[-4:]}"
    elif type == "student_id":
        masked_string = f"{string[:2]}{'*' * 5}{string[-3:]}"
    elif type == "name":
        if len(string) == 2:
            masked_string = f"{string[0]}*"
        else:
            masked_string = f"{string[0]}{'*' * (len(string) - 2)}{string[-1]}"
    elif type == "email_address":
        local, domain = string.split("@")

        if len(local) <= 2:
            masked_local = "*" * len(local)
        else:
            masked_local = f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}"
        masked_string = f"{masked_local}@{domain}"
    elif type == "phone_number":
        split_string = string.split("-")
        masked_string = (
            f"{split_string[0]}-{split_string[1][:2]}**-**{split_string[2][2:]}"
        )

    return masked_string


def append_item(item, item_list: list):
    if item not in item_list:
        item_list.append(item)

    return item_list


def get_equipment_data(target: str):
    JSON_PATH = (
        "dongguk_film/static/json/equipment.json"
        if settings.DEBUG
        else "dongguk_film/staticfiles/json/equipment.json"
    )

    with open(JSON_PATH, "r") as f:
        item_list = json.load(f)[target]
        f.close()

    return item_list


def get_subject(base_date: str):
    DMD_URL = getattr(settings, "DMD_URL", None)
    DMD_COOKIE = getattr(settings, "DMD_COOKIE", None)
    headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}

    try:
        base_date = timezone.datetime.strptime(base_date, "%Y-%m-%d").date()
    except:
        base_date = timezone.datetime.fromisoformat(str(base_date)).date()

    base_year = base_date.year
    base_month = base_date.month
    headers["Cookie"] = DMD_COOKIE

    params = {
        "strCampFg": "S",
        "strUnivGrscFg": "U0001001",
        "strLtYy": str(base_year),
        "strLtShtmCd": "U0002001" if base_month < 7 else "U0002003",
        "strFindType": "CODE",
        "strSbjt": "FIL",
    }

    result_list = []
    subject_dict = {}

    with Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=3))
        response = session.get(DMD_URL["timetable"], params=params, headers=headers)
        subject_list = response.json()["out"]["DS_COUR110"]

    for subject in subject_list:
        key = (
            subject["sbjtKorNm"],
            subject["sbjtEngNm"],
            subject["haksuNo"],
            subject["openShyrNm"],
        )

        if subject["ltSprfNo"] is not None and subject["ltSprfNm"] is not None:
            instructor = {"id": subject["ltSprfNo"], "name": subject["ltSprfNm"]}

            if key not in subject_dict:
                subject_dict[key] = {(instructor["id"], instructor["name"])}
            else:
                subject_dict[key].add((instructor["id"], instructor["name"]))
        else:
            if key not in subject_dict:
                subject_dict[key] = set()

    for (
        kor_name,
        eng_name,
        code,
        target_university_year,
    ), instructors in subject_dict.items():
        kor_name = kor_name.strip()
        eng_name = eng_name.strip()
        code = code.strip()

        target_university_year = [
            int(num)
            for num in re.sub(r"[^\d,]", "", target_university_year.strip()).split(",")
        ]

        result = {
            "kor_name": kor_name,
            "eng_name": eng_name,
            "code": code,
            "target_university_year": target_university_year,
            "instructor": [{"id": id, "name": name} for id, name in instructors],
        }

        result_list.append(result)

    return result_list


def find_instructor(purpose: str, base_date: str):
    purpose_list = get_equipment_data("purpose")
    purpose_curricular = False

    for purpose_item in purpose_list:
        if purpose_item["priority"] == purpose:
            purpose_keyword = purpose_item["keyword"].replace(" ", "")
            purpose_secondary_keyword = purpose_item.get("secondary_keyword", None)
            purpose_secondary_keyword = (
                purpose_secondary_keyword.replace(" ", "")
                if purpose_secondary_keyword
                else None
            )
            purpose_curricular = purpose_item["curricular"]
            purpose_for_senior_project = purpose_item["for_senior_project"]
            break

    found_instructor_list = []

    if purpose_curricular:
        subject_list = get_subject(base_date)

        for subject in subject_list:
            if (
                purpose_keyword in subject["kor_name"]
                or (
                    purpose_secondary_keyword in subject["kor_name"]
                    if purpose_secondary_keyword
                    else False
                )
            ) and (
                subject["target_university_year"] == [4]  # 졸업
                if purpose_for_senior_project
                else subject["target_university_year"] != [4]  # exclude 졸업
            ):
                for instructor in subject["instructor"]:
                    found_instructor = {
                        "id": instructor["id"],
                        "name": instructor["name"],
                        "subject": subject["kor_name"],
                        "code": subject["code"],
                    }

                    if found_instructor not in found_instructor_list:
                        found_instructor_list.append(found_instructor)

    found_instructor_list.sort(key=lambda x: (x["code"], x["name"]))

    return found_instructor_list, purpose_curricular


#
# Main functions
#


def set_headers(type: str):
    if type == "RANDOM":
        headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}
    elif type == "OPEN_AI":
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        }
    elif type == "SHORT_IO":
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "Authorization": SHORT_IO_API_KEY,
        }
    elif type == "NOTION":
        headers = {
            "Authorization": f"Bearer {NOTION_SECRET}",
            "Accept": "application/json",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        }

    return headers


def reg_test(value: str, type: str):
    """
    - value | `str`: String to test regular expression for
    - type | `str`:
        - HGL: Hangul
        - LRN: Lower case Roman and Number
        - NUM: Number
        - DAT: Date
        - EML: Email
        - URL: URL
    """

    reg_hangul = re.compile("[가-힣]+")
    reg_lower_case_roman_and_number = re.compile("[a-z0-9]")
    reg_number = re.compile("[0-9]")
    reg_number_with_dash = re.compile("[0-9\-]")
    reg_email = re.compile(
        "^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9}$"
    )
    reg_url = re.compile(
        "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})"
    )

    if type == "HGL":
        tested_value = "".join(re.findall(reg_hangul, value))
    elif type == "LRN":
        tested_value = "".join(re.findall(reg_lower_case_roman_and_number, value))
    elif type == "NUM":
        tested_value = "".join(re.findall(reg_number, value))
    elif type == "DAT":
        tested_value = "".join(re.findall(reg_number_with_dash, value))
    elif type == "EML":
        tested_value = reg_email.match(value).group()
    elif type == "URL":
        tested_value = reg_url.match(value).group()
    else:
        tested_value = None

    result = True if value == tested_value else False

    return result


def chat_gpt(model: str, prompt: list):
    openai.organization = OPENAI_ORG
    openai.api_key = OPENAI_API_KEY
    openai.Model.list()

    url = "https://api.openai.com/v1/chat/completions"
    data = {
        "model": f"gpt-{model}",
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0,
    }

    try:
        openai_response = requests.post(
            url, headers=set_headers("OPEN_AI"), data=json.dumps(data)
        ).json()["choices"][0]["message"]["content"]
    except:
        openai_response = ""

    return openai_response


def short_io(
    action: str,
    request=None,
    filter: dict = None,
    limit: int = None,
    mask: bool = False,
):
    """
    - action | `str`:
        - create
        - retrieve
        - update
        - delete
    - request | `HttpRequest`
    - filter | `dict`
    - limit | `int`
    - mask | `bool`
    """

    # action: create
    if action == "create":
        target_url = request.GET["target_url"]
        slug = request.GET["slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        url = "https://api.short.io/links"
        payload = {
            "tags": [category, f"{request.user}", expiration_date],
            "domain": "dgufilm.link",
            "allowDuplicates": True,
            "originalURL": target_url,
            "path": slug,
            "title": title,
        }
        response = requests.post(url, json=payload, headers=set_headers("SHORT_IO"))

        result = response

    # action: retrieve
    elif action == "retrieve":
        url = f"https://api.short.io/api/links?domain_id={SHORT_IO_DOMAIN_ID}&dateSortOrder=desc"
        url = url if limit == None else url + f"&limit={limit}"
        response = requests.get(url, headers=set_headers("SHORT_IO")).json()

        dflink_count = int(response["count"]) - 1 if limit == None else limit
        dflinks = response["links"]
        dflink_list = []

        try:
            for i in range(dflink_count):
                user = dflinks[i]["tags"][1]

                try:
                    if user != filter["user"]:
                        continue
                except:
                    pass

                user = mask_personal_information("student_id", user) if mask else user

                dflink = {
                    "link_id": dflinks[i]["idString"],
                    "target_url": dflinks[i]["originalURL"],
                    "dflink_url": f"https://dgufilm.link/{dflinks[i]['path']}",
                    "slug": dflinks[i]["path"],
                    "title": dflinks[i]["title"],
                    "category": dflinks[i]["tags"][0],
                    "user": user,
                    "expiration_date": dflinks[i]["tags"][2],
                }

                dflink_list.append(dflink)
        except:
            pass

        result = dflink_list

    # action: update
    elif action == "update":
        link_id = request.GET["link_id"]
        target_url = request.GET["target_url"]
        slug = request.GET["slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        url = f"https://api.short.io/links/{link_id}"
        payload = {
            "tags": [category, f"{request.user}", expiration_date],
            "originalURL": target_url,
            "path": slug,
            "title": title,
        }
        response = requests.post(url, json=payload, headers=set_headers("SHORT_IO"))

        result = response

    # action: delete
    elif action == "delete":
        link_id = request.GET["link_id"]
        slug = request.GET["slug"]

        url = f"https://api.short.io/links/expand?domain=dgufilm.link&path={slug}"
        response = requests.get(url, headers=set_headers("SHORT_IO")).json()
        target_url = response["originalURL"]
        title = response["title"]
        category = response["tags"][0]
        expiration_date = response["tags"][2]

        url = f"https://api.short.io/links/{link_id}"
        response = requests.delete(url, headers=set_headers("SHORT_IO"))
        result = response

    return result


def airtable(
    action: str, target: str, data: dict = None, limit: int = None, mask: bool = False
):
    """
    - action | `str`:
        - create
        - get
        - get_all
        - update
        - batch_update
        - delete
    - target | `str`:
        - record
        - records
    - data | `dict`
        - table_name
        - params | `dict`
    - limit | `int`
    - mask | `bool`
    """

    if data != None:
        table_name = data.get("table_name", None)
        params = data.get("params", None)

    # action: create / target: record
    if action == "create" and target == "record":
        record = AIRTABLE.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID[table_name]).create(
            fields=params.get("fields", None)
        )

        result = record

    # action: get / target: record
    elif action == "get" and target == "record":
        record = AIRTABLE.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID[table_name]).get(
            record_id=params.get("record_id", None),
        )

        fields = record["fields"]

        if table_name == "facility-request":
            start_datetime = format_datetime(convert_datetime(fields["Start datetime"]))
            end_datetime = format_datetime(convert_datetime(fields["End datetime"]))
            created_time = format_datetime(convert_datetime(fields["Created time"]))
            approved_time = fields.get("Approved time", None)
            started_time = fields.get("Started time", None)
            completed_time = fields.get("Completed time", None)
            canceled_time = fields.get("Canceled time", None)
            rejected_time = fields.get("Rejected time", None)

            if approved_time:
                approved_time = format_datetime(convert_datetime(approved_time))

            if started_time:
                started_time = format_datetime(convert_datetime(started_time))

            if completed_time:
                completed_time = format_datetime(convert_datetime(completed_time))

            if canceled_time:
                canceled_time = format_datetime(convert_datetime(canceled_time))

            if rejected_time:
                rejected_time = format_datetime(convert_datetime(rejected_time))

            user = fields["User"]

            user = (
                mask_personal_information("student_id", user) if user and mask else user
            )

            record = {
                "record_id": record["id"],
                "name": fields["Name"],
                "category": fields["Category"],
                "category_in_korean": fields["Category in Korean"],
                "project_id": fields.get("Project team", None),
                "film_title": fields.get("Project team film title", [None])[0],
                "purpose": {
                    "priority": fields.get("Purpose priority", [None])[0],
                    "keyword": fields.get("Purpose keyword", [None])[0],
                },
                "subject_name": fields["Subject name"],
                "duration": fields["Duration"],
                "start_datetime": start_datetime,
                "end_datetime": end_datetime,
                "start_equipment_hour": fields.get("Start equipment hour", None),
                "end_equipment_hour": fields.get("End equipment hour", None),
                "user": user,
                "public_url": fields["Public URL"],
                "public_id": fields["Public ID"],
                "private_id": fields["Private ID"],
                "for_instructor": fields.get("For instructor", False),
                "status": fields["Status"],
                "created_time": created_time,
                "approved_time": approved_time,
                "started_time": started_time,
                "completed_time": completed_time,
                "canceled_time": canceled_time,
                "rejected_time": rejected_time,
                "validation": fields["Validation"],
            }

        elif table_name == "equipment-hour":
            project_and_date = fields.get("Project and date", [])

            if project_and_date:
                project_and_date = json.loads(project_and_date.replace("'", '"'))

            record = {
                "record_id": record["id"],
                "name": fields["Name"],
                "day_of_the_week": fields["Day of the week"],
                "day_of_the_week_in_korean": fields["Day of the week in Korean"],
                "time": fields["Time"],
                "max_capacity": fields["Max capacity"],
                "start_facility_request": fields.get("Start facility request", []),
                "end_facility_request": fields.get("End facility request", []),
                "start_facility_request_date": fields.get(
                    "Start facility request date", []
                ),
                "end_facility_request_date": fields.get(
                    "End facility request date", []
                ),
            }

        elif table_name == "equipment-collection":
            record = {
                "record_id": record["id"],
                "collection_id": fields["ID"],
                # "thumbnail": fields["Thumbnail"][0]["url"],
                "name": fields["Name"],
                "category": {
                    "priority": fields.get("Category priority", [None])[0],
                    "keyword": fields.get("Category keyword", [None])[0],
                },
                "subcategory": {
                    "keyword": fields.get("Subcategory keyword", [None])[0],
                    "order": fields.get("Subcategory order", [None])[0],
                },
                "brand": fields["Brand name"][0],
                "model": fields["Model"],
                "item_purpose": sorted(set(fields["Item purpose"].split(", "))),
                "order": fields["Order"],
            }

            item_record_id_list = fields["Item"]
            item_list = []

            with ThreadPoolExecutor(max_workers=30) as executor:
                future_to_item = {
                    executor.submit(
                        airtable,
                        "get",
                        "record",
                        data={
                            "table_name": "equipment-item",
                            "params": {"record_id": record_id},
                        },
                    ): record_id
                    for record_id in item_record_id_list
                }

                for future in as_completed(future_to_item):
                    item = future.result()
                    item_list.append(item)

            record["item"] = item_list

        elif table_name == "equipment-item":
            record = {
                "record_id": record["id"],
                "item_id": fields["ID"],
                "serial_number": fields["Serial number"],
                "purpose": fields["Purpose name"],
                "start_datetime": fields.get("Facility request start datetime", []),
                "end_datetime": fields.get("Facility request end datetime", []),
                "status": fields["Status"],
                "validation": fields["Validation"],
            }

        elif table_name == "project-team":
            record = {
                "record_id": record["id"],
                "project_id": fields["ID"],
                "name": fields["Name"],
                "film_title": fields["Film title"],
                "purpose": {
                    "record_id": fields.get("Equipment purpose", [None])[0],
                    "priority": fields.get("Equipment purpose priority", [None])[0],
                    "keyword": fields.get("Equipment purpose keyword", [None])[0],
                },
                "production_end_date": fields["Production end date"],
                "instructor": fields.get("Instructor", None),
                "subject_code": fields.get("Subject code", None),
                "subject_name": fields.get("Subject name", None),
                "user": fields["User"],
                "created_time": fields["Created time"],
            }

            staff = fields.get("Staff", None)
            staff_list = ast.literal_eval(staff) if staff else None
            director_list = []
            director_name_list = []
            producer_list = []
            producer_name_list = []
            producer_student_id_list = []

            for staff in staff_list:
                student_id = staff["student_id"]
                user = User.objects.get(username=student_id)
                staff["pk"] = str(user.pk)

                staff["name"] = (
                    mask_personal_information("name", user.metadata.name)
                    if mask
                    else user.metadata.name
                )

                staff["student_id"] = (
                    mask_personal_information("student_id", student_id)
                    if mask
                    else student_id
                )

                staff["avatar_url"] = user.socialaccount_set.all()[0].get_avatar_url()

                for priority in staff["position_priority"]:
                    if priority == "A01":  # A01: 연출
                        director_list.append(staff)
                        director_name_list.append(staff["name"])

                    if priority == "B01":  # B01: 제작
                        producer_list.append(staff)
                        producer_name_list.append(staff["name"])
                        producer_student_id_list.append(staff["student_id"])

            record["staff"] = staff_list
            record["director"] = director_list
            record["director_name"] = director_name_list
            record["producer"] = producer_list
            record["producer_name"] = producer_name_list
            record["producer_student_id"] = producer_student_id_list

        result = record

    # action: get_all / target: records
    elif action == "get_all" and target == "records":
        records = AIRTABLE.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID[table_name]).all(
            view=params.get("view", None),
            fields=params.get("fields", None),
            formula=params.get("formula", None),
            sort=["Order"],
            max_records=limit,
        )

        record_list = []

        if table_name == "facility-request":
            try:
                for record in records:
                    fields = record["fields"]

                    start_datetime = format_datetime(
                        convert_datetime(fields["Start datetime"])
                    )

                    end_datetime = format_datetime(
                        convert_datetime(fields["End datetime"])
                    )

                    created_time = format_datetime(
                        convert_datetime(fields["Created time"])
                    )

                    approved_time = fields.get("Approved time", None)
                    started_time = fields.get("Started time", None)
                    completed_time = fields.get("Completed time", None)
                    canceled_time = fields.get("Canceled time", None)
                    rejected_time = fields.get("Rejected time", None)

                    if approved_time:
                        approved_time = format_datetime(convert_datetime(approved_time))

                    if started_time:
                        started_time = format_datetime(convert_datetime(started_time))

                    if completed_time:
                        completed_time = format_datetime(
                            convert_datetime(completed_time)
                        )

                    if canceled_time:
                        canceled_time = format_datetime(convert_datetime(canceled_time))

                    if rejected_time:
                        rejected_time = format_datetime(convert_datetime(rejected_time))

                    user = fields["User"]

                    user = (
                        mask_personal_information("student_id", user)
                        if user and mask
                        else user
                    )

                    request = {
                        "record_id": record["id"],
                        "name": fields.get("Name", None),
                        "category": fields.get("Category", None),
                        "category_in_korean": fields.get("Category in Korean", None),
                        "project_id": fields.get("Project team", None),
                        "film_title": fields.get("Project team film title", [None])[0],
                        "staff": fields.get("Project team staff", None),
                        "purpose": {
                            "priority": fields.get("Purpose priority", [None])[0],
                            "keyword": fields.get("Purpose keyword", [None])[0],
                        },
                        "subject_name": fields["Subject name"],
                        "duration": fields.get("Duration", None),
                        "start_datetime": start_datetime,
                        "end_datetime": end_datetime,
                        "start_equipment_hour": fields.get(
                            "Start equipment hour", None
                        ),
                        "end_equipment_hour": fields.get("End equipment hour", None),
                        "user": user,
                        "public_url": fields.get("Public URL", None),
                        "public_id": fields.get("Public ID", None),
                        "private_id": fields.get("Private ID", None),
                        "for_instructor": fields.get("For instructor", False),
                        "status": fields.get("Status", None),
                        "created_time": created_time,
                        "approved_time": approved_time,
                        "started_time": started_time,
                        "completed_time": completed_time,
                        "canceled_time": canceled_time,
                        "rejected_time": rejected_time,
                    }

                    record_list.append(request)
            except:
                pass

        elif table_name == "equipment-hour":
            try:
                for record in records:
                    fields = record["fields"]
                    project_and_date = fields.get("Project and date", [])

                    if project_and_date:
                        project_and_date = json.loads(
                            project_and_date.replace("'", '"')
                        )

                    hour = {
                        "record_id": record["id"],
                        "name": fields.get("Name", None),
                        "day_of_the_week": fields.get("Day of the week", None),
                        "day_of_the_week_in_korean": fields.get(
                            "Day of the week in Korean", None
                        ),
                        "time": fields.get("Time", None),
                        "max_capacity": fields.get("Max capacity", None),
                        "project_and_date": project_and_date,
                        "start_facility_request": fields.get(
                            "Start facility request", []
                        ),
                        "end_facility_request": fields.get("End facility request", []),
                        "start_facility_request_date": fields.get(
                            "Start facility request date", []
                        ),
                        "end_facility_request_date": fields.get(
                            "End facility request date", []
                        ),
                    }

                    record_list.append(hour)
            except:
                pass

        elif table_name == "equipment-category":
            try:
                for record in records:
                    fields = record["fields"]

                    category = {
                        "name": fields.get("Name", None),
                        "priority": fields.get("Priority", None),
                        "keyword": fields.get("Keyword", None),
                    }

                    record_list.append(category)
            except:
                pass

        elif table_name == "equipment-purpose":
            try:
                for record in records:
                    fields = record["fields"]

                    purpose = {
                        "record_id": record["id"],
                        "name": fields.get("Name", None),
                        "priority": fields.get("Priority", None),
                        "keyword": fields.get("Keyword", None),
                        "secondary_keyword": fields.get("Secondary keyword", None),
                        "at_least": fields.get("At least", None),
                        "up_to": fields.get("Up to", None),
                        "max": fields.get("Max", None),
                        "in_a_nutshell": fields.get("In a nutshell", None),
                        "curricular": fields.get("Curricular", False),
                        "for_senior_project": fields.get("For senior project", False),
                        "for_instructor": fields.get("For instructor", False),
                    }

                    record_list.append(purpose)
            except:
                pass

        elif table_name == "equipment-limit":
            try:
                for record in records:
                    fields = record["fields"]

                    limit = {
                        "name": fields.get("Name", None),
                        "depth": fields.get("Depth", None),
                        "category_priority": fields.get("Category priority", [None])[0],
                        "subcategory_order": fields.get("Subcategory order", [None])[0],
                        "brand": fields.get("Brand name", [None])[0],
                        "group_collection_id": fields.get("Group collection ID", None),
                        "collection_id": fields.get("Collection ID", [None])[0],
                        "limit": fields.get("Limit", None),
                        "in_a_nutshell": fields.get("In a nutshell", None),
                    }

                    record_list.append(limit)
            except:
                pass

        elif table_name == "equipment-collection":
            try:
                for record in records:
                    fields = record["fields"]

                    collection = {
                        "record_id": record["id"],
                        "collection_id": fields.get("ID", None),
                        "thumbnail": (
                            fields.get("Thumbnail", [None])[0].get("url")
                            if fields.get("Thumbnail", [None])[0]
                            else None
                        ),
                        "name": fields.get("Name", None),
                        "category": {
                            "priority": fields.get("Category priority", [None])[0],
                            "keyword": fields.get("Category keyword", [None])[0],
                        },
                        "subcategory": {
                            "keyword": fields.get("Subcategory keyword", [None])[0],
                            "order": fields.get("Subcategory order", [None])[0],
                        },
                        "brand": fields.get("Brand name", [None])[0],
                        "model": fields.get("Model", None),
                        "item_purpose": sorted(
                            set(fields.get("Item purpose", None).split(", "))
                        ),
                    }

                    record_list.append(collection)
            except:
                pass

        elif table_name == "equipment-item":
            try:
                for record in records:
                    fields = record["fields"]

                    item = {
                        "record_id": record["id"],
                        "item_id": fields["ID"],
                        "collection_id": fields["Collection ID"][0],
                        "name": fields["Name"],
                        "status": fields["Status"],
                    }

                    record_list.append(item)
            except:
                pass

        elif table_name == "project-team":
            # try:
            for record in records:
                fields = record["fields"]
                instructor = fields.get("Instructor", None)

                instructor = (
                    mask_personal_information("instructor_id", instructor)
                    if instructor and mask
                    else instructor
                )

                user = fields.get("User", None)

                user = (
                    mask_personal_information("student_id", user)
                    if user and mask
                    else user
                )

                created_time = fields.get("Created time", None)
                created_time = convert_datetime(created_time) if created_time else None

                created_date = (
                    created_time.strftime("%Y-%m-%d") if created_time else None
                )

                team = {
                    "record_id": record["id"],
                    "project_id": fields.get("ID", None),
                    "name": fields.get("Name", None),
                    "film_title": fields.get("Film title", None),
                    "purpose": {
                        "priority": fields.get("Equipment purpose priority", [None])[0],
                        "keyword": fields.get("Equipment purpose keyword", [None])[0],
                    },
                    "production_end_date": fields.get("Production end date", None),
                    "instructor": instructor,
                    "subject_code": fields.get("Subject code", None),
                    "subject_name": fields.get("Subject name", None),
                    "user": user,
                    "facility_request": fields.get("Facility request", None),
                    "facility_request_status": fields.get(
                        "Facility request status", []
                    ),
                    "created_date": created_date,
                }

                staff = fields.get("Staff", None)
                staff_list = ast.literal_eval(staff) if staff else None
                director_list = []
                director_name_list = []
                producer_list = []
                producer_name_list = []
                producer_student_id_list = []

                for staff in staff_list:
                    student_id = staff["student_id"]
                    try:
                        user = User.objects.get(username=student_id)
                        staff["pk"] = str(user.pk)

                        staff["name"] = (
                            mask_personal_information("name", user.metadata.name)
                            if mask
                            else user.metadata.name
                        )

                        staff["student_id"] = (
                            mask_personal_information("student_id", student_id)
                            if mask
                            else student_id
                        )

                        staff["avatar_url"] = user.socialaccount_set.all()[
                            0
                        ].get_avatar_url()
                    except:
                        staff["pk"] = ""
                        staff["name"] = "사용자"
                        staff["student_id"] = "**********"
                        staff["avatar_url"] = (
                            "https://dongguk.film/static/images/d_dot_f_logo.jpg"
                        )

                    for priority in staff["position_priority"]:
                        if priority == "A01":  # A01: 연출
                            director_list.append(staff)
                            director_name_list.append(staff["name"])

                        if priority == "B01":  # B01: 제작
                            producer_list.append(staff)
                            producer_name_list.append(staff["name"])
                            producer_student_id_list.append(staff["student_id"])

                team["staff"] = staff_list
                team["director"] = director_list
                team["director_name"] = director_name_list
                team["producer"] = producer_list
                team["producer_name"] = producer_name_list
                team["producer_student_id"] = producer_student_id_list
                record_list.append(team)
            # except:
            #     pass

        elif table_name == "project-position":
            try:
                for record in records:
                    fields = record["fields"]

                    position = {
                        "function": fields.get("Function", None),
                        "function_priority": fields.get("Function priority", None),
                        "name": fields.get("Name", None),
                        "priority": fields.get("Priority", None),
                        "keyword": fields.get("Keyword", None),
                        "in_english": fields.get("In English", None),
                        "note": fields.get("Note", None),
                        "required": fields.get("Required", False),
                    }

                    record_list.append(position)
            except:
                pass

        result = record_list

    # action: update / target: record
    elif action == "update" and target == "record":
        record_id = params.get("record_id", None)
        fields = params.get("fields", None)

        record = AIRTABLE.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID[table_name]).update(
            record_id, fields
        )

        result = record

    # action: batch_update / target: records
    elif action == "batch_update" and target == "records":
        record_list = params.get("record_list", None)

        records = AIRTABLE.table(
            AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID[table_name]
        ).batch_update(record_list)

        result = records

    # action: delete / target: record
    elif action == "delete" and target == "record":
        record_id = params.get("record_id", None)

        record = AIRTABLE.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID[table_name]).delete(
            record_id
        )

        result = record

    return result


def notion(
    action: str, target: str, data: dict = None, limit: int = None, mask: bool = False
):
    """
    - action | `str`:
        - query
        - create
        - retrieve
        - update
        - append
        - delete
    - target | `str`:
        - block
        - block_children
        - page_properties
        - page
        - db
    - data | `dict`
        - db_name
        - filter_property | `list`
        - filter | `dict`
        - sort | `list`
        - page_id
        - block_id_list
        - property_id
        - title
        - category
        - purpose
        - production_end_date | `str`
        - content
        - keyword
        - img_key_list
        - file
        - user
    - limit | `int`
    - mask | `bool`
    """

    if data != None:
        db_name = data.get("db_name", None)
        filter_property = data.get("filter_property", None)
        filter = data.get("filter", None)
        sort = data.get("sort", None)
        page_id = data.get("page_id", None)
        block_id_list = data.get("block_id_list", None)
        property_id = data.get("property_id", None)
        title = data.get("title", None)
        category = data.get("category", None)
        content = data.get("content", None)
        keyword = data.get("keyword", None)
        img_key_list = data.get("img_key_list", None)
        file = data.get("file", None)
        user = data.get("user", None)

    # action: query / target: db
    if action == "query" and target == "db":
        url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID[db_name]}/query"
        payload = {}

        if filter_property:
            url += "?"
            last_index = len(filter_property) - 1
            for index, property in enumerate(filter_property):
                url += f"filter_properties={property}"
                if index != last_index:
                    url += "&"

        if filter:
            payload["filter"] = filter

        if sort:
            payload["sorts"] = sort

        if limit:
            payload["page_size"] = limit

        if db_name == "operator":
            response = requests.post(
                url, json=payload, headers=set_headers("NOTION")
            ).json()
            items = response["results"]
            item_list = []

            try:
                for item in items:
                    properties = item["properties"]
                    student_id = properties["Title"]["title"][0]["plain_text"]
                    permission = properties["Permission"]["select"]["name"]

                    operator = {
                        "student_id": student_id,
                        "permission": permission,
                    }

                    item_list.append(operator)
            except:
                pass

        elif db_name == "dflink-allowlist":
            response = requests.post(
                url, json=payload, headers=set_headers("NOTION")
            ).json()
            items = response["results"]
            item_list = []

            try:
                for item in items:
                    properties = item["properties"]
                    url = properties["URL"]["url"]
                    item_list.append(url)
            except:
                pass

        elif db_name == "notice":
            response = requests.post(
                url, json=payload, headers=set_headers("NOTION")
            ).json()
            items = response["results"]
            item_list = []

            try:
                for item in items:
                    properties = item["properties"]
                    listed_time = properties["Listed time"]["created_time"]
                    listed_time = convert_datetime(listed_time)
                    notice_id = properties["ID"]["formula"]["string"]
                    title = properties["Title"]["title"][0]["plain_text"]
                    category = properties["Category"]["select"]["name"]
                    keyword = properties["Keyword"]["rich_text"][0]["plain_text"]
                    user = properties["User"]["rich_text"][0]["plain_text"]

                    notice = {
                        "page_id": item["id"],
                        "notice_id": notice_id,
                        "title": title,
                        "category": category,
                        "keyword": keyword,
                        "user": int(user),
                        "listed_date": listed_time.strftime("%Y-%m-%d"),
                    }

                    img_key_list = (
                        properties.get("Image key list", {})
                        .get("rich_text", [{}])[0]
                        .get("plain_text", None)
                    )
                    file = (
                        properties.get("File", {})
                        .get("rich_text", [{}])[0]
                        .get("plain_text", None)
                    )

                    notice["img_key_list"] = (
                        ast.literal_eval(img_key_list) if img_key_list else None
                    )

                    notice["file"] = ast.literal_eval(file) if file else None
                    item_list.append(notice)
            except:
                pass

        result = item_list

    # action: create / target: page
    elif action == "create" and target == "page":
        url = "https://api.notion.com/v1/pages"

        if db_name == "notice":
            content_chunks = [
                content[i : i + 2000] for i in range(0, len(content), 2000)
            ]

            paragraph_list = [
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": chunk},
                            }
                        ]
                    },
                }
                for chunk in content_chunks
            ]

            payload = {
                "parent": {"database_id": NOTION_DB_ID[db_name]},
                "properties": {
                    "Category": {
                        "select": {
                            "name": category,
                        },
                    },
                    "Title": {"title": [{"text": {"content": title}}]},
                    "Keyword": {"rich_text": [{"text": {"content": keyword}}]},
                    "Image key list": {
                        "rich_text": [{"text": {"content": str(img_key_list)}}]
                    },
                    "File": {"rich_text": [{"text": {"content": str(file)}}]},
                    "User": {"rich_text": [{"text": {"content": str(user)}}]},
                },
                "children": paragraph_list,
            }

            response = requests.post(url, json=payload, headers=set_headers("NOTION"))

        result = response

    # action: retrieve / target: block_children
    elif action == "retrieve" and target == "block_children":
        url = f"https://api.notion.com/v1/blocks/{page_id}/children"
        response = requests.get(url, headers=set_headers("NOTION")).json()

        blocks = response["results"]
        block_id_list = []
        content = ""

        for i, block in enumerate(blocks):
            block_id = blocks[i]["id"]
            type = blocks[i]["type"]
            block = {
                "content_chunk": blocks[i][type]["rich_text"][0]["plain_text"],
            }
            block_id_list.append(block_id)
            content += block["content_chunk"]

        result = block_id_list, content

    # action: retrieve / target: page_properties
    elif action == "retrieve" and target == "page_properties":
        url = f"https://api.notion.com/v1/pages/{page_id}/properties/{property_id}"
        response = requests.get(url, headers=set_headers("NOTION"))

        result = response

    # action: retrieve / target: page
    elif action == "retrieve" and target == "page":
        url = f"https://api.notion.com/v1/pages/{page_id}"
        response = requests.get(url, headers=set_headers("NOTION"))

        result = response

    # action: update / target: page_properties
    elif action == "update" and target == "page_properties":
        url = f"https://api.notion.com/v1/pages/{page_id}"

        if db_name == "notice":
            payload = {
                "properties": {
                    "Category": {
                        "select": {
                            "name": category,
                        },
                    },
                    "Title": {"title": [{"text": {"content": title}}]},
                    "Keyword": {"rich_text": [{"text": {"content": keyword}}]},
                    "Image key list": {
                        "rich_text": [{"text": {"content": str(img_key_list)}}]
                    },
                    "File": {"rich_text": [{"text": {"content": str(file)}}]},
                },
            }
            response = requests.patch(url, json=payload, headers=set_headers("NOTION"))

        result = response

    # action: append / target: block_children
    elif action == "append" and target == "block_children":
        url = f"https://api.notion.com/v1/blocks/{page_id}/children"

        content_chunks = [content[i : i + 2000] for i in range(0, len(content), 2000)]

        paragraph_list = [
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": chunk},
                        }
                    ]
                },
            }
            for chunk in content_chunks
        ]

        payload = {"children": paragraph_list}
        response = requests.patch(url, json=payload, headers=set_headers("NOTION"))

        result = response

    # action: delete / target: block
    elif action == "delete" and target == "block":
        block_id_list = block_id_list.split(",")
        response_list = []

        for block_id in block_id_list:
            url = f"https://api.notion.com/v1/blocks/{block_id}"
            response = requests.delete(url, headers=set_headers("NOTION"))
            response_list.append(response)

        result = response_list

    # action: delete / target: page
    elif action == "delete" and target == "page":
        url = f"https://api.notion.com/v1/pages/{page_id}"
        payload = {"archived": True}
        response = requests.patch(url, json=payload, headers=set_headers("NOTION"))

        result = response

    return result


def aws_s3(action: str, target: str, data: dict = None):
    if data != None:
        bin = data.get("bin", None)
        name = data.get("name", None)
        key = data.get("key", None)

    # action: put / target: object
    if action == "put" and target == "object":
        response = AWS_S3.put_object(
            Body=bin,
            Bucket="dongguk-film",
            ContentDisposition=f'attachment; filename="{name}"',
            Key=key,
            ACL="public-read",
        )

        result = response

    # action: get / target: object
    elif action == "get" and target == "object":
        try:
            response = AWS_S3.get_object(Bucket="dongguk-film", Key=key)
        except:
            # response = requests.models.Response()
            # response.status_code = 400
            response = {"ResponseMetadata": {"HTTPStatusCode": 400}}

        result = response

    # action: delete / target: object
    elif action == "delete" and target == "object":
        response = AWS_S3.delete_object(Bucket="dongguk-film", Key=key)

        result = response

    return result


def ncp_clova(action: str, target: str, data: dict = None):
    if data != None:
        img_src = data.get("img_src", None)

    # action: "ocr" / target: "b64_img"
    if action == "ocr" and target == "b64_img":
        img_mime_type = img_src.split(";")[0].split(":")[1]
        img_format = img_mime_type.split("/")[-1]
        img_data = img_src.split(",")[1]
        img_url = None
        img_key = img_data[-5:]

    # action: "ocr" / target: "bin_img"
    elif action == "ocr" and target == "bin_img":
        img_format = img_src.rsplit(".", 1)[-1].split("&")[0].split("/")[0]
        img_data = None
        img_url = img_src
        img_key = img_url.rsplit(".", 1)[0][-5:]

    # all
    if img_format in ["jpg", "jpeg", "png", "pdf", "tiff"]:
        request_json = {
            "version": "V2",
            "requestId": str(uuid.uuid4()),
            "timestamp": int(round(time.time() * 1000)),
            "images": [
                {
                    "format": img_format,
                    "data": img_data,
                    "url": img_url,
                    "name": img_key,
                }
            ],
            "enableTableDetection": True,
        }
        payload = json.dumps(request_json).encode("UTF-8")
        headers = {
            "X-OCR-SECRET": NCP_CLOVA_OCR_SECRET_KEY,
            "Content-Type": "application/json",
        }
        response = requests.request(
            "POST", NCP_CLOVA_OCR_APIGW_INVOKE_URL, data=payload, headers=headers
        )

        result = response

    else:
        response = requests.models.Response()
        response.status_code = 400

        result = response

    return result
