from django.urls import path
from . import views, utils

app_name = "workspace"
urlpatterns = [
    # views.py
    path("", views.workspace, name="workspace"),
    # utils.py
    path("utils/update-workspace-data/", utils.update_workspace_data, name="update_workspace_data"),
]
