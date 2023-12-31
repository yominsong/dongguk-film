from django.conf import settings
from django.http import HttpResponse
from utility.utils import notion
from utility.msg import send_msg
import json

json_path = (
    "dongguk_film/static/json/equipment.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/equipment.json"
)

#
# Cron functions
#


def update_equipment_category_and_purpose(request):
    target_list = ["category", "purpose"]
    result_list = []

    for target in target_list:
        if target == "category":
            data = {
                "db_name": "equipment-category",
                "filter_property": [
                    "r%7C_%7B",  # Priority
                    "r%3EfD",  # Keyword
                ],
                "sort": [{"property": "Priority", "direction": "ascending"}],
            }
        elif target == "purpose":
            data = {
                "db_name": "equipment-purpose",
                "filter_property": [
                    "FW%7Cd",  # Priority
                    "DrOq",  # Keyword
                    "P%5Chp",  # Available up to n days in advance
                    "Gmx_",  # Available at least n days in advance
                    "axf%3E",  # Maximum rental duration
                ],
                "sort": [{"property": "Priority", "direction": "ascending"}],
            }

        item_list = notion("query", "db", data=data)
        result_list.append({target: item_list})

        with open(json_path, "r+") as f:
            data = json.load(f)
            data[target] = item_list
            f.seek(0)
            f.write(json.dumps(data, indent=4))
            f.truncate()

    send_msg(request, "UEQ", "DEV", result_list)

    return HttpResponse(f"Updated category and purpose: {result_list}")


#
# Main functions
#


def get_equipment_category_or_purpose(category_or_purpose: str):
    with open(json_path, "r") as f:
        item_list = json.load(f)[category_or_purpose]
        f.close()

    return item_list
