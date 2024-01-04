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
        try:
            embed.add_field(
                name="Sec-Ch-Ua-Platform",
                value=content["sec-ch-ua-platform"],
                inline=True,
            )
            embed.add_field(
                name="Content-Type", value=content["content_type"], inline=True
            )
            embed.add_field(
                name="User-Agent", value=content["user_agent"], inline=False
            )
            embed.add_field(name="Method", value=content["method"], inline=True)
            embed.add_field(name="User-Auth", value=content["user_auth"], inline=True)
        except:
            pass
        embed.add_field(name="Full-Path", value=content["full_path"], inline=True)
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


def send_msg(request, type: str, channel: str, extra=None):
    """
    - request | `HttpRequest`
    - type | `str`:
        - UDC: Update DMD Cookie
        - UIG: Update images
        - UEQ: Update Equipment category and purpose
        - DSA: Duplicate signup attempt
        - AIV: Attempting to skip identity verification
        - UXR: Unexpected request
        - SUP: Signup complete
        - DVA: Delete expired Vcodes Automatically
        - DUA: Delete inactive Users Automatically
        - DLC: DF Link Create
        - DLU: DF Link Update
        - DLD: DF Link Delete
        - DLA: DF Link Delete Automatically
        - NTC: Notice Create
        - NTU: Notice Update
        - NTD: Notice Delete
    - channel | `str`:
        - DEV: Development
        - MGT: Management
    - extra | `Any` | optional
    """

    webhook = get_webhook(channel)
    default_picture_url = "https://dongguk.film/static/images/d_dot_f_logo.jpg"

    # type: "UDC"
    if type == "UDC":
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "DMD 쿠키 업데이트됨",
            "url": "",
            "thumbnail_url": "",
            "description": extra,
        }

    # type: "UIG"
    elif type == "UIG":
        sub_content = ""
        for i in range(len(extra)):
            new_line = f"\nㆍ[{extra[i]['app_name']}] {extra[i]['image_url']}"
            new_line.replace("\n", "") if i == 0 else None
            sub_content += new_line
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "Hero 배경 이미지 업데이트됨",
            "url": "",
            "thumbnail_url": "",
            "description": sub_content,
        }

    # type: "UEQ"
    elif type == "UEQ":
        sub_content = ""
        for i, item in enumerate(extra[0]["category"]):
            new_line = f"\nㆍ[범주] ({item['priority']}) {item['keyword']}"
            new_line.replace("\n", "") if i == 0 else None
            sub_content += new_line
        for i, item in enumerate(extra[1]["purpose"]):
            [up_to, at_least, maximum] = [item["up_to"], item["at_least"], item["maximum"]]
            new_line = f"\nㆍ[목적] ({item['priority']}) {item['keyword']}: 희망 대여일로부터 최대 {up_to}일 ~ 최소 {at_least}일 신청 가능, 최대 {maximum}일 동안 대여 가능"
            sub_content += new_line
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "기자재 범주 및 정책 업데이트됨",
            "url": "",
            "thumbnail_url": "",
            "description": sub_content,
        }

    # type: "DSA"
    elif type == "DSA":
        main_content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "중복 회원가입 시도가 감지됨",
            "url": "",
            "thumbnail_url": "",
            "description": "사용자가 이미 회원가입을 완료한 다른 사용자의 학번 및 성명을 입력했을 수 있습니다.",
        }

    # type: "AIV"
    elif type == "AIV":
        main_content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "본인인증 생략 시도가 감지됨",
            "url": "",
            "thumbnail_url": "",
            "description": "사용자가 비정상적인 방법으로 회원가입을 시도하는 것일 수 있습니다.",
        }

    # type: "UXR"
    elif type == "UXR":
        main_content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "예상치 못한 요청이 발생함",
            "url": "",
            "thumbnail_url": "",
            "description": "사용자가 비정상적인 방법으로 서비스를 이용하는 것일 수 있습니다.",
        }

    # type: "SUP"
    elif type == "SUP":
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "새로운 사용자 계정이 생성됨",
            "url": "",
            "thumbnail_url": "",
            "description": f"현 기준 사용자는 총 {User.objects.count() + 1}명입니다.",
        }

    # type: "DVA"
    elif type == "DVA":
        sub_content = ""
        for i in range(len(extra)):
            new_line = f"\nㆍ[E] {extra[i].email_vcode}, [P] {extra[i].phone_vcode}"
            new_line.replace("\n", "") if i == 0 else None
            sub_content += new_line
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{len(extra)}개의 만료된 인증번호가 삭제됨",
            "url": "",
            "thumbnail_url": "",
            "description": sub_content,
        }

    # type: "DUA"
    elif type == "DUA":
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{extra}개의 비활성 사용자 계정이 삭제됨",
            "url": "",
            "thumbnail_url": "",
            "description": f"현 기준 사용자는 총 {User.objects.count() - extra}명입니다.",
        }

    # type: "DLC"
    elif type == "DLC":
        status = extra["result"]["status"]
        reason = extra["result"]["reason"]
        original_url = extra["result"]["original_url"]
        dflink = extra["result"]["dflink"]
        title = extra["result"]["title"]
        category = extra["result"]["category"]
        expiration_date = extra["result"]["expiration_date"]
        main_content = {
            "important": True if status == "FAIL" else False,
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
            if request.user.is_authenticated
            else default_picture_url,
            "author_url": "",
            "title": "동영링크 생성 요청이 처리됨",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"ㆍ상태: {status}\nㆍ사유: {reason}\nㆍ원본 URL: {original_url}\nㆍ동영링크 URL: {dflink}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ만료일: {expiration_date}",
        }

    # type: "DLU"
    elif type == "DLU":
        status = extra["result"]["status"]
        reason = extra["result"]["reason"]
        original_url = extra["result"]["original_url"]
        dflink = extra["result"]["dflink"]
        title = extra["result"]["title"]
        category = extra["result"]["category"]
        expiration_date = extra["result"]["expiration_date"]
        main_content = {
            "important": True if status == "FAIL" else False,
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
            if request.user.is_authenticated
            else default_picture_url,
            "author_url": "",
            "title": "동영링크 수정 요청이 처리됨",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"ㆍ상태: {status}\nㆍ사유: {reason}\nㆍ원본 URL: {original_url}\nㆍ동영링크 URL: {dflink}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ만료일: {expiration_date}",
        }

    # type: "DLD"
    elif type == "DLD":
        status = extra["result"]["status"]
        original_url = extra["result"]["original_url"]
        dflink = extra["result"]["dflink"]
        title = extra["result"]["title"]
        category = extra["result"]["category"]
        expiration_date = extra["result"]["expiration_date"]
        main_content = {
            "important": True if status == "FAIL" else False,
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
            if request.user.is_authenticated
            else default_picture_url,
            "author_url": "",
            "title": "동영링크 삭제 요청이 처리됨",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"ㆍ상태: {status}\nㆍ원본 URL: {original_url}\nㆍ동영링크 URL: {dflink}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ만료일: {expiration_date}",
        }

    # type: "DLA"
    elif type == "DLA":
        sub_content = ""
        for i in range(len(extra)):
            new_line = f"\nㆍ[{extra[i]['category']}] https://dgufilm.link/{extra[i]['slug']} {extra[i]['title']}"
            new_line.replace("\n", "") if i == 0 else None
            sub_content += new_line
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": f"{len(extra)}개의 만료된 동영링크가 삭제됨",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": sub_content,
        }

    # type: "NTC"
    elif type == "NTC":
        status = extra["result"]["status"]
        reason = extra["result"]["reason"]
        notion_url = extra["result"]["notion_url"]
        title = extra["result"]["title"]
        category = extra["result"]["category"]
        keyword = extra["result"]["keyword"]
        main_content = {
            "important": True if status == "FAIL" else False,
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
            if request.user.is_authenticated
            else default_picture_url,
            "author_url": "",
            "title": "공지사항 등록 요청이 처리됨",
            "url": "https://dongguk.film/notice",
            "thumbnail_url": "",
            "description": f"ㆍ상태: {status}\nㆍ사유: {reason}\nㆍNotion URL: {notion_url}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ키워드: {keyword}",
        }

    # type: "NTU"
    elif type == "NTU":
        status = extra["result"]["status"]
        reason = extra["result"]["reason"]
        notion_url = extra["result"]["notion_url"]
        title = extra["result"]["title"]
        category = extra["result"]["category"]
        keyword = extra["result"]["keyword"]
        main_content = {
            "important": True if status == "FAIL" else False,
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
            if request.user.is_authenticated
            else default_picture_url,
            "author_url": "",
            "title": "공지사항 수정 요청이 처리됨",
            "url": "https://dongguk.film/notice",
            "thumbnail_url": "",
            "description": f"ㆍ상태: {status}\nㆍ사유: {reason}\nㆍNotion URL: {notion_url}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ키워드: {keyword}",
        }

    # type: "NTD"
    elif type == "NTD":
        status = extra["result"]["status"]
        notion_url = extra["result"]["notion_url"]
        title = extra["result"]["title"]
        category = extra["result"]["category"]
        keyword = extra["result"]["keyword"]
        main_content = {
            "important": True if status == "FAIL" else False,
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
            if request.user.is_authenticated
            else default_picture_url,
            "author_url": "",
            "title": "공지사항 삭제 요청이 처리됨",
            "url": "https://dongguk.film/notice",
            "thumbnail_url": "",
            "description": f"ㆍ상태: {status}\nㆍNotion URL: {notion_url}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ키워드: {keyword}",
        }

    # channel: "DEV"
    if channel == "DEV":
        try:
            content = {
                "target": "DEV",
                "name": request.user
                if request.user.is_authenticated
                else "D-dot-f Bot",
                "content_type": request.content_type,
                "sec-ch-ua-platform": request.headers["sec-ch-ua-platform"],
                "user_agent": request.headers["user-agent"],
                # "referer": request.headers["referer"],
                "method": request.method,
                "full_path": request.get_full_path(),
                "user_auth": request.user.is_authenticated,
                "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 전송됨",
            }
        except:
            content = {
                "target": "DEV",
                "name": request.user
                if request.user.is_authenticated
                else "D-dot-f Bot",
                "method": request.method,
                "full_path": request.get_full_path(),
                "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 전송됨",
            }

    # channel: "MGT"
    elif channel == "MGT":
        content = {
            "target": "MGT",
            "name": request.user if request.user.is_authenticated else "D-dot-f Bot",
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 전송됨",
        }

    content.update(main_content)
    embed = format_msg(content)

    return webhook.send(embed=embed)
