from django.urls import path
from . import views, utils


app_name = "dflink"
urlpatterns = [
    # views.py
    path("", views.dflink, name="dflink"),
    # utils.py
    path("utils/dflink", utils.dflink),
]
