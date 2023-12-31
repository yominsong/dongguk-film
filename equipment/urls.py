from django.urls import path
from . import views, utils


app_name = "equipment"
urlpatterns = [
    # views.py
    path("", views.equipment, name="equipment"),
    path("<str:page_id>", views.equipment_detail, name="equipment_detail"),
    # utils.py
    path("utils/update-equipment-category-and-purpose", utils.update_equipment_category_and_purpose, name="update_equipment_category_and_purpose"),
]
