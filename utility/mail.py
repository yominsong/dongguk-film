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
        - INACTIVE_USER_AUTO_DELETED
        - FACILITY_REQUEST_CREATED
        - FACILITY_REQUEST_APPROVED
        - FACILITY_REQUEST_CANCELED
        - FACILITY_REQUEST_REJECTED
    """

    type = data["type"]
    email = data["email"]
    content = data["content"]

    # type: "IDENTITY_VERIFICATION_REQUIRED"
    if type == "IDENTITY_VERIFICATION_REQUIRED":
        target = content["target"]
        email_vcode = content["email_vcode"]
        subject = "[디닷에프] 이메일 주소를 인증해주세요."
        message = f'{target}에서 {handle_hangul(email_vcode, "을를", True)} 입력해주세요.'
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": "이메일 주소를 인증해주세요.",
                "body": f"{target}에서 다음 인증번호를 입력해주세요.",
                "highlighted": email_vcode,
            },
        )

    # type: "INACTIVE_USER_AUTO_DELETED"
    elif type == "INACTIVE_USER_AUTO_DELETED":
        student_id = content["student_id"]
        subject = "[디닷에프] 계정이 안전하게 삭제되었어요."
        message = "30일간 로그인 기록이 없어 자동으로 삭제되었어요."
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": "계정이 안전하게 삭제되었어요.",
                "body": "다음 학번의 계정이 30일간 로그인 기록 부재로 자동 삭제되었어요.",
                "highlighted": student_id,
                "conclusion": "디닷에프를 다시 이용하려면 아래 버튼을 눌러 재가입해주세요. 감사합니다. 🙇",
                "button": {
                    "text": "디닷에프 재가입하기",
                    "url": f"https://dongguk.film/accounts/login/",
                },
            },
        )

    # type: "FACILITY_REQUEST_CREATED"
    elif type == "FACILITY_REQUEST_CREATED":
        is_for_instructor = content.get("is_for_instructor", False)
        type = "교과목" if is_for_instructor else "프로젝트"
        name_of_subject_or_project = content["name_of_subject_or_project"]
        facility_category = content["facility_category"]
        subject = f"[디닷에프] {facility_category} 예약 신청이 완료되었어요."
        message = f"내 계정 페이지에서 세부 사항을 확인해보세요."
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": f"{facility_category} 예약 신청이 완료되었어요.",
                "body": f"다음 {type}의 {facility_category} 예약 신청이 완료되었어요.",
                "highlighted": name_of_subject_or_project,
                "conclusion": "아래 버튼을 눌러 세부 사항을 확인해보세요.",
                "button": {
                    "text": "내 시설예약 보기",
                    "url": f"https://dongguk.film/account",
                },
            },
        )
    
    # type: "FACILITY_REQUEST_APPROVED"
    elif type == "FACILITY_REQUEST_APPROVED":
        is_for_instructor = content.get("is_for_instructor", False)
        type = "교과목" if is_for_instructor else "프로젝트"
        name_of_subject_or_project = content["name_of_subject_or_project"]
        facility_category = content["facility_category"]
        subject = f"[디닷에프] {facility_category} 예약이 확정되었어요."
        message = f"내 계정 페이지에서 세부 사항을 확인해보세요."
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": f"{facility_category} 예약이 확정되었어요.",
                "body": f"다음 {type}의 {facility_category} 예약이 확정되었어요.",
                "highlighted": name_of_subject_or_project,
                "conclusion": "아래 버튼을 눌러 세부 사항을 확인해보세요.",
                "button": {
                    "text": "내 시설예약 보기",
                    "url": f"https://dongguk.film/account",
                },
            },
        )
    
    # type: "FACILITY_REQUEST_CANCELED"
    elif type == "FACILITY_REQUEST_CANCELED":
        is_for_instructor = content.get("is_for_instructor", False)
        type = "교과목" if is_for_instructor else "프로젝트"
        name_of_subject_or_project = content["name_of_subject_or_project"]
        facility_category = content["facility_category"]
        subject = f"[디닷에프] {facility_category} 예약이 취소되었어요."
        message = f"내 계정 페이지에서 세부 사항을 확인해보세요."
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": f"{facility_category} 예약이 취소되었어요.",
                "body": f"다음 {type}의 {facility_category} 예약이 취소되었어요.",
                "highlighted": name_of_subject_or_project,
                "conclusion": "아래 버튼을 눌러 세부 사항을 확인해보세요.",
                "button": {
                    "text": "내 시설예약 보기",
                    "url": f"https://dongguk.film/account",
                },
            },
        )
    
    # type: "FACILITY_REQUEST_REJECTED"
    elif type == "FACILITY_REQUEST_REJECTED":
        is_for_instructor = content.get("is_for_instructor", False)
        type = "교과목" if is_for_instructor else "프로젝트"
        name_of_subject_or_project = content["name_of_subject_or_project"]
        facility_category = content["facility_category"]
        subject = f"[디닷에프] {facility_category} 예약이 반려되었어요."
        message = f"내 계정 페이지에서 세부 사항을 확인해보세요."
        html_message = render_to_string(
            "mail_base.html",
            {
                "title": f"{facility_category} 예약이 반려되었어요.",
                "body": f"다음 {type}의 {facility_category} 예약이 반려되었어요.",
                "highlighted": name_of_subject_or_project,
                "conclusion": "아래 버튼을 눌러 세부 사항을 확인해보세요.",
                "button": {
                    "text": "내 시설예약 보기",
                    "url": f"https://dongguk.film/account",
                },
            },
        )

    from_email = EMAIL_HOST_USER
    recipient_list = [email]

    response = django_send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=recipient_list,
        html_message=html_message,
    )

    return response
