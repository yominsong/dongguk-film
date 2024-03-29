from django.contrib.auth.models import User
from django.db import models


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    student_id = models.CharField(("학번"), max_length=10, null=True, blank=True)
    purpose_priority = models.CharField(("목적"), max_length=1, null=True, blank=True)
    period = models.CharField(("기간"), max_length=5, null=True, blank=True)
    equipment = models.JSONField(("기자재"), null=True, blank=True)
    will_expire_on = models.DateTimeField(("만료 예정 일시"), null=True, blank=True)

    class Meta:
        verbose_name = "장바구니"
        verbose_name_plural = "장바구니들"
