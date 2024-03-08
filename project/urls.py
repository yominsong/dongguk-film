from django.urls import path
from . import views, utils


app_name = "project"
urlpatterns = [
    # views.py
    path("", views.project, name="project"),
    # utils.py
    path(
        "utils/update-project-policy/",
        utils.update_project_policy,
        name="update_project_policy",
    ),
    path("utils/project/", utils.project),
]
