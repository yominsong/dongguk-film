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


def format_msg(content, type):

    target = content["target"]
    palette = discord.Color
    
    color = (
        palette.red()
        if type == "DSA"
        or type == "OVP"
        or type == "UXR"
        else palette.dark_gray()
    )

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


def send_msg(request, type, channel):
    """
    type: "DSA", "OVP", "UXR"
    channel: "DEV", "MGT"

    DSA: Duplicate signup attempt
    AIV: Attempting to skip identity verification
    UXR: Unexpected request

    DEV: Development
    MGT: Management
    """

    webhook = get_webhook(channel)
    individual_content = None
    default_picture_url = "https://dongguk.film/static/images/d_dot_f_logo.jpg"

    # type: "DSA"
    if type == "DSA":
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "중복 회원가입 시도",
            "url": "",
            "thumbnail_url": "",
            "description": "중복 회원가입 시도가 발생했습니다. 사용자가 DB에 이미 등록되어 있는 학번을 입력한 것으로 보입니다.",
        }

    # type: "AIV"
    elif type == "AIV":
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "회원가입 본인인증 생략 시도",
            "url": "",
            "thumbnail_url": "",
            "description": "회원가입 본인인증 생략 시도가 발생했습니다. 사용자가 비정상적 방법으로 회원가입을 시도하는 것으로 보입니다.",
        }

    # type: "UXR"
    elif type == "UXR":
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "예상치 못한 요청",
            "url": "",
            "thumbnail_url": "",
            "description": "예상지 못한 요청이 발생했습니다. 사용자가 비정상적 시도를 하는 것으로 보입니다.",
        }
    # elif type == "updated successfully":
    #     individual_content = {
    #         "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
    #         if request.user.is_authenticated
    #         and not request.user.email == "admin@dongguk.film"
    #         else default_picture_url,
    #         "author_url": "",
    #         "title": "데이터 업데이트됨",
    #         "url": "",
    #         "thumbnail_url": "",
    #         "description": "디닷에프 데이터가 백오피스 데이터와 동일하게 업데이트되었어요.",
    #     }

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
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 전송됨.",
        }

    # channel: "MGT"
    elif channel == "MGT":
        content = {
            "target": "MGT",
            "name": request.user,
            "full_path": request.get_full_path(),
            "user_auth": request.user.is_authenticated,
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 전송됨.",
        }

    content.update(individual_content)
    embed = format_msg(content, type)

    return webhook.send(embed=embed)
