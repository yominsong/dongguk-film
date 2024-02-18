from django.urls import path
from . import views, utils


app_name = "project"
urlpatterns = [
    # views.py
    path("", views.project, name="project"),
    # utils.py
    path(
        "utils/update-project-position/",
        utils.update_project_position,
        name="update_project_position",
    ),
    path("utils/project/", utils.project),
]
