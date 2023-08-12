from django.conf import settings
from datetime import datetime
from utility.utils import set_headers
import requests, pytz

NOTION_SECRET = getattr(settings, "NOTION_SECRET", "NOTION_SECRET")
NOTION_DB_ID = getattr(settings, "NOTION_DB_ID", "NOTION_DB_ID")

#
# Sub functions
#


def query_notion_db(notion_db_name):
    url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID[notion_db_name]}/query"
    response = requests.post(url, headers=set_headers("NOTION")).json()

    notices = response["results"]
    notice_list = []

    if notion_db_name == "notice-db":
        try:
            for i in range(len(notices)):
                listed_time = notices[i]["properties"]["Listed time"]["created_time"]
                listed_time_utc = datetime.strptime(
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
                    "summary": notices[i]["properties"]["Summary"]["rich_text"][0][
                        "plain_text"
                    ],
                    "keywords": notices[i]["properties"]["Keywords"]["rich_text"][0][
                        "plain_text"
                    ],
                    "user": str(notices[i]["properties"]["User ID"]["number"]),
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
