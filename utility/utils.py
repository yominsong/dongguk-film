from django.conf import settings
from django.http import HttpResponse
from django.contrib.auth.models import User
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from fake_useragent import UserAgent
from .img import save_hero_img
from .msg import send_msg
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json, re, requests, pytz, datetime, pyairtable, openai, boto3, random, string, uuid, time, ast

#
# Global variables
#

NCP_CLOVA_OCR_SECRET_KEY = getattr(settings, "NCP_CLOVA_OCR_SECRET_KEY", None)
NCP_CLOVA_OCR_APIGW_INVOKE_URL = getattr(
    settings, "NCP_CLOVA_OCR_APIGW_INVOKE_URL", None
)

AIRTABLE_TOKEN = getattr(settings, "AIRTABLE_TOKEN", None)
AIRTABLE_BASE_ID = getattr(settings, "AIRTABLE_BASE_ID", None)
AIRTABLE_TABLE_ID = getattr(settings, "AIRTABLE_TABLE_ID", None)
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
# Cron functions
#


def update_dmd_cookie(request):
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

    send_msg(request, "UDC", "DEV", cookie)

    return HttpResponse(f"dmd-cookie: {cookie}")


def update_hero_img(request):
    home_img = save_hero_img("video-camera", "home")
    equipment_img = save_hero_img("cinema-lens", "equipment")
    project_img = save_hero_img("film-production", "project")
    dflink_img = save_hero_img("keyboard", "dflink")
    notice_img = save_hero_img("office", "notice")

    img_list_for_msg = {
        "home": home_img,
        "equipment": equipment_img,
        "project": project_img,
        "dflink": dflink_img,
        "notice": notice_img,
    }

    send_msg(request, "UIG", "DEV", img_list_for_msg)

    return HttpResponse(f"Updated images URL: {img_list_for_msg}")


#
# Sub functions
#


def convert_datetime(datetime_str: str):
    """
    - datetime_str | `str`: DateTime string
    """

    try:
        datetime_utc = datetime.datetime.strptime(
            datetime_str, "%Y-%m-%dT%H:%M:%S.%fZ"
        ).replace(tzinfo=pytz.utc)
    except:
        datetime_utc = datetime.datetime.strptime(
            datetime_str, "%Y-%m-%d"
        ).replace(tzinfo=pytz.utc)

    kor_tz = pytz.timezone("Asia/Seoul")
    datetime_kor = datetime_utc.astimezone(kor_tz)

    return datetime_kor


def generate_random_string(int: int):
    """
    - int | `int`: Any string length you want
    """

    random_string = "".join(random.choices(string.ascii_letters, k=int))

    return random_string


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


