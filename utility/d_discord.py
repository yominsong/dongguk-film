import os, sys

sys.path.append(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))

from dongguk_film import settings
from django.utils import timezone
import discord
from discord import SyncWebhook


DISCORD_MGT_WEBHOOK_URL = getattr(
    settings, "DISCORD_MGT_WEBHOOK_URL", "DISCORD_MGT_WEBHOOK_URL"
)
DISCORD_DEV_WEBHOOK_URL = getattr(
    settings, "DISCORD_DEV_WEBHOOK_URL", "DISCORD_DEV_WEBHOOK_URL"
)


def format_msg(dict_content, str_msg_type):
    content = dict_content
    type = str_msg_type
    target = content["target"]
    color = discord.Color
    color = (
        color.red()
        if type == "unexpected request"
        or type == "server-side validation failed"
        or type == "duplicate signup attempted"
        or type == "verification process bypassed"
        else color.dark_gray()
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
    if target == "dev":
        embed.add_field(name="Content-Type", value=content["content_type"], inline=True)
        embed.add_field(
            name="Sec-Ch-Ua-Platform", value=content["sec-ch-ua-platform"], inline=True
        )
        embed.add_field(name="User-Agent", value=content["user_agent"], inline=False)
        embed.add_field(name="Referer", value=content["referer"], inline=False)
        embed.add_field(name="Method", value=content["method"], inline=True)
        embed.add_field(name="Full-Path", value=content["full_path"], inline=True)
        embed.add_field(name="User-Auth", value=content["user_auth"], inline=True)
    elif target == "mgt":
        embed.add_field(name="Full-Path", value=content["full_path"], inline=True)
        embed.add_field(name="User-Auth", value=content["user_auth"], inline=True)
    embed.set_footer(text=content["footer"])
    return embed


def get_webhook(str_channel):
    channel = str_channel
    if channel == "mgt":
        webhook_url = DISCORD_MGT_WEBHOOK_URL
    elif channel == "dev":
        webhook_url = DISCORD_DEV_WEBHOOK_URL
    webhook = SyncWebhook.from_url(webhook_url)
    return webhook


def send_msg(request, str_msg_type, str_channel):
    type = str_msg_type
    channel = str_channel
    webhook = get_webhook(channel)
    individual_content = None
    default_picture_url = "https://dongguk.film/static/d_dot_f_logo.jpg"
    if channel == "dev":
        content = {
            "target": "dev",
            "name": request.user,
            "content_type": request.content_type,
            "sec-ch-ua-platform": request.headers["sec-ch-ua-platform"],
            "user_agent": request.headers["user-agent"],
            "referer": request.headers["referer"],
            "method": request.method,
            "full_path": request.get_full_path(),
            "user_auth": request.user.is_authenticated,
            "footer": f"Occurred on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}",
        }
    elif channel == "mgt":
        content = {
            "target": "mgt",
            "name": request.user,
            "full_path": request.get_full_path(),
            "user_auth": request.user.is_authenticated,
            "footer": f"{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}에 완료됨.",
        }
    if type == "unexpected request":
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "Unexpected Request",
            "url": "",
            "thumbnail_url": "",
            "description": "An unexpected request has occurred. The user seems to be making an unusual attempt.",
        }
    elif type == "server-side validation failed":
        webhook = get_webhook("dev")
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "Server-side Validation Failed",
            "url": "",
            "thumbnail_url": "",
            "description": "Server-side validation failed. It looks like the user passed the client-side validation abnormally.",
        }
    elif type == "duplicate sign up attempted":
        webhook = get_webhook("dev")
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "Duplicate Signup Attempted",
            "url": "",
            "thumbnail_url": "",
            "description": "Duplicate sign up attempted. It seems that the user entered a student ID already registered in the DB.",
        }
    elif type == "sign up requested with invalid student id":
        webhook = get_webhook("dev")
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "Signup Requested with Invalid Student ID",
            "url": "",
            "thumbnail_url": "",
            "description": "A sign up with an invalid student ID has been requested. It seems that the user is trying to sign up in an unusual way.",
        }
    elif type == "verification process bypassed":
        webhook = get_webhook("dev")
        individual_content = {
            "picture_url": default_picture_url,
            "author_url": "",
            "title": "Verification Process Bypassed",
            "url": "",
            "thumbnail_url": "",
            "description": "Verification Process Bypassed. It seems that the user tried to sign up in an unusual way.",
        }
    elif type == "updated successfully":
        webhook = get_webhook("mgt")
        individual_content = {
            "picture_url": request.user.socialaccount_set.all()[0].get_avatar_url()
            if request.user.is_authenticated
            and not request.user.email == "admin@dongguk.film"
            else default_picture_url,
            "author_url": "",
            "title": "데이터 업데이트됨",
            "url": "",
            "thumbnail_url": "",
            "description": "디닷에프 데이터가 백오피스 데이터와 동일하게 업데이트되었어요.",
        }
    content.update(individual_content)
    embed = format_msg(content, type)
    return webhook.send(embed=embed)
