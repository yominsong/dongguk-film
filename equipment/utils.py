from django.conf import settings
from django.http import HttpResponse
from utility.utils import airtable
from utility.msg import send_msg
import json

#
# Global variables
#

JSON_PATH = (
    "dongguk_film/static/json/equipment.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/equipment.json"
)

#
# Cron functions
#


def update_equipment_policy(request):
    target_list = ["category", "purpose", "limit"]
    result_list = []

    for target in target_list:
        if target == "category":
            data = {
                "table_name": "equipment-category",
                "params": {
                    "view": "Grid view",
                    "fields": ["Name", "Priority", "Keyword"],
                },
            }
        elif target == "purpose":
            data = {
                "table_name": "equipment-purpose",
                "params": {
                    "view": "Grid view",
                    "fields": [
                        "Name",
                        "Priority",
                        "Keyword",
                        "Up to",
                        "At least",
                        "Max",
                        "In a nutshell",
                    ],
                },
            }
        elif target == "limit":
            data = {
                "table_name": "equipment-limit",
                "params": {
                    "view": "Grid view",
                },
            }

        record_list = airtable("get_all", "records", data=data)
        result_list.append({target: record_list})

        with open(JSON_PATH, "r+") as f:
            data = json.load(f)
            data[target] = record_list
            f.seek(0)
            f.write(json.dumps(data, indent=4))
            f.truncate()

    send_msg(request, "UEP", "DEV", result_list)

    return HttpResponse(f"Updated policy: {result_list}")


#
# Main functions
#


def get_equipment_policy(policy: str):
    with open(JSON_PATH, "r") as f:
        item_list = json.load(f)[policy]
        f.close()

    return item_list
