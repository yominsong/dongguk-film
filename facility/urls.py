from django.urls import path
from . import views, utils

app_name = "facility"
urlpatterns = [
    # views.py
    path("", views.facility, name="facility"),
    # utils.py
    path("utils/facility/", utils.facility),
]
