from django.urls import path
from .views import *
from .utils import *


app_name = "users"
urlpatterns = [
    # utils.py
    path(
        "utils/delete-inactive-users",
        delete_inactive_users,
        name="delete_inactive_users",
    ),
    path("utils/vcode", vcode, name="vcode"),
]
