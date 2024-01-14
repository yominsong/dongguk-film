from django.contrib import admin
from .models import *


@admin.register(RentalApplication)
class RentalApplicationAdmin(admin.ModelAdmin):
    list_display = ("student_id", "purpose_priority", "equipment")
    list_display_links = ("student_id", "purpose_priority", "equipment")
    search_fields = ("student_id", "purpose_priority", "equipment")