from datetime import datetime
import pytz, requests

"""
If the time is not specified with an if statement, it is executed every 30 minutes.
"""

#
# users
#

requests.get("https://dongguk.film/users/utils/delete-expired-vcodes/")

if datetime.now(pytz.timezone("Asia/Seoul")).strftime("%H:%M") == "08:00":
    requests.get("https://dongguk.film/users/utils/delete-inactive-users/")

#
# equipment
#

if datetime.now(pytz.timezone("Asia/Seoul")).strftime("%H:%M") == "22:30":
    requests.get("https://dongguk.film/equipment/utils/update-equipment-policy/")

#
# project
#
    
if datetime.now(pytz.timezone("Asia/Seoul")).strftime("%H:%M") == "22:30":
    requests.get("https://dongguk.film/project/utils/update-project-position/")

#
# dflink
#

if datetime.now(pytz.timezone("Asia/Seoul")).strftime("%H:%M") == "00:00":
    requests.get("https://dongguk.film/dflink/utils/delete-expired-dflinks/")

#
# utility
#

if datetime.now(pytz.timezone("Asia/Seoul")).strftime("%H:%M") == "23:00":
    requests.get("https://dongguk.film/utility/utils/update-hero-img/")

if datetime.now(pytz.timezone("Asia/Seoul")).strftime("%H:%M") == "23:30":
    requests.get("https://dongguk.film/utility/utils/update-dmd-cookie/")
