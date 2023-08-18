from django.conf import settings
from django.http import HttpResponse
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from fake_useragent import UserAgent
from .img import save_img
from .msg import send_msg
import json, re, requests, pytz, datetime, openai

#
# Global constants and variables
#

NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")
OPENAI_ORG = getattr(settings, "OPENAI_ORG", "OPENAI_ORG")
OPENAI_API_KEY = getattr(settings, "OPENAI_API_KEY", "OPENAI_API_KEY")

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


def update_img(request):
    home_img = save_img("video-camera", "home")
    dflink_img = save_img("keyboard", "dflink")
    notice_img = save_img("office", "notice")

    image_list_for_msg = home_img + dflink_img + notice_img

    send_msg(request, "UIG", "DEV", image_list_for_msg)

    return HttpResponse(f"Updated images URL: {image_list_for_msg}")


#
# Main functions
#


def set_headers(type: str):
    if type == "RANDOM":
        headers = {"User-Agent": UserAgent(browsers=["edge", "chrome"]).random}
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
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }
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
    openai_response = requests.post(url, headers=headers, data=json.dumps(data)).json()[
        "choices"
    ][0]["message"]["content"]

    return openai_response


def query_notion_db(notion_db_name, limit: int = None):
    url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID[notion_db_name]}/query"
    payload = {"page_size": limit} if limit != None else None
    response = requests.post(url, json=payload, headers=set_headers("NOTION")).json()

    notices = response["results"]
    notice_list = []

    if notion_db_name == "notice-db":
        try:
            for i in range(len(notices)):
                listed_time = notices[i]["properties"]["Listed time"]["created_time"]
                listed_time_utc = datetime.datetime.strptime(
                    listed_time, "%Y-%m-%dT%H:%M:%S.%fZ"
                ).replace(tzinfo=pytz.utc)
                kor_tz = pytz.timezone("Asia/Seoul")
                listed_time_kor = listed_time_utc.astimezone(kor_tz)
                notice = {
                    "id_string": notices[i]["id"],
                    "title": notices[i]["properties"]["Title"]["title"][0][
                        "plain_text"
                    ],
                    "category": notices[i]["properties"]["Category"]["select"]["name"],
                    "keyword": notices[i]["properties"]["Keyword"]["rich_text"][0][
                        "plain_text"
                    ],
                    "user": str(notices[i]["properties"]["User"]["number"]),
                    "listed_date": listed_time_kor.strftime("%Y-%m-%d"),
                }
                try:
                    notice["file"] = {
                        "name": notices[i]["properties"]["File"]["files"][0]["name"],
                        "url": notices[i]["properties"]["File"]["files"][0]["file"][
                            "url"
                        ],
                    }
                except:
                    notice["file"] = None
                notice_list.append(notice)
        except:
            pass

    return notice_list
