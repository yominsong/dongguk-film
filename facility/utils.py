from django.http import JsonResponse
from utility.utils import airtable, get_holiday


#
# Main functions
#


def facility(request):
    id = request.POST.get("id")

    if id == "find_facility_request":
        first_day = request.POST.get("firstDay")
        last_day = request.POST.get("lastDay")
        formula = f"AND({{Start datetime}} <= DATETIME_PARSE('{last_day} 23:59:59', 'YYYY-MM-DD HH:mm:ss'),{{End datetime}} >= DATETIME_PARSE('{first_day}', 'YYYY-MM-DD'))"

        data = {
            "table_name": "facility-request",
            "params": {"formula": formula},
        }

        found_facility_request_list = airtable("get_all", "records", data, mask=True)
            
        if len(found_facility_request_list) > 0:
            status = "DONE"
            reason = None
        else:
            status = "FAIL"
            reason = "NO_FACILITY_REQUEST_FOUND"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "found_facility_request_list": found_facility_request_list,
        }
    
    elif id == "find_holiday":
        found_holiday_list = get_holiday()

        if len(found_holiday_list) > 0:
            status = "DONE"
            reason = None
        else:
            status = "FAIL"
            reason = "NO_HOLIDAY_FOUND"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "found_holiday_list": found_holiday_list,
        }

    return JsonResponse(response)
