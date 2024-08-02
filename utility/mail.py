from django.conf import settings
from django.core.mail import send_mail as django_send_mail
from django.template.loader import render_to_string
from .hangul import handle_hangul

EMAIL_HOST_USER = getattr(settings, "EMAIL_HOST_USER", "EMAIL_HOST_USER")

#
# Main functions
#


def send_mail(data):
    """
    - type | `str`:
        - IDENTITY_VERIFICATION_REQUIRED
        - ADL: Automatically delete account
        - MDL: Manually delete account
    """

    type = data["type"]

    # type: "IDENTITY_VERIFICATION_REQUIRED"
    if type == "IDENTITY_VERIFICATION_REQUIRED":
        email = data["email"]
        content = data["email_content"]

        subject = "[디닷에프] 이메일 주소를 인증해주세요!"
        message = f'회원가입 페이지에서 {handle_hangul(content, "을를", True)} 입력해주세요.'
        from_email = EMAIL_HOST_USER
        recipient_list = [email]
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": "이메일 주소를 인증해주세요!",
                "body": "회원가입 페이지에서 아래 인증번호를 입력해주세요.",
                "highlighted": content,
            },
        )

    # type: "ADL"
    elif type == "ADL":
        email = data["email"]
        student_id = data["content"]["student_id"]

        subject = "[디닷에프] 계정이 안전하게 삭제되었어요!"
        message = f'30일 간 로그인 이력이 없어 자동으로 삭제되었어요.'
        from_email = EMAIL_HOST_USER
        recipient_list = [email]
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": "계정이 안전하게 삭제되었어요!",
                "body": "아래 학번의 계정이 30일 간 로그인 이력 부재로 자동으로 삭제되었어요.",
                "highlighted": student_id,
                "conclusion": "디닷에프를 이용하시려면 다시 회원가입 해주세요.\n고맙습니다. 🙇",
            },
        )

    # type: "MDL"

    response = django_send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=recipient_list,
        html_message=html_message,
    )

    return response
