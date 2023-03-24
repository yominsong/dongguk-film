from django.urls import path
from .views import *


app_name = "dflink"
urlpatterns = [
    path("", dflink, name="dflink"),
]
