from django.utils import timezone
import os, requests

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dongguk_film.settings")

"""
If the time is not specified with an if statement, it is executed every 30 minutes.
"""

#
# users
#

requests.get("https://dongguk.film/users/utils/delete-expired-vcodes")

if timezone.now().strftime("%H:%M") == "08:00":
    requests.get("https://dongguk.film/users/utils/delete-inactive-users")

#
# dflink
#

if timezone.now().strftime("%H:%M") == "00:00":
    requests.get("https://dongguk.film/dflink/utils/delete-expired-dflinks")

#
# utility
#

if timezone.now().strftime("%H:%M") == "00:30":
    requests.get("https://dongguk.film/utility/utils/update-dmd-cookie")
