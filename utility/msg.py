from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
import discord, json
from discord import SyncWebhook


DISCORD = getattr(settings, "DISCORD", None)
DISCORD_WEBHOOK_URL = DISCORD["WEBHOOK_URL"]

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


def get_webhook_url(channel: str):
    """
    - channel | `str`:
        - OPS: Operations
        - DEV: Development
    """

    webhook_url = DISCORD_WEBHOOK_URL[channel]

    return SyncWebhook.from_url(webhook_url)


#
# Main functions
#


def send_msg(request, msg_type: str, channel: str, data: dict = None):
    """
    - request | `HttpRequest`
    - msg_type | `str`:
        - AMAZON_SNS_ALERT_RECEIVED
        - UPDATE_SUBJECT
        - UPDATE_DND_COOKIE
        - UPDATE_HERO_IMAGE
        - UPDATE_HOLIDAY
        - UPDATE_EQUIPMENT_DATA
        - UPDATE_WORKSPACE_DATA
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
        - PROCESSING_SKIPPED
        - TEST
    - channel | `str`:
        - DEV: Development
        - MGT: Management
    - data | `Any` | optional
    """

    success_emoji = "✅"
    failure_emoji = "❌"
    warning_emoji = "⚠️"
    status_emoji = "❓"
    status_in_kor = "결과 알 수 없음"

    if data is not None:
        status = data.get("status", None)

        if status is not None:
            status_emoji = success_emoji if status == "DONE" else failure_emoji
            status_in_kor = "완료" if status == "DONE" else "실패"

    webhook = get_webhook_url(channel)
    default_picture_url = "https://dongguk.film/static/images/d_dot_f_logo.jpg"

    # msg_type: "AMAZON_SNS_ALERT_RECEIVED"
    if msg_type == "AMAZON_SNS_ALERT_RECEIVED":
        raw_data = data.get("raw_data", {})

        try:
            message = raw_data.get("Message", raw_data)
            parsed_message = json.loads(message) if isinstance(message, str) else message
        except json.JSONDecodeError:
            parsed_message = message

        formatted_msg = json.dumps(parsed_message, indent=4, ensure_ascii=False)
        code_block = f"```json\n{formatted_msg}\n```"

        content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{warning_emoji} Amazon SNS 알림 수신",
            "url": "",
            "thumbnail_url": "",
            "description": code_block,
        }

    # msg_type: "UPDATE_SUBJECT"
    elif msg_type == "UPDATE_SUBJECT":
        year = data.get("year", None)
        semester = data.get("semester", None)

        if year is not None and semester is not None:
            target_year_and_semester = f"{year} {semester}"
        else:
            target_year_and_semester = "Unknown"

        length = data.get("length", 0)
        description = f"ㆍ학기: {target_year_and_semester}\nㆍ개수: {length}"

        content = {
            "important": False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 교과목 업데이트 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "UPDATE_DND_COOKIE"
    elif msg_type == "UPDATE_DND_COOKIE":
        cookie = data.get("cookie", "")

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} DND 쿠키 업데이트 {status_in_kor}",
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

    # msg_type: "UPDATE_HOLIDAY"
    elif msg_type == "UPDATE_HOLIDAY":
        years = data.get("years", [])
        reason = data.get("reason", "Unknown")
        description = f"ㆍ실패 이유: {reason}" if status == "FAIL" else ""
        description += f"\nㆍ대상 연도: {years}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} 공휴일 업데이트 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "UPDATE_EQUIPMENT_DATA"
    elif msg_type == "UPDATE_EQUIPMENT_DATA":
        data_list = data.get("data_list", [])
        data_info = f"ㆍ[HOUR] {len(data_list[0]['hour'])}개"

        for i, item in enumerate(data_list[1]["category"]):
            new_line = f"\nㆍ[CATEGORY] {item['priority']} {item['keyword']}"
            new_line.replace("\n", "") if i == 0 else None
            data_info += new_line

        for i, item in enumerate(data_list[2]["purpose"]):
            new_line = f"\nㆍ[PURPOSE] {item['priority']} {item['keyword']}: {item['in_a_nutshell']}"
            data_info += new_line

        data_info += f"\nㆍ[LIMIT] {len(data_list[3]['limit'])}개"
        data_info += f"\nㆍ[COLLECTION] {len(data_list[4]['collection'])}개"

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} 기자재 데이터 업데이트 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": data_info,
        }

    # msg_type: "UPDATE_WORKSPACE_DATA"
    elif msg_type == "UPDATE_WORKSPACE_DATA":
        data_list = data.get("data_list", [])
        data_info =  f"ㆍ[HOUR] {len(data_list[0]['hour'])}개"

        for i, item in enumerate(data_list[1]["category"]):
            new_line = f"\nㆍ[CATEGORY] {item['priority']} {item['keyword']}"
            new_line.replace("\n", "") if i == 0 else None
            data_info += new_line

        for i, item in enumerate(data_list[2]["purpose"]):
            new_line = f"\nㆍ[PURPOSE] {item['category_priority']}{item['priority']} {item['keyword']}: {item['in_a_nutshell']}"
            data_info += new_line

        for i, item in enumerate(data_list[3]["area"]):
            new_line = f"\nㆍ[AREA] {item['name']}"
            data_info += new_line

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{status_emoji} 공간 데이터 업데이트 {status_in_kor}",
            "url": "",
            "thumbnail_url": "",
            "description": data_info,
        }

    # msg_type: "UPDATE_PROJECT_POLICY"
    elif msg_type == "UPDATE_PROJECT_POLICY":
        data_list = data.get("data_list", [])
        data_info = ""

        for i, item in enumerate(data_list[0]["position"]):
            new_line = f"\nㆍ[POSITION] {item['function']} | {item['keyword']}{'(' + item['note'] + ')' if item['note'] is not None else ''} {item['in_english']}"
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
        record_url = data.get("record_url", "Unknown")
        name = data.get("name", "Unknown")
        created_time = data.get("created_time", "Unknown")
        start_datetime = data.get("start_datetime", "Unknown")
        end_datetime = data.get("end_datetime", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = f"https://docs.google.com/document/d/{public_id}"
            private_url = f"https://docs.google.com/document/d/{private_id}"

        unavailable_item_list = data.get("unavailable_item_list", [])
        description = f"ㆍ예약명: {name}\nㆍ신청일시: {created_time}\nㆍ희망 시작일시: {start_datetime}\nㆍ희망 종료일시: {end_datetime}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

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
            "url": record_url,
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "FACILITY_REQUEST_NOT_PROCESSED"
    elif msg_type == "FACILITY_REQUEST_NOT_PROCESSED":
        record_url = data.get("record_url", "Unknown")
        name = data.get("name", "Unknown")
        created_time = data.get("created_time", "Unknown")
        start_datetime = data.get("start_datetime", "Unknown")
        end_datetime = data.get("end_datetime", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = f"https://docs.google.com/document/d/{public_id}"
            private_url = f"https://docs.google.com/document/d/{private_id}"

        description = f"ㆍ제안: 시설예약 신청 정보를 확인하고, Status를 Approved 또는 Rejected 중 해당하는 값으로 변경하세요.\nㆍ예약명: {name}\nㆍ신청일시: {created_time}\nㆍ희망 시작일시: {start_datetime}\nㆍ희망 종료일시: {end_datetime}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{warning_emoji} 시설예약 확정 또는 반려 필요",
            "url": record_url,
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "APPROVE_FACILITY_REQUEST"
    elif msg_type == "APPROVE_FACILITY_REQUEST":
        record_url = data.get("record_url", "Unknown")
        name = data.get("name", "Unknown")
        created_time = data.get("created_time", "Unknown")
        approved_time = data.get("approved_time", "Unknown")
        start_datetime = data.get("start_datetime", "Unknown")
        end_datetime = data.get("end_datetime", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = f"https://docs.google.com/document/d/{public_id}"
            private_url = f"https://docs.google.com/document/d/{private_id}"

        description = f"ㆍ예약명: {name}\nㆍ신청일시: {created_time}\nㆍ확정일시: {approved_time}\nㆍ예정 시작일시: {start_datetime}\nㆍ예정 종료일시: {end_datetime}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 시설예약 확정 {status_in_kor}",
            "url": record_url,
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "FACILITY_USE_START_DELAYED"
    elif msg_type == "FACILITY_USE_START_DELAYED":
        record_url = data.get("record_url", "Unknown")
        name = data.get("name", "Unknown")
        created_time = data.get("created_time", "Unknown")
        approved_time = data.get("approved_time", "Unknown")
        start_datetime = data.get("start_datetime", "Unknown")
        end_datetime = data.get("end_datetime", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = f"https://docs.google.com/document/d/{public_id}"
            private_url = f"https://docs.google.com/document/d/{private_id}"

        description = f"ㆍ제안: 시설이 문제없이 사용 시작되었는지 확인하고, Status를 In Progress로 변경하세요.\nㆍ예약명: {name}\nㆍ신청일시: {created_time}\nㆍ확정일시: {approved_time}\nㆍ예정 시작일시: {start_datetime}\nㆍ예정 종료일시: {end_datetime}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{warning_emoji} 시설 사용 시작 확인 필요",
            "url": record_url,
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "FACILITY_USE_END_DELAYED"
    elif msg_type == "FACILITY_USE_END_DELAYED":
        record_url = data.get("record_url", "Unknown")
        name = data.get("name", "Unknown")
        created_time = data.get("created_time", "Unknown")
        approved_time = data.get("approved_time", "Unknown")
        started_time = data.get("started_time", "Unknown")
        start_datetime = data.get("start_datetime", "Unknown")
        end_datetime = data.get("end_datetime", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = f"https://docs.google.com/document/d/{public_id}"
            private_url = f"https://docs.google.com/document/d/{private_id}"

        description = f"ㆍ제안: 시설이 문제없이 사용 종료되었는지 확인하고, Status를 Completed로 변경하세요.\nㆍ예약명: {name}\nㆍ신청일시: {created_time}\nㆍ확정일시: {approved_time}"

        if started_time not in [None, "", "Unknown"]:
            description += f"\nㆍ시작일시: {started_time}"
        else:
            description += f"\nㆍ예정 시작일시: {start_datetime}"

        description += f"\nㆍ예정 종료일시: {end_datetime}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{warning_emoji} 시설 사용 종료 확인 필요",
            "url": record_url,
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "CANCEL_FACILITY_REQUEST"
    elif msg_type == "CANCEL_FACILITY_REQUEST":
        record_url = data.get("record_url", "Unknown")
        name = data.get("name", "Unknown")
        created_time = data.get("created_time", "Unknown")
        approved_time = data.get("approved_time", "Unknown")
        start_datetime = data.get("start_datetime", "Unknown")
        end_datetime = data.get("end_datetime", "Unknown")
        canceled_time = data.get("canceled_time", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = f"https://docs.google.com/document/d/{public_id}"
            private_url = f"https://docs.google.com/document/d/{private_id}"

        description = f"ㆍ예약명: {name}\nㆍ신청일시: {created_time}"

        if approved_time not in [None, "", "Unknown"]:
            description += f"\nㆍ확정일시: {approved_time}"

        description += f"\nㆍ예정 시작일시: {start_datetime}\nㆍ예정 종료일시: {end_datetime}\nㆍ취소일시: {canceled_time}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 시설예약 취소 {status_in_kor}",
            "url": record_url,
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "REJECT_FACILITY_REQUEST"
    elif msg_type == "REJECT_FACILITY_REQUEST":
        record_url = data.get("record_url", "Unknown")
        name = data.get("name", "Unknown")
        created_time = data.get("created_time", "Unknown")
        start_datetime = data.get("start_datetime", "Unknown")
        end_datetime = data.get("end_datetime", "Unknown")
        rejected_time = data.get("rejected_time", "Unknown")
        public_id = data.get("public_id", "Unknown")
        private_id = data.get("private_id", "Unknown")
        public_url = None
        private_url = None

        if public_id not in [
            None,
            "",
            "Unknown",
        ] and private_id not in [None, "", "Unknown"]:
            public_url = f"https://docs.google.com/document/d/{public_id}"
            private_url = f"https://docs.google.com/document/d/{private_id}"

        description = f"ㆍ예약명: {name}\nㆍ신청일시: {created_time}\nㆍ예정 시작일시: {start_datetime}\nㆍ예정 종료일시: {end_datetime}\nㆍ반려일시: {rejected_time}\nㆍ공개 신청서 URL: {public_url}\nㆍ비공개 신청서 URL: {private_url}"

        content = {
            "important": True if status == "FAIL" else False,
            "picture_url": (
                request.user.socialaccount_set.all()[0].get_avatar_url()
                if request.user.is_authenticated
                else default_picture_url
            ),
            "author_url": "",
            "title": f"{status_emoji} 시설예약 반려 {status_in_kor}",
            "url": record_url,
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

    # msg_type: "PROCESSING_SKIPPED"
    elif msg_type == "PROCESSING_SKIPPED":
        reason = data.get("reason", "Unknown")
        function_name = data.get("function_name", "Unknown")
        description = f"ㆍ발생 이유: {reason}\nㆍ함수 이름: {function_name}"

        content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{warning_emoji} 처리 생략 발생",
            "url": "",
            "thumbnail_url": "",
            "description": description,
        }

    # msg_type: "TEST"
    elif msg_type == "TEST":
        message = data.get("message", "Test message")

        content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{success_emoji} 테스트 메시지 전송 완료",
            "url": "",
            "thumbnail_url": "",
            "description": message,
        }

    if not settings.IS_PRODUCTION:
        content["title"] += f" (LOCAL or GLOBAL)"

    # channel: "OPS"
    if channel == "OPS":
        msg = {
            "target": "OPS",
            "name": request.user if request.user.is_authenticated else "D-dot-f Bot",
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 처리됨",
        }

    # channel: "DEV"
    elif channel == "DEV":
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

    msg.update(content)
    embed = format_msg(msg)

    return webhook.send(embed=embed)
