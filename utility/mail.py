import os, sys

sys.path.append(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))

from dongguk_film import settings
from django.core.mail import send_mail as django_send_mail
from django.template.loader import render_to_string
from .hangul import handle_hangul

EMAIL_HOST_USER = getattr(settings, "EMAIL_HOST_USER", "EMAIL_HOST_USER")

#
# Main functions
#


def send_mail(data):
    """
    type: "SNP"

    SNP: Sign up
    """

    type = data["type"]

    # type: "SNP"
    if type == "SNP":
        email_vcode = data["content"]["email_vcode"]
        subject = "[디닷에프] 이메일 주소를 인증해주세요!"
        message = f'회원가입 페이지에서 {handle_hangul(email_vcode, "을를", True)} 입력해주세요.'
        from_email = EMAIL_HOST_USER
        recipient_list = [data["email"]]
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": "이메일 주소를 인증해주세요!",
                "body": "회원가입 페이지에서 아래 인증번호를 입력해주세요.",
                "highlighted": email_vcode,
            },
        )
    
    response = django_send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=recipient_list,
        html_message=html_message,
    )

    return response
