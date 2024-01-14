from django.contrib.auth.models import User
from django.db import models


class RentalApplication(models.Model):
    student_id = models.CharField(("학번"), max_length=10, null=True, blank=True)
    purpose_priority = models.CharField(("목적 우선순위"), max_length=1, null=True, blank=True)
    equipment = models.JSONField(("기자재"))

    class Meta:
        verbose_name = "임차 신청서"
        verbose_name_plural = "임차 신청서들"