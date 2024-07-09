from django.urls import path
from . import views, utils


app_name = "users"
urlpatterns = [
    # views.py
    path("", views.account, name="account"),
    # utils.py
    path("utils/delete-inactive-users/", utils.delete_inactive_users),
    path("utils/delete-expired-vcodes/", utils.delete_expired_vcodes),
    path("utils/verify-authentication/", utils.verify_authentication),
    path("utils/pinpoint-user/", utils.pinpoint_user),
    path("utils/vcode/", utils.vcode),
    path("utils/account/", utils.account),
]
