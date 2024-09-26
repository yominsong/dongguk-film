from django.http import JsonResponse
from utility.utils import airtable, get_holiday


#
# Main functions
#


def facility(request):
    id = request.POST.get("id")

    if id == "find_facility_request":
        year = request.POST.get("year")
        month = request.POST.get("month")
        formula = f"OR(AND(YEAR({{Start datetime}}) = {year}, MONTH({{Start datetime}}) = {month}), AND(YEAR({{End datetime}}) = {year}, MONTH({{End datetime}}) = {month}))"

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
