from django.urls import path
from .utils import *

app_name = "utility"
urlpatterns = [
    # utils.py
    path("utils/update-dmd-cookie/", update_dmd_cookie, name="update_dmd_cookie"),
    path("utils/update-hero-img/", update_hero_img, name="update_hero_img"),
]
