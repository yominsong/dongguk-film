from django.conf import settings
from django.http import HttpResponse
from requests.sessions import Session
from requests.adapters import HTTPAdapter
import json, re

#
# Cron functions
#


def update_dmd_cookie(request):
    with Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=3))
        response = session.get("https://util.dgufilm.link/get-dmd-cookie")
        cookie = response.text.rstrip()

    if "WMONID" in cookie:
        with open("secrets.json", "r+") as f:
            data = json.load(f)
            data["DMD_COOKIE"] = cookie
            f.seek(0)
            f.write(json.dumps(data, indent=4))
            f.truncate()

    return HttpResponse(f"dmd-cookie: {cookie}")


#
# Sub functions
#


def reg_test(value, type):
    """
    value: String to test regular expression for
    type: "HGL", "LRN", "NUM", "DAT", "EML", "URL"

    HGL: Hangul
    LRN: Lower case Roman and Number
    NUM: Number
    DAT: Date
    EML: Email
    URL: URL
    """

    reg_hangul = re.compile("[가-힣]+")
    reg_lower_case_roman_and_number = re.compile("[^a-z0-9]")
    reg_number = re.compile("[0-9]")
    reg_number_with_dash = re.compile("[0-9\-]")
    reg_email = re.compile(
        "^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9}$"
    )
    reg_url = re.compile(
        "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})"
    )

    if type == "HGL":
        tested_value = "".join(re.findall(reg_hangul, value))
    elif type == "LRN":
        tested_value = "".join(re.findall(reg_lower_case_roman_and_number, value))
    elif type == "NUM":
        tested_value = "".join(re.findall(reg_number, value))
    elif type == "DAT":
        tested_value = "".join(re.findall(reg_number_with_dash, value))
    elif type == "EML":
        tested_value = reg_email.match(value).group()
    elif type == "URL":
        tested_value = reg_url.match(value).group()
    else:
        tested_value = None

    result = True if value == tested_value else False

    return result
