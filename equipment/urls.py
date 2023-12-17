from django.urls import path
from . import views


app_name = "equipment"
urlpatterns = [
    # views.py
    path("", views.equipment, name="equipment"),
]
