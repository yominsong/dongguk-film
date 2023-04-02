from django.urls import path
from .utils import *

app_name = "utility"
urlpatterns = [
    # utils.py
    path("utils/update-dmd-cookie", update_dmd_cookie, name="update_dmd_cookie"),
    path("utils/ai", ai, name="ai"),
]
