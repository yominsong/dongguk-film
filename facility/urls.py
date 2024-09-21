from django.urls import path
from . import views

app_name = "facility"
urlpatterns = [
    # views.py
    path("", views.facility, name="facility"),
]
