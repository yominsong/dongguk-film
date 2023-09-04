from django.conf import settings
from django.http import HttpResponse
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from fake_useragent import UserAgent
from .img import save_hero_img
from .msg import send_msg
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import json, re, requests, pytz, datetime, openai, io, boto3, random, string

#
# Global constants and variables
#

EMAIL_HOST_USER = getattr(settings, "EMAIL_HOST_USER", "EMAIL_HOST_USER")
NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")
OPENAI_ORG = getattr(settings, "OPENAI_ORG", "OPENAI_ORG")
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", "OPENAI_API_KEY")
SHORT_IO_DOMAIN_ID = getattr(settings, "SHORT_IO_DOMAIN_ID", "SHORT_IO_DOMAIN_ID")
SHORT_IO_API_KEY = getattr(settings, "SHORT_IO_API_KEY", "SHORT_IO_API_KEY")
GOOGLE_SA_CREDS = service_account.Credentials.from_service_account_info(
    getattr(settings, "GOOGLE_SA_CREDS", "GOOGLE_SA_CREDS"),
    scopes=["https://www.googleapis.com/auth/drive"],
)
GOOGLE_DRIVE = build("drive", "v3", credentials=GOOGLE_SA_CREDS)
AWS_ACCESS_KEY = getattr(settings, "AWS_ACCESS_KEY", "AWS_ACCESS_KEY")
AWS_SECRET_ACCESS_KEY = getattr(
    settings, "AWS_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"
)
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
    dflink_img = save_hero_img("keyboard", "dflink")
    notice_img = save_hero_img("office", "notice")

    image_list_for_msg = home_img + dflink_img + notice_img

    send_msg(request, "UIG", "DEV", image_list_for_msg)

    return HttpResponse(f"Updated images URL: {image_list_for_msg}")


#
# Sub functions
#


def convert_datetime(notion_datetime):
    datetime_utc = datetime.datetime.strptime(
        notion_datetime, "%Y-%m-%dT%H:%M:%S.%fZ"
    ).replace(tzinfo=pytz.utc)
    kor_tz = pytz.timezone("Asia/Seoul")
    datetime_kor = datetime_utc.astimezone(kor_tz)

    return datetime_kor


def generate_random_string(int):
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


def chap_gpt(prompt: str):
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
        original_url = request.GET["original_url"]
        dflink_slug = request.GET["dflink_slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        url = "https://api.short.io/links"
        payload = {
            "tags": [category, f"{request.user}", expiration_date],
            "domain": "dgufilm.link",
            "allowDuplicates": True,
            "originalURL": original_url,
            "path": dflink_slug,
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
                    "id_string": dflinks[i]["idString"],
                    "original_url": dflinks[i]["originalURL"],
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
        string_id = request.GET["string_id"]
        original_url = request.GET["original_url"]
        dflink_slug = request.GET["dflink_slug"]
        title = request.GET["title"]
        category = request.GET["category"]
        expiration_date = request.GET["expiration_date"]

        url = f"https://api.short.io/links/{string_id}"
        payload = {
            "tags": [category, f"{request.user}", expiration_date],
            "originalURL": original_url,
            "path": dflink_slug,
            "title": title,
        }
        response = requests.post(url, json=payload, headers=set_headers("SHORT_IO"))

        result = response

    # action: delete
    elif action == "delete":
        string_id = request.GET["string_id"]
        dflink_slug = request.GET["dflink_slug"]

        url = (
            f"https://api.short.io/links/expand?domain=dgufilm.link&path={dflink_slug}"
        )
        response = requests.get(url, headers=set_headers("SHORT_IO")).json()
        original_url = response["originalURL"]
        title = response["title"]
        category = response["tags"][0]
        expiration_date = response["tags"][2]

        url = f"https://api.short.io/links/{string_id}"
        response = requests.delete(url, headers=set_headers("SHORT_IO"))

        result = response

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
        - page_id
        - block_id
        - property_id
        - title
        - category
        - content
        - keyword
        - image_name_list
        - file_id_list
        - user
    - request | `HttpRequest`
    - limit | `int`
    """

    if data != None:
        db_name = data.get("db_name", None)
        page_id = data.get("page_id", None)
        block_id = data.get("block_id", None)
        property_id = data.get("property_id", None)
        title = data.get("title", None)
        category = data.get("category", None)
        content = data.get("content", None)
        keyword = data.get("keyword", None)
        image_name_list = data.get("image_name_list", None)
        file_id_list = data.get("file_id_list", None)
        user = data.get("user", None)

    # action: query / target: db
    if action == "query" and target == "db":
        url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID[db_name]}/query"
        payload = {"page_size": limit} if limit != None else None
        response = requests.post(
            url, json=payload, headers=set_headers("NOTION")
        ).json()

        items = response["results"]
        item_list = []

        if db_name == "notice-db":
            try:
                for i in range(len(items)):
                    listed_time = items[i]["properties"]["Listed time"]["created_time"]
                    listed_time = convert_datetime(listed_time)
                    notice = {
                        "page_id": items[i]["id"],
                        "title": items[i]["properties"]["Title"]["title"][0][
                            "plain_text"
                        ],
                        "category": items[i]["properties"]["Category"]["select"][
                            "name"
                        ],
                        "keyword": items[i]["properties"]["Keyword"]["rich_text"][0][
                            "plain_text"
                        ],
                        "user": str(items[i]["properties"]["User"]["number"]),
                        "listed_date": listed_time.strftime("%Y-%m-%d"),
                    }
                    try:
                        notice["file"] = {
                            "name": items[i]["properties"]["File"]["files"][0]["name"],
                            "url": items[i]["properties"]["File"]["files"][0]["file"][
                                "url"
                            ],
                        }
                    except:
                        notice["file"] = None
                    item_list.append(notice)
            except:
                pass

        result = item_list

    # action: create / target: page
    elif action == "create" and target == "page":
        url = "https://api.notion.com/v1/pages"

        if db_name == "notice-db":
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
                    "Image name list": {
                        "rich_text": [{"text": {"content": str(image_name_list)}}]
                    },
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

        for i in range(len(blocks)):
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
        payload = {
            "properties": {
                "Category": {
                    "select": {
                        "name": category,
                    },
                },
                "Title": {"title": [{"text": {"content": title}}]},
                "Keyword": {"rich_text": [{"text": {"content": keyword}}]},
                "Image name list": {
                    "rich_text": [{"text": {"content": str(image_name_list)}}]
                },
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
        block_id_list = block_id.split(",")
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

    # action: put / target: object
    if action == "put" and target == "object":
        response = AWS_S3.put_object(
            Body=bin, Bucket="dongguk-film", Key=name, ACL="public-read"
        )

        result = response

    # action: delete / target: object
    elif action == "delete" and target == "object":
        response = AWS_S3.delete_object(Bucket="dongguk-film", Key=name)

        result = response

    return result
