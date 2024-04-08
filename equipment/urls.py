from django.urls import path
from . import views, utils


app_name = "equipment"
urlpatterns = [
    # views.py
    path("", views.equipment, name="equipment"),
    path("<str:collection_id>/", views.equipment_detail, name="equipment_detail"),
    # utils.py
    path("utils/synchronize-equipment-data/", utils.synchronize_equipment_data, name="synchronize_equipment_data"),
    path("utils/delete-expired-carts/", utils.delete_expired_carts, name="delete_expired_carts"),
    path("utils/equipment/", utils.equipment),
]
