from django.urls import path
from . import views, utils


app_name = "equipment"
urlpatterns = [
    # views.py
    path("", views.equipment, name="equipment"),
    # utils.py
    path("utils/update-equipment-category-and-policy", utils.update_equipment_category_and_policy, name="update_equipment_category_and_policy"),
]
