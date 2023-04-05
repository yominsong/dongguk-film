from django.urls import path
from .views import *
from .utils import *


app_name = "dflink"
urlpatterns = [
    # views.py
    path("", dflink, name="dflink"),
    # utils.py
    path("utils/branded_link", branded_link, name="branded_link"),
]
