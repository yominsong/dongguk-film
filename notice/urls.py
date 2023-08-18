from django.urls import path
from . import views, utils


app_name = "notice"
urlpatterns = [
    # views.py
    path("", views.notice, name="notice"),
    # utils.py
    path("utils/notice", utils.notice),
]
