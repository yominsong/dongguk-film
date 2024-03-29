from django.urls import path
from . import views, utils


app_name = "notice"
urlpatterns = [
    # views.py
    path("", views.notice, name="notice"),
    path("<str:notice_id>/", views.notice_detail, name="notice_detail"),
    # utils.py
    path("utils/notice/", utils.notice),
]
