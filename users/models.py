from django.contrib.auth.models import User
from django.db import models


class Metadata(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    student_id = models.CharField(("학번"), max_length=10, null=True, blank=True)
    name = models.CharField(("성명"), max_length=150, null=True, blank=True)
    phone = models.CharField(("휴대전화 번호"), max_length=13, null=True, blank=True)

    class Meta:
        verbose_name = "사용자 추가 정보"
        verbose_name_plural = "사용자 추가 정보들"


class Vcode(models.Model):
    student_id = models.CharField(("학번"), max_length=10, null=True, blank=True)
    email_vcode = models.CharField(("이메일 인증번호"), max_length=6, null=True, blank=True)
    phone_vcode = models.CharField(
        ("휴대전화 번호 인증번호"), max_length=6, null=True, blank=True
    )
    confirmed = models.BooleanField(("인증 여부"), default=False)
    will_expire_on = models.DateTimeField(("만료 예정 일시"), null=True, blank=True)

    class Meta:
        verbose_name = "인증번호"
        verbose_name_plural = "인증번호들"
