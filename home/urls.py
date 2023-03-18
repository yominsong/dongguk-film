from django.urls import path
from .views import *
from .utils import *


app_name = "home"
urlpatterns = [
    path("", home, name="home"),
    path("home/utils/weather", weather, name="weather"),
]
