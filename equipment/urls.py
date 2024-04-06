from django.urls import path
from . import views, utils


app_name = "equipment"
urlpatterns = [
    # views.py
    path("", views.equipment, name="equipment"),
    path("<str:collection_id>/", views.equipment_detail, name="equipment_detail"),
    # utils.py
    path("utils/update-equipment-policy/", utils.update_equipment_policy, name="update_equipment_policy"),
    path("utils/delete-expired-carts/", utils.delete_expired_carts, name="delete_expired_carts"),
    path("utils/equipment/", utils.equipment),
]
