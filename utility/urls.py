from django.urls import path
from .utils import *

app_name = "utility"
urlpatterns = [
    # utils.py
    path("utils/send-facility-request-status-update/", send_facility_request_status_update, name="send_facility_request_status_update"),
    path("utils/remind-facility-use-start/", remind_facility_use_start, name="remind_facility_use_start"),
    path("utils/remind-facility-use-end/", remind_facility_use_end, name="remind_facility_use_end"),
    path("utils/warn-facility-request-not-processed/", warn_facility_request_not_processed, name="warn_facility_request_not_processed"),
    path("utils/warn-facility-use-start-delay/", warn_facility_use_start_delay, name="warn_facility_use_start_delay"),
    path("utils/warn-facility-use-end-delay/", warn_facility_use_end_delay, name="warn_facility_use_end_delay"),
    path("utils/update-subject/", update_subject, name="update_subject"),
    path("utils/update-dnd-cookie/", update_dnd_cookie, name="update_dnd_cookie"),
    path("utils/update-hero-img/", update_hero_img, name="update_hero_img"),
    path("utils/update-holiday/", update_holiday, name="update_holiday"),
]
