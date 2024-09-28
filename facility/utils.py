from django.http import JsonResponse
from utility.utils import airtable, get_holiday


#
# Main functions
#


def facility(request):
    id = request.POST.get("id")
    record_id = request.POST.get("recordId")

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
            "id": id,
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
            "id": id,
            "status": status,
            "reason": reason,
            "found_holiday_list": found_holiday_list,
        }

    # id: update_status_to_approved
    elif id == "update_status_to_approved":
        data = {
            "table_name": "facility-request",
            "params": {"record_id": record_id},
        }

        equipment_request = airtable("get", "record", data)
        public_id = equipment_request["public_id"]
        private_id = equipment_request["private_id"]

        fields = {
            "Status": "Approved"
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

        if is_updated:
            status = "DONE"
            reason = "NOTHING_UNUSUAL"
            msg = "예약이 확정되었어요! 👍"
        else:
            status = "FAIL"
            reason = response
            msg = "앗, 알 수 없는 오류가 발생했어요!"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "public_id": public_id,
            "private_id": private_id,
        }
    
    # id: update_status_to_rejected
    elif id == "update_status_to_rejected":
        data = {
            "table_name": "facility-request",
            "params": {"record_id": record_id},
        }

        equipment_request = airtable("get", "record", data)
        public_id = equipment_request["public_id"]
        private_id = equipment_request["private_id"]

        fields = {
            "Status": "Rejected"
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

        if is_updated:
            status = "DONE"
            reason = "NOTHING_UNUSUAL"
            msg = "예약이 반려되었어요! 🗑️"
        else:
            status = "FAIL"
            reason = response
            msg = "앗, 알 수 없는 오류가 발생했어요!"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "public_id": public_id,
            "private_id": private_id,
        }
    
    # id: update_status_to_in_progress
    elif id == "update_status_to_in_progress":
        data = {
            "table_name": "facility-request",
            "params": {"record_id": record_id},
        }

        equipment_request = airtable("get", "record", data)
        public_id = equipment_request["public_id"]
        private_id = equipment_request["private_id"]

        fields = {
            "Status": "In Progress"
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

        if is_updated:
            status = "DONE"
            reason = "NOTHING_UNUSUAL"
            msg = "해당 시설이 사용 시작 처리되었어요! 👍"
        else:
            status = "FAIL"
            reason = response
            msg = "앗, 알 수 없는 오류가 발생했어요!"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "public_id": public_id,
            "private_id": private_id,
        }
    
    # id: update_status_to_completed
    elif id == "update_status_to_completed":
        data = {
            "table_name": "facility-request",
            "params": {"record_id": record_id},
        }

        equipment_request = airtable("get", "record", data)
        public_id = equipment_request["public_id"]
        private_id = equipment_request["private_id"]

        fields = {
            "Status": "Completed"
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

        if is_updated:
            status = "DONE"
            reason = "NOTHING_UNUSUAL"
            msg = "해당 시설이 사용 종료 처리되었어요! 👍"
        else:
            status = "FAIL"
            reason = response
            msg = "앗, 알 수 없는 오류가 발생했어요!"

        response = {
            "id": id,
            "status": status,
            "reason": reason,
            "msg": msg,
            "public_id": public_id,
            "private_id": private_id,
        }

    return JsonResponse(response)
