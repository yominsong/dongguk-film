from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
import discord
from discord import SyncWebhook


DISCORD_MGT_WEBHOOK_URL = getattr(
    settings, "DISCORD_MGT_WEBHOOK_URL", "DISCORD_MGT_WEBHOOK_URL"
)

DISCORD_DEV_WEBHOOK_URL = getattr(
    settings, "DISCORD_DEV_WEBHOOK_URL", "DISCORD_DEV_WEBHOOK_URL"
)

#
# Sub functions
#


def get_safe_value(func, default="Unknown"):
    try:
        return func()
    except Exception:
        return default


def format_msg(content: dict):
    target = content["target"]
    important = content["important"]
    palette = discord.Color
    color = palette.red() if important else palette.dark_gray()

    embed = discord.Embed(
        title=content["title"],
        url=content["url"],
        description=content["description"],
        color=color,
    )

    embed.set_author(
        name=content["name"],
        url=content["author_url"],
        icon_url=content["picture_url"],
    )

    embed.set_thumbnail(url=content["thumbnail_url"])

    if target == "DEV":
        embed.add_field(
            name="Sec-Ch-Ua-Platform",
            value=content["sec-ch-ua-platform"],
            inline=True,
        )

        embed.add_field(name="Content-Type", value=content["content_type"], inline=True)
        embed.add_field(name="User-Agent", value=content["user_agent"], inline=False)
        embed.add_field(name="Referer", value=content["referer"], inline=True)
        embed.add_field(name="Method", value=content["method"], inline=True)
        embed.add_field(name="User-Auth", value=content["user_auth"], inline=True)
        embed.add_field(name="Full-Path", value=content["full_path"], inline=False)

    embed.set_footer(text=content["footer"])

    return embed


def get_webhook(channel: str):
    """
    - channel | `str`:
        - DEV: Development
        - MGT: Management
    """

    # channel: "DEV"
    if channel == "DEV":
        webhook_url = DISCORD_DEV_WEBHOOK_URL

    # channel: "MGT"
    elif channel == "MGT":
        webhook_url = DISCORD_MGT_WEBHOOK_URL

    webhook = SyncWebhook.from_url(webhook_url)

    return webhook


#
# Main functions
#


