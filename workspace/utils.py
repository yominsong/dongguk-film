from django.conf import settings
from django.http import HttpResponse
from utility.utils import airtable
from utility.msg import send_msg
import json

#
# Global variables
#

JSON_PATH = (
    "dongguk_film/static/json/workspace.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/workspace.json"
)

#
# Cron functions
#


def update_workspace_data(request):
    data_list = []

    try:
        target_list = ["hour", "category", "purpose", "area"]

        for target in target_list:
            if target == "hour":
                data = {"table_name": "workspace-hour"}
            elif target == "category":
                data = {"table_name": "workspace-category"}
            elif target == "purpose":
                data = {"table_name": "workspace-purpose"}
            elif target == "area":
                data = {"table_name": "workspace-area"}

            record_list = airtable("get_all", "records", data)
            data_list.append({target: record_list})

            with open(JSON_PATH, "r+") as f:
                data = json.load(f)
                data[target] = record_list
                f.seek(0)
                f.write(json.dumps(data, indent=4))
                f.truncate()

        status = "DONE"
    except:
        status = "FAIL"

    data = {
        "status": status,
        "data_list": data_list,
    }

    send_msg(request, "UPDATE_WORKSPACE_DATA", "DEV", data)
    json_data = json.dumps(data, indent=4)

    return HttpResponse(json_data, content_type="application/json")
