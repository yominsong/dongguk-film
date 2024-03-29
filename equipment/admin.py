from django.contrib import admin
from .models import *


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("student_id", "purpose_priority", "period", "equipment", "will_expire_on")
    list_display_links = ("student_id", "purpose_priority", "period", "equipment", "will_expire_on")
    search_fields = ("student_id", "purpose_priority", "period", "equipment", "will_expire_on")
