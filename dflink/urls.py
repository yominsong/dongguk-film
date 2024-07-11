from django.urls import path
from . import views, utils


app_name = "dflink"
urlpatterns = [
    # views.py
    path("", views.dflink, name="dflink"),
    # utils.py
    path("utils/delete-expired-dflink/", utils.delete_expired_dflink),
    path("utils/dflink/", utils.dflink),
]
