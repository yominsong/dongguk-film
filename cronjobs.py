from django.utils import timezone
import requests

#
# users
#

if timezone.now().strftime("%H:%M") == "00:00":
    requests.get("https://dongguk.film/users/utils/delete-inactive-users")

#
# utility
#

requests.get("https://dongguk.film/utility/utils/delete-expired-vcodes")

if timezone.now().strftime("%H:%M") == "00:00":
    requests.get("https://dongguk.film/utility/utils/update-dmd-cookie")
