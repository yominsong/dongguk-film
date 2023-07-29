from django.contrib.auth.models import User
from django.db import models


class Notice(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    title = models.CharField("Title", max_length=200)

    class Meta:
        verbose_name = "공지사항"
        verbose_name_plural = "공지사항(들)"
