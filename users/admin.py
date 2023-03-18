from django.contrib import admin
from .models import *


@admin.register(Metadata)
class MetadataAdmin(admin.ModelAdmin):
    list_display = ("user", "student_id", "name", "phone")
    list_display_links = ("user", "student_id", "name", "phone")
    search_fields = ("user", "student_id", "name", "phone")


@admin.register(Vcode)
class VcodeAdmin(admin.ModelAdmin):
    list_display = (
        "student_id",
        "email_vcode",
        "phone_vcode",
        "will_expire_on",
    )
    list_display_links = (
        "student_id",
        "email_vcode",
        "phone_vcode",
        "will_expire_on",
    )
    search_fields = (
        "student_id",
        "email_vcode",
        "phone_vcode",
        "will_expire_on",
    )
