from django.http import JsonResponse
from utility.utils import airtable, get_holiday


#
# Sub functions
#


def update_status(record_id, status):
    data = {
        "table_name": "facility-request",
        "params": {"record_id": record_id},
    }

    equipment_request = airtable("get", "record", data)
    public_id = equipment_request["public_id"]
    private_id = equipment_request["private_id"]

    fields = {
        "Status": status
    }  # The values of these fields are changed through automation in Airtable: "Start equipment hour", "End equipment hour", "Equipment item", "Approved time", "Started time", "Completed time", "Canceled time", "Rejected time"

    data = {
        "table_name": "facility-request",
        "params": {
            "record_id": record_id,
            "fields": fields,
        },
    }

    response = airtable("update", "record", data)
    is_updated = response.get("id", False)

    def get_status_in_korean_and_emoji(status):
        status_in_korean = {
            "Approved": "확정",
            "In Progress": "사용 시작 처리",
            "Completed": "사용 종료 처리",
            "Canceled": "취소",
            "Rejected": "반려",
        }

        emoji = {
            "Approved": "👍",
            "In Progress": "👍",
            "Completed": "👍",
            "Canceled": "🗑️",
            "Rejected": "🗑️",
        }

        return status_in_korean[status], emoji[status]

    status_in_korean, emoji = get_status_in_korean_and_emoji(status)

    if is_updated:
        status = "DONE"
        reason = "NOTHING_UNUSUAL"
        msg = f"예약이 {status_in_korean}되었어요! {emoji}"
    else:
        status = "FAIL"
        reason = response
        msg = "앗, 알 수 없는 오류가 발생했어요!"

    return {
        "status": status,
        "reason": reason,
        "msg": msg,
        "public_id": public_id,
        "private_id": private_id,
    }


#
# Main functions
#


def facility(request):
    id = request.POST.get("id")
    record_id = request.POST.get("recordId")
    response = {}

    # id: find_facility_request
    if id == "find_facility_request":
        earliest_date = request.POST.get("earliestDate")
        latest_date = request.POST.get("latestDate")
        formula = f"AND(DATESTR({{Start datetime}}) <= '{latest_date}', DATESTR({{End datetime}}) >= '{earliest_date}')"

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
            "status": status,
            "reason": reason,
            "found_facility_request_list": found_facility_request_list,
        }

    # id: find_holiday
    elif id == "find_holiday":
        found_holiday_list = get_holiday()

        if len(found_holiday_list) > 0:
            status = "DONE"
            reason = None
        else:
            status = "FAIL"
            reason = "NO_HOLIDAY_FOUND"

        response = {
            "status": status,
            "reason": reason,
            "found_holiday_list": found_holiday_list,
        }

    # id: update_status_to_approved
    elif id == "update_status_to_approved":
        response = update_status(record_id, "Approved")

    # id: update_status_to_in_progress
    elif id == "update_status_to_in_progress":
        response = update_status(record_id, "In Progress")

    # id: update_status_to_completed
    elif id == "update_status_to_completed":
        response = update_status(record_id, "Completed")

    # id: update_status_to_canceled
    elif id == "update_status_to_canceled":
        response = update_status(record_id, "Canceled")

    # id: update_status_to_rejected
    elif id == "update_status_to_rejected":
        response = update_status(record_id, "Rejected")
    
    response["id"] = id

    return JsonResponse(response)
