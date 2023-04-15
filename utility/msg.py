from django.conf import settings
from django.utils import timezone
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


def format_msg(content):

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
        embed.add_field(name="Content-Type", value=content["content_type"], inline=True)
        embed.add_field(
            name="Sec-Ch-Ua-Platform", value=content["sec-ch-ua-platform"], inline=True
        )
        embed.add_field(name="User-Agent", value=content["user_agent"], inline=False)
        embed.add_field(name="Referer", value=content["referer"], inline=False)
        embed.add_field(name="Method", value=content["method"], inline=True)
        embed.add_field(name="Full-Path", value=content["full_path"], inline=True)
        embed.add_field(name="User-Auth", value=content["user_auth"], inline=True)
    elif target == "MGT":
        embed.add_field(name="Full-Path", value=content["full_path"], inline=True)
        embed.add_field(name="User-Auth", value=content["user_auth"], inline=True)

    embed.set_footer(text=content["footer"])

    return embed


def get_webhook(channel):
    """
    channel: "DEV", "MGT"

    DEV: Development
    MGT: Management
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


def send_msg(request, type, channel, extra=None):
    """
    type: "DSA", "OVP", "UXR", "SUP", "DLC"
    channel: "DEV", "MGT"

    DSA: Duplicate signup attempt
    AIV: Attempting to skip identity verification
    UXR: Unexpected request
    SUP: Signup complete
    DLC: DF Link Create
    DLD: DF Link Delete

    DEV: Development
    MGT: Management
    """

    webhook = get_webhook(channel)
    default_picture_url = "https://dongguk.film/static/images/d_dot_f_logo.jpg"

    # type: "DSA"
    if type == "DSA":
        main_content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "중복 회원가입 시도",
            "url": "",
            "thumbnail_url": "",
            "description": "중복 회원가입이 시도되었습니다. 사용자가 이미 회원가입을 완료한 다른 사용자의 학번 및 성명을 입력했을 수 있습니다.",
        }

    # type: "AIV"
    elif type == "AIV":
        main_content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "본인인증 생략 시도",
            "url": "",
            "thumbnail_url": "",
            "description": "본인인증 생략이 시도되었습니다. 사용자가 비정상적인 방법으로 회원가입을 시도하는 것일 수 있습니다.",
        }

    # type: "UXR"
    elif type == "UXR":
        main_content = {
            "important": True,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "예상치 못한 요청 발생",
            "url": "",
            "thumbnail_url": "",
            "description": "예상지 못한 요청이 발생했습니다. 사용자가 비정상적인 방법으로 서비스를 이용하는 것일 수 있습니다.",
        }
    
    # type: "SUP"
    elif type == "SUP":
        main_content = {
            "important": False,
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url() if request.user.is_authenticated else default_picture_url,
            "author_url": "",
            "title": "새 회원가입",
            "url": "",
            "thumbnail_url": "",
            "description": "새로운 회원이 가입했습니다.",
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
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url() if request.user.is_authenticated else default_picture_url,
            "author_url": "",
            "title": "동영링크 생성",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"동영링크 생성이 요청되었으며, 그 결과는 아래와 같습니다.\nㆍ상태: {status}\nㆍ사유: {reason}\nㆍ원본 URL: {original_url}\nㆍ동영링크 URL: {dflink}\nㆍ제목: {title}\nㆍ범주: {category}\nㆍ만료일: {expiration_date}",
        }

    # type: "DLD"
    elif type == "DLD":
        sub_content = ""
        for i in range(len(extra)):
            new_line = f"\nㆍ[{extra[i]['category']}] {extra[i]['dflink']} {extra[i]['title']}"
            sub_content += new_line
        main_content = {
            "important": False,
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "만료된 동영링크 삭제",
            "url": "https://dongguk.film/dflink",
            "thumbnail_url": "",
            "description": f"다음 {len(extra)}개의 동영링크가 만료일 도달로 삭제되었습니다.{sub_content}",
        }

    # channel: "DEV"
    if channel == "DEV":
        content = {
            "target": "DEV",
            "name": request.user,
            "content_type": request.content_type,
            "sec-ch-ua-platform": request.headers["sec-ch-ua-platform"],
            "user_agent": request.headers["user-agent"],
            "referer": request.headers["referer"],
            "method": request.method,
            "full_path": request.get_full_path(),
            "user_auth": request.user.is_authenticated,
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 전송됨",
        }

    # channel: "MGT"
    elif channel == "MGT":
        content = {
            "target": "MGT",
            "name": request.user,
            "full_path": request.get_full_path(),
            "user_auth": request.user.is_authenticated,
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 전송됨",
        }

    content.update(main_content)
    embed = format_msg(content)

    return webhook.send(embed=embed)
