from django.urls import path
from .views import *
from .utils import *


app_name = "users"
urlpatterns = [
    path("utils/vcode", vcode, name="vcode"),
]
