from django.urls import path
from . import views


app_name = "project"
urlpatterns = [
    # views.py
    path("", views.project, name="project"),
]