def send_msg(request, msg_type: str, channel: str, data: dict = None):
    """
    - request | `HttpRequest`
    - msg_type | `str`:
        - UPDATE_DMD_COOKIE
        - UPDATE_HERO_IMAGE
        - SYNC_EQUIPMENT_DATA
        - UPDATE_PROJECT_POLICY
        - DUPLICATE_SIGNUP_ATTEMPTED
        - IDENTIFY_VERIFICATION_BYPASS_ATTEMPTED
        - UNEXPECTED_REQUEST_OCCURRED
        - SIGNUP_COMPLETED
        - EXPIRED_VCODE_AUTO_DELETED
        - INACTIVE_USER_AUTO_DELETED
        - USER_DELETED
        - CREATE_FACILITY_REQUEST
        - FACILITY_REQUEST_NOT_PROCESSED
        - APPROVE_FACILITY_REQUEST
        - FACILITY_USE_START_DELAYED
        - FACILITY_USE_END_DELAYED
        - CANCEL_FACILITY_REQUEST
        - REJECT_FACILITY_REQUEST
        - CREATE_PROJECT
        - UPDATE_PROJECT
        - DELETE_PROJECT
        - CREATE_DFLINK
        - UPDATE_DFLINK
        - DELETE_DFLINK
        - DELETE_EXPIRED_DFLINK
        - CREATE_NOTICE
        - UPDATE_NOTICE
        - DELETE_NOTICE
        - TEST
    - channel | `str`:
        - DEV: Development
        - MGT: Management
    - data | `Any` | optional
    """

    success_emoji = "✅"
    failure_emoji = "❌"
    warning_emoji = "⚠️"

    if data is not None:
        status = data.get("status", None)
        status_emoji = success_emoji if status == "DONE" else failure_emoji
        status_in_kor = "완료" if status == "DONE" else "실패"

    webhook = get_webhook(channel)
    default_picture_url = "https://dongguk.film/static/images/d_dot_f_logo.jpg"

    # msg_type: "UPDATE_DMD_COOKIE"
    if msg_type == "UPDATE_DMD_COOKIE":
        cookie = data.get("cookie", "")

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} DMD 쿠키 업데이트 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": cookie,
        }

    # msg_type: "UPDATE_HERO_IMAGE"
    elif msg_type == "UPDATE_HERO_IMAGE":
        img_list = data.get("img_list", {})
        app_name_list = ["home", "equipment", "project", "dflink", "notice", "account"]
        data_info = "ㆍ" + "\nㆍ".join(
            f"[{app_name}] {len(img_list.get(app_name, []))}개 이미지"
            for app_name in app_name_list
        )

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} Hero 이미지 업데이트 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": data_info,
        }

    # msg_type: "SYNC_EQUIPMENT_DATA"
    elif msg_type == "SYNC_EQUIPMENT_DATA":
        data_list = data.get("data_list", [])
        data_info = ""

        for i, item in enumerate(data_list[0]["category"]):
            new_line = f"\nㆍ[범주] {item['priority']} {item['keyword']}"
            new_line.replace("\n", "") if i == 0 else None
            data_info += new_line

        for i, item in enumerate(data_list[1]["purpose"]):
            new_line = f"\nㆍ[목적] {item['priority']} {item['keyword']}: {item['in_a_nutshell']}"
            data_info += new_line

        data_info += f"\nㆍ[한도] {len(data_list[2]['limit'])}개"
        data_info += f"\nㆍ[시간] {len(data_list[4]['hour'])}개"

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} 기자재 데이터 동기화 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": data_info,
        }

    # msg_type: "UPDATE_PROJECT_POLICY"
    elif msg_type == "UPDATE_PROJECT_POLICY":
        data_list = data.get("data_list", [])
        data_info = ""

        for i, item in enumerate(data_list[0]["position"]):
            new_line = f"\nㆍ[담당] {item['function']} | {item['keyword']}{'(' + item['note'] + ')' if item['note'] is not None else ''} {item['in_english']}"
            new_line.replace("\n", "") if i == 0 else None
            data_info += new_line

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} 프로젝트 정책 업데이트 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": data_info,
        }

    # msg_type: "DUPLICATE_SIGNUP_ATTEMPTED"
    elif msg_type == "DUPLICATE_SIGNUP_ATTEMPTED":
        content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{warning_emoji} 중복 회원가입 시도 발생",
            "url": "",
            "thumbnail_url": "",
            "description": "사용자가 이미 회원가입을 완료한 다른 사용자의 학번 및 성명을 입력한 것 같습니다.",
        }

    # msg_type: "IDENTIFY_VERIFICATION_BYPASS_ATTEMPTED"
    elif msg_type == "IDENTIFY_VERIFICATION_BYPASS_ATTEMPTED":
        content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{warning_emoji} 본인인증 생략 시도 발생",
            "url": "",
            "thumbnail_url": "",
            "description": "사용자가 비정상적인 방법으로 회원가입을 시도하는 것 같습니다.",
        }

    # msg_type: "UNEXPECTED_REQUEST_OCCURRED"
    elif msg_type == "UNEXPECTED_REQUEST_OCCURRED":
        content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{warning_emoji} 예기치 않은 요청 발생",
            "url": "",
            "thumbnail_url": "",
            "description": "사용자가 예기치 않은 방법으로 서비스를 이용하는 것 같습니다.",
        }

    # msg_type: "SIGNUP_COMPLETED"
    elif msg_type == "SIGNUP_COMPLETED":
        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{success_emoji} 사용자 계정 생성 완료",
            "url": "",
            "thumbnail_url": "",
            "description": f"현 기준 사용자는 {User.objects.count() + 1}명입니다.",
        }

    # msg_type: "EXPIRED_VCODE_AUTO_DELETED"
    elif msg_type == "EXPIRED_VCODE_AUTO_DELETED":
        expired_vcode_list = data.get("expired_vcode_list", [])
        expired_vcode_count = len(expired_vcode_list)
        data_info = ""

        for i in range(expired_vcode_count):
            new_line = f"\nㆍ[E] {expired_vcode_list[i]['email_vcode']}, [P] {expired_vcode_list[i]['phone_vcode']}"
            new_line.replace("\n", "") if i == 0 else None
            data_info += new_line

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{success_emoji} 만료된 인증번호 {expired_vcode_count}개 삭제 완료",
            "url": "",
            "thumbnail_url": "",
            "description": data_info,
        }

    # msg_type: "INACTIVE_USER_AUTO_DELETED"
    elif msg_type == "INACTIVE_USER_AUTO_DELETED":
        inactive_user_count = int(data.get("inactive_user_count", 0))

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{success_emoji} 비활성 사용자 계정 {inactive_user_count}개 삭제 완료",
            "url": "",
            "thumbnail_url": "",
            "description": f"현 기준 사용자는 {User.objects.count() - inactive_user_count}명입니다.",
        }

    # msg_type: "USER_DELETED"
    elif msg_type == "USER_DELETED":
        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{success_emoji} 사용자 계정 삭제 완료",
            "url": "",
            "thumbnail_url": "",
            "description": f"현 기준 사용자는 {User.objects.count() - 1}명입니다.",
        }

    # msg_type: "CREATE_FACILITY_REQUEST"
    elif msg_type == "CREATE_FACILITY_REQUEST":
        reason = data.get("reason", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = (
                f"https://docs.google.com/document/d/{public_id}"
            )
            private_url = (
                f"https://docs.google.com/document/d/{private_id}"
            )

        unavailable_item_list = data.get("unavailable_item_list", [])
        description = f"ㆍ{status_in_kor} 이유: {reason}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        if len(unavailable_item_list) > 0:
            description += f"\nㆍ사용 불가 시설: {unavailable_item_list}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 시설예약 신청 {status_in_kor}",
            "url": "https://dongguk.film/equipment",
            "thumbnail_url": "",
            "description": description,
        }
    
    # msg_type: "FACILITY_REQUEST_NOT_PROCESSED"
    elif msg_type == "FACILITY_REQUEST_NOT_PROCESSED":
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = (
                f"https://docs.google.com/document/d/{public_id}"
            )
            private_url = (
                f"https://docs.google.com/document/d/{private_id}"
            )

        description = f"ㆍ제안: 이 시설예약의 Status를 Approved 또는 Rejected 중 알맞은 것으로 변경하세요.\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{warning_emoji} 시설예약 확정 또는 반려 필요",
            "url": "https://dongguk.film/equipment",
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "APPROVE_FACILITY_REQUEST"
    elif msg_type == "APPROVE_FACILITY_REQUEST":
        reason = data.get("reason", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = (
                f"https://docs.google.com/document/d/{public_id}"
            )
            private_url = (
                f"https://docs.google.com/document/d/{private_id}"
            )

        description = f"ㆍ{status_in_kor} 이유: {reason}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 시설예약 확정 {status_in_kor}",
            "url": "https://dongguk.film/equipment",
            "thumbnail_url": "",
            "description": description,
        }
    
    # msg_type: "FACILITY_USE_START_DELAYED"
    elif msg_type == "FACILITY_USE_START_DELAYED":
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = (
                f"https://docs.google.com/document/d/{public_id}"
            )
            private_url = (
                f"https://docs.google.com/document/d/{private_id}"
            )

        description = f"ㆍ제안: 이 시설의 사용이 시작되었는지 확인 후 Status를 In Progress로 변경하세요.\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{warning_emoji} 시설 사용 시작 확인 필요",
            "url": "https://dongguk.film/equipment",
            "thumbnail_url": "",
            "description": description,
        }
    
    # msg_type: "FACILITY_USE_END_DELAYED"
    elif msg_type == "FACILITY_USE_END_DELAYED":
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = (
                f"https://docs.google.com/document/d/{public_id}"
            )
            private_url = (
                f"https://docs.google.com/document/d/{private_id}"
            )

        description = f"ㆍ제안: 이 시설의 사용이 종료되었는지 확인 후 Status를 Completed로 변경하세요.\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{warning_emoji} 시설 사용 종료 확인 필요",
            "url": "https://dongguk.film/equipment",
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "CANCEL_FACILITY_REQUEST"
    elif msg_type == "CANCEL_FACILITY_REQUEST":
        reason = data.get("reason", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = (
                f"https://docs.google.com/document/d/{public_id}"
            )
            private_url = (
                f"https://docs.google.com/document/d/{private_id}"
            )

        description = f"ㆍ{status_in_kor} 이유: {reason}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 시설예약 취소 {status_in_kor}",
            "url": "https://dongguk.film/equipment",
            "thumbnail_url": "",
            "description": description,
        }
    
    # msg_type: "REJECT_FACILITY_REQUEST"
    elif msg_type == "REJECT_FACILITY_REQUEST":
        reason = data.get("reason", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = (
                f"https://docs.google.com/document/d/{public_id}"
            )
            private_url = (
                f"https://docs.google.com/document/d/{private_id}"
            )

        description = f"ㆍ{status_in_kor} 이유: {reason}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 시설예약 반려 {status_in_kor}",
            "url": "https://dongguk.film/equipment",
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "CREATE_PROJECT"
    elif msg_type == "CREATE_PROJECT":
        reason = data.get("reason", "Unknown")
        title = data.get("title", "Unknown")
        purpose = data.get("purpose", "Unknown")
        subject_name = data.get("subject_name", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 프로젝트 등록 {status_in_kor}",
            "url": "https://dongguk.film/project",
            "thumbnail_url": "",
            "description": f"ㆍ{status_in_kor} 이유: {reason}\nㆍ작품 제목: {title}\nㆍ유형: {purpose}\nㆍ교과목: {subject_name}",
        }

    # msg_type: "UPDATE_PROJECT"
    elif msg_type == "UPDATE_PROJECT":
        reason = data.get("reason", "Unknown")
        title = data.get("title", "Unknown")
        purpose = data.get("purpose", "Unknown")
        subject_name = data.get("subject_name", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 프로젝트 수정 {status_in_kor}",
            "url": "https://dongguk.film/project",
            "thumbnail_url": "",
            "description": f"ㆍ{status_in_kor} 이유: {reason}\nㆍ작품 제목: {title}\nㆍ유형: {purpose}\nㆍ교과목: {subject_name}",
        }

    # msg_type: "DELETE_PROJECT"
    elif msg_type == "DELETE_PROJECT":
        reason = data.get("reason", "Unknown")
        title = data.get("title", "Unknown")
        purpose = data.get("purpose", "Unknown")
        subject_name = data.get("subject_name", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 프로젝트 삭제 {status_in_kor}",
            "url": "https://dongguk.film/project",
            "thumbnail_url": "",
            "description": f"ㆍ{status_in_kor} 이유: {reason}\nㆍ작품 제목: {title}\nㆍ유형: {purpose}\nㆍ교과목: {subject_name}",
        }

    # msg_type: "CREATE_DFLINK"
    elif msg_type == "CREATE_DFLINK":
        reason = data.get("reason", "Unknown")
        target_url = data.get("target_url", "Unknown")
        dflink = data.get("dflink", "Unknown")
        title = data.get("title", "Unknown")
        category = data.get("category", "Unknown")
        expiration_date = data.get("expiration_date", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 동영링크 생성 {status_in_kor}",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"ㆍ{status_in_kor} 이유: {reason}\nㆍ대상 URL: {target_url}\nㆍ동영링크 URL: {dflink}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ만료일: {expiration_date}",
        }

    # msg_type: "UPDATE_DFLINK"
    elif msg_type == "UPDATE_DFLINK":
        reason = data.get("reason", "Unknown")
        target_url = data.get("target_url", "Unknown")
        dflink = data.get("dflink", "Unknown")
        title = data.get("title", "Unknown")
        category = data.get("category", "Unknown")
        expiration_date = data.get("expiration_date", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 동영링크 수정 {status_in_kor}",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"ㆍ{status_in_kor} 이유: {reason}\nㆍ대상 URL: {target_url}\nㆍ동영링크 URL: {dflink}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ만료일: {expiration_date}",
        }

    # msg_type: "DELETE_DFLINK"
    elif msg_type == "DELETE_DFLINK":
        target_url = data.get("target_url", "Unknown")
        dflink = data.get("dflink", "Unknown")
        title = data.get("title", "Unknown")
        category = data.get("category", "Unknown")
        expiration_date = data.get("expiration_date", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 동영링크 삭제 {status_in_kor}",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"ㆍ대상 URL: {target_url}\nㆍ동영링크 URL: {dflink}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ만료일: {expiration_date}",
        }

    # msg_type: "DELETE_EXPIRED_DFLINK"
    elif msg_type == "DELETE_EXPIRED_DFLINK":
        expired_dflink_list = data.get("expired_dflink_list", [])
        data_info = ""

        for i in range(len(expired_dflink_list)):
            new_line = f"\nㆍ[{expired_dflink_list[i]['category']}] https://dgufilm.link/{expired_dflink_list[i]['slug']} {expired_dflink_list[i]['title']}"
            new_line.replace("\n", "") if i == 0 else None
            data_info += new_line

        content = {
            "important": False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 만료된 동영링크 {len(expired_dflink_list)}개 삭제 {status_in_kor}",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": data_info,
        }

    # msg_type: "CREATE_NOTICE"
    elif msg_type == "CREATE_NOTICE":
        reason = data.get("reason", "Unknown")
        notion_url = data.get("notion_url", "Unknown")
        title = data.get("title", "Unknown")
        category = data.get("category", "Unknown")
        keyword = data.get("keyword", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 공지사항 등록 {status_in_kor}",
            "url": "https://dongguk.film/notice",
            "thumbnail_url": "",
            "description": f"ㆍ{status_in_kor} 이유: {reason}\nㆍNotion URL: {notion_url}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ키워드: {keyword}",
        }

    # msg_type: "UPDATE_NOTICE"
    elif msg_type == "UPDATE_NOTICE":
        reason = data.get("reason", "Unknown")
        notion_url = data.get("notion_url", "Unknown")
        title = data.get("title", "Unknown")
        category = data.get("category", "Unknown")
        keyword = data.get("keyword", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 공지사항 수정 {status_in_kor}",
            "url": "https://dongguk.film/notice",
            "thumbnail_url": "",
            "description": f"ㆍ{status_in_kor} 이유: {reason}\nㆍNotion URL: {notion_url}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ키워드: {keyword}",
        }

    # msg_type: "DELETE_NOTICE"
    elif msg_type == "DELETE_NOTICE":
        notion_url = data.get("notion_url", "Unknown")
        title = data.get("title", "Unknown")
        category = data.get("category", "Unknown")
        keyword = data.get("keyword", "Unknown")

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 공지사항 삭제 {status_in_kor}",
            "url": "https://dongguk.film/notice",
            "thumbnail_url": "",
            "description": f"ㆍNotion URL: {notion_url}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ키워드: {keyword}",
        }
    
    # msg_type: "TEST"
    elif msg_type == "TEST":
        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{success_emoji} 테스트 메시지 전송 완료",
            "url": "",
            "thumbnail_url": "",
            "description": "테스트 메시지",
        }

    if not settings.IS_PRODUCTION:
        content["title"] += f" (LOCAL)"

    # channel: "DEV"
    if channel == "DEV":
        msg = {
            "target": "DEV",
            "name": get_safe_value(
                lambda: request.user if request.user.is_authenticated else "D-dot-f Bot"
            ),
            "content_type": get_safe_value(lambda: request.content_type),
            "sec-ch-ua-platform": get_safe_value(
                lambda: request.headers["sec-ch-ua-platform"]
            ),
            "user_agent": get_safe_value(lambda: request.headers["user-agent"]),
            "referer": get_safe_value(lambda: request.headers["referer"]),
            "method": get_safe_value(lambda: request.method),
            "full_path": get_safe_value(lambda: request.get_full_path()),
            "user_auth": get_safe_value(lambda: request.user.is_authenticated),
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 처리됨",
        }

    # channel: "MGT"
    elif channel == "MGT":
        msg = {
            "target": "MGT",
            "name": request.user if request.user.is_authenticated else "D-dot-f Bot",
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 처리됨",
        }

    msg.update(content)
    embed = format_msg(msg)

    return webhook.send(embed=embed)
