from django.urls import path
from .views import *
from .utils import *


app_name = "users"
urlpatterns = [
    # views.py
    path("", account, name="account"),
    # utils.py
    path("utils/delete-inactive-users/", delete_inactive_users),
    path("utils/delete-expired-vcodes/", delete_expired_vcodes),
    path("utils/vcode/", vcode),
    path("utils/verify-authentication/", verify_authentication),
    path("utils/pinpoint-user/", pinpoint_user),
]