def chat_gpt(prompt: str):
    openai.organization = OPENAI_ORG
    openai.api_key = OPENAI_API_KEY
    openai.Model.list()

    url = "https://api.openai.com/v1/chat/completions"
    data = {
        "model": "gpt-3.5-turbo",
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


def short_io(action: str, request=None, limit: int = None):
    """
    - action | `str`:
        - create
        - retrieve
        - update
        - delete
    - request | `HttpRequest`
    - limit | `int`
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
                dflink = {
                    "link_id": dflinks[i]["idString"],
                    "target_url": dflinks[i]["originalURL"],
                    "dflink_url": f"https://dgufilm.link/{dflinks[i]['path']}",
                    "slug": dflinks[i]["path"],
                    "title": dflinks[i]["title"],
                    "category": dflinks[i]["tags"][0],
                    "user": dflinks[i]["tags"][1],
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


def airtable(action: str, target: str, data: dict = None, limit: int = None):
    """
    - action | `str`:
        - get
        - get_all
    - target | `str`:
        - record
        - records
    - data | `dict`
        - table_name
        - params | `dict`
    - limit | `int`
    """

    if data != None:
        table_name = data.get("table_name", None)
        params = data.get("params", None)

    # action: get / target: record
    if action == "get" and target == "record":
        record = AIRTABLE.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID[table_name]).get(
            params.get("record_id", None),
        )

        fields = record["fields"]

        if table_name == "equipment-collection":
            record = {
                "record_id": record["id"],
                "collection_id": fields["ID"],
                "thumbnail": fields["Thumbnail"][0]["url"],
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
            }

            item_record_id_list = fields["Item"]
            item_list = []

            for record_id in item_record_id_list:
                data = {
                    "table_name": "equipment-item",
                    "params": {
                        "record_id": record_id,
                    },
                }

                item = airtable("get", "record", data=data)
                item_list.append(item)

            record["item"] = item_list

            # item_purpose_list = fields["Item purpose"].split(", ")
            # item_purpose_count = {}

            # for item_purpose in item_purpose_list:
            #     if item_purpose in item_purpose_count:
            #         item_purpose_count[item_purpose] += 1
            #     else:
            #         item_purpose_count[item_purpose] = 1

            # record["item_purpose"] = sorted(set(item_purpose_list))
            # record["item_purpose_count"] = {
            #     item: count for item, count in item_purpose_count.items() if count > 1
            # }

        elif table_name == "equipment-item":
            record = {
                "record_id": record["id"],
                "item_id": fields["ID"],
                "serial_number": fields["Serial number"],
                "purpose": fields["Purpose name"],
                "project": fields.get("Project", None),
                "start_date": fields.get("Start date", None),
                "end_date": fields.get("End date", None),
                "status": fields["Status"],
                "validation": fields["Validation"],
            }

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

        if table_name == "equipment-category":
            try:
                for record in records:
                    fields = record["fields"]

                    category = {
                        "name": fields["Name"],
                        "priority": fields["Priority"],
                        "keyword": fields["Keyword"],
                    }

                    record_list.append(category)
            except:
                pass

        elif table_name == "equipment-purpose":
            try:
                for record in records:
                    fields = record["fields"]

                    purpose = {
                        "name": fields["Name"],
                        "priority": fields["Priority"],
                        "keyword": fields["Keyword"],
                        "at_least": fields["At least"],
                        "up_to": fields["Up to"],
                        "max": fields["Max"],
                        "in_a_nutshell": fields["In a nutshell"],
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
                        "in_a_nutshell": fields["In a nutshell"],
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
                        "collection_id": fields["ID"],
                        "thumbnail": fields["Thumbnail"][0]["url"],
                        "name": fields["Name"],
                        "subcategory": fields.get("Subcategory keyword", [None])[0],
                        "brand": fields["Brand name"][0],
                        "model": fields["Model"],
                    }

                    record_list.append(collection)
            except:
                pass

        elif table_name == "project-position":
            try:
                for record in records:
                    fields = record["fields"]

                    position = {
                        "function": fields["Function"],
                        "function_priority": fields["Function priority"],
                        "name": fields["Name"],
                        "priority": fields["Priority"],
                        "keyword": fields["Keyword"],
                        "in_english": fields["In English"],
                        "note": fields.get("Note", None),
                        "required": fields.get("Required", False),
                    }

                    record_list.append(position)
            except:
                pass

        result = record_list

    return result


def notion(action: str, target: str, data: dict = None, limit: int = None):
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
        - content
        - keyword
        - img_key_list
        - file
        - user
    - limit | `int`
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
        purpose = data.get("purpose", None)
        content = data.get("content", None)
        keyword = data.get("keyword", None)
        img_key_list = data.get("img_key_list", None)
        file = data.get("file", None)
        staff = data.get("staff", None)
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

        if db_name == "project":
            response = requests.post(
                url, json=payload, headers=set_headers("NOTION")
            ).json()
            items = response["results"]
            item_list = []

            JSON_PATH = (
                "dongguk_film/static/json/equipment.json"
                if settings.DEBUG
                else "dongguk_film/staticfiles/json/equipment.json"
            )

            with open(JSON_PATH, "r") as f:
                purpose_list = json.load(f)["purpose"]
                f.close()

            try:
                for item in items:
                    properties = item["properties"]

                    created_time = properties["Created time"]["created_time"]
                    created_time = convert_datetime(created_time)

                    purpose = (
                        properties.get("Purpose", {})
                        .get("rich_text", [{}])[0]
                        .get("plain_text", None)
                    )

                    purpose_priority = [
                        item for item in purpose_list if item["priority"] in purpose
                    ][0]["priority"]
                    purpose_keyword = [
                        item for item in purpose_list if item["priority"] in purpose
                    ][0]["keyword"]

                    title = properties["Title"]["title"][0]["plain_text"]
                    user = str(properties["User"]["number"])

                    project = {
                        "page_id": item["id"],
                        "purpose": {
                            "priority": purpose_priority,
                            "keyword": purpose_keyword,
                        },
                        "title": title,
                        "user": user,
                        "created_date": created_time.strftime("%Y-%m-%d"),
                    }

                    staff = (
                        properties.get("Staff", {})
                        .get("rich_text", [{}])[0]
                        .get("plain_text", None)
                    )

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
                        staff["name"] = user.metadata.name
                        staff["student_id"] = (
                            student_id[:2]
                            + "*" * (len(student_id) - 5)
                            + student_id[-3:]
                        )
                        staff["avatar_url"] = user.socialaccount_set.all()[
                            0
                        ].get_avatar_url()

                        for priority in staff["position_priority"]:
                            if priority == "A01":  # A01: 연출
                                director_list.append(staff)
                                director_name_list.append(staff["name"])

                            if priority == "B01":  # B01: 제작
                                producer_list.append(staff)
                                producer_name_list.append(staff["name"])
                                producer_student_id_list.append(staff["student_id"])

                    project["staff"] = staff_list
                    project["director"] = director_list
                    project["director_name"] = director_name_list
                    project["producer"] = producer_list
                    project["producer_name"] = producer_name_list
                    project["producer_student_id"] = producer_student_id_list

                    item_list.append(project)
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

                    title = properties["Title"]["title"][0]["plain_text"]
                    category = properties["Category"]["select"]["name"]
                    keyword = properties["Keyword"]["rich_text"][0]["plain_text"]
                    user = str(properties["User"]["number"])

                    notice = {
                        "page_id": item["id"],
                        "title": title,
                        "category": category,
                        "keyword": keyword,
                        "user": user,
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

        if db_name == "project":
            payload = {
                "parent": {"database_id": NOTION_DB_ID[db_name]},
                "properties": {
                    "Purpose": {"rich_text": [{"text": {"content": purpose}}]},
                    "Title": {"title": [{"text": {"content": title}}]},
                    "Staff": {"rich_text": [{"text": {"content": str(staff)}}]},
                    "User": {"number": int(str(user))},
                },
            }
            response = requests.post(url, json=payload, headers=set_headers("NOTION"))

        elif db_name == "notice":
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
                    "User": {"number": int(str(user))},
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

        if db_name == "project":
            payload = {
                "properties": {
                    "Purpose": {"rich_text": [{"text": {"content": purpose}}]},
                    "Title": {"title": [{"text": {"content": title}}]},
                    "Staff": {"rich_text": [{"text": {"content": str(staff)}}]},
                    "User": {"number": int(str(user))},
                },
            }
            response = requests.patch(url, json=payload, headers=set_headers("NOTION"))

        elif db_name == "notice":
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

    # action: ocr / target: b64_img
    if action == "ocr" and target == "b64_img":
        img_mime_type = img_src.split(";")[0].split(":")[1]
        img_format = img_mime_type.split("/")[-1]
        img_data = img_src.split(",")[1]
        img_url = None
        img_key = img_data[-5:]

    # action: ocr / target: bin_img
    elif action == "ocr" and target == "bin_img":
        img_format = img_src.rsplit(".", 1)[-1]
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
