from django.contrib.auth.models import User
from django.db import models
from django_ckeditor_5.fields import CKEditor5Field


class Notice(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    title = models.CharField("Title", max_length=200)
    text = CKEditor5Field("Text", config_name="extends")

    class Meta:
        verbose_name = "공지사항"
        verbose_name_plural = "공지사항(들)"
