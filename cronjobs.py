from datetime import datetime
import pytz, requests

"""
If the time is not specified with an if statement, it is executed every 30 minutes.
"""

current_time = datetime.now(pytz.timezone("Asia/Seoul"))
current_hour = current_time.hour
current_minute = current_time.strftime("%M")

#
# users
#

requests.get("https://dongguk.film/users/utils/delete-expired-vcodes/")

if current_time.strftime("%H:%M") == "08:00":
    requests.get("https://dongguk.film/users/utils/delete-inactive-users/")

#
# equipment
#

requests.get("https://dongguk.film/equipment/utils/delete-expired-carts/")

if current_hour % 2 == 0 and current_minute == "00":
    requests.get("https://dongguk.film/equipment/utils/synchronize-equipment-data/")

#
# project
#

if current_time.strftime("%H:%M") == "22:30":
    requests.get("https://dongguk.film/project/utils/update-project-policy/")

#
# dflink
#

if current_time.strftime("%H:%M") == "00:00":
    requests.get("https://dongguk.film/dflink/utils/delete-expired-dflinks/")

#
# utility
#

if current_time.strftime("%H:%M") == "23:00":
    requests.get("https://dongguk.film/utility/utils/update-hero-img/")

if current_time.strftime("%H:%M") == "23:30":
    requests.get("https://dongguk.film/utility/utils/update-dmd-cookie/")
