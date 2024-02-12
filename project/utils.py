from django.conf import settings
from django.http import HttpResponse
from utility.utils import airtable
from utility.msg import send_msg
import json

#
# Global variables
#

JSON_PATH = (
    "dongguk_film/static/json/project.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/project.json"
)

#
# Cron functions
#


def update_project_position(request):
    data = {
        "table_name": "project-position",
        "params": {
            "view": "Grid view",
            "fields": ["Function", "Function priority", "Name", "Priority", "Keyword", "In English", "Note", "Required"],
        },
    }

    record_list = airtable("get_all", "records", data=data)
    result_list = record_list

    with open(JSON_PATH, "r+") as f:
        data = record_list
        f.seek(0)
        f.write(json.dumps(data, indent=4))
        f.truncate()
    
    send_msg(request, "UPP", "DEV", result_list)

    return HttpResponse(f"Updated project position: {result_list}")


#
# Main functions
#


def get_project_position():
    with open(JSON_PATH, "r") as f:
        item_list = json.load(f)
        f.close()

        return item_list