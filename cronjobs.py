from django.utils import timezone
from requests.sessions import Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os, requests

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dongguk_film.settings")

"""
If the time is not specified with an if statement, it is executed every 30 minutes.
"""

session = Session()
retries = Retry(total=3, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))

#
# users
#

session.get("https://dongguk.film/users/utils/delete-expired-vcodes")

if timezone.now().strftime("%H:%M") == "08:00":
    session.get("https://dongguk.film/users/utils/delete-inactive-users")

#
# dflink
#

if timezone.now().strftime("%H:%M") == "00:00":
    session.get("https://dongguk.film/dflink/utils/delete-expired-dflinks")

#
# utility
#

if timezone.now().strftime("%H:%M") == "23:00":
    session.get("https://dongguk.film/utility/utils/update-img")

if timezone.now().strftime("%H:%M") == "23:30":
    session.get("https://dongguk.film/utility/utils/update-dmd-cookie")
