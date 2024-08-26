from django.urls import path
from . import views, utils


app_name = "equipment"
urlpatterns = [
    # views.py
    path("", views.equipment, name="equipment"),
    path("<str:collection_id>/", views.equipment_detail, name="equipment_detail"),
    # utils.py
    path("utils/sync-equipment-data/", utils.sync_equipment_data, name="sync_equipment_data"),
    path("utils/equipment/", utils.equipment),
]
