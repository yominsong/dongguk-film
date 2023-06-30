from django.conf import settings
import requests, json

UNSPLASH_ACCESS_KEY = getattr(settings, "UNSPLASH_ACCESS_KEY", "UNSPLASH_ACCESS_KEY")

json_path = (
    "dongguk_film/static/json/img.json"
    if settings.DEBUG
    else "dongguk_film/staticfiles/json/img.json"
)

#
# Main functions
#


def save_img(query: str, app_name: str):
    """
    - query | `str`: Random image search term
    - app_name | `str`: The name of the app the image will be used for
    """

    url = f"https://api.unsplash.com/photos/random?client_id={UNSPLASH_ACCESS_KEY}&count=5&orientation=landscape&query={query}"
    headers = {"accept": "application/json", "Accept-Version": "v1"}
    response = requests.get(url, headers=headers).json()
    image_list = []
    image_list_for_msg = []

    for random_image in response:
        image_url = random_image
        image_list_for_msg.append(image_url)
    #     image_url = random_image["urls"]["regular"]
    #     image_list.append(image_url)
    #     image = {"app_name": app_name, "image_url": image_url}
    #     image_list_for_msg.append(image)

    # with open(json_path, "r+") as f:
    #     data = json.load(f)
    #     data[app_name] = image_list
    #     f.seek(0)
    #     f.write(json.dumps(data, indent=4))
    #     f.truncate()

    return image_list_for_msg


def get_img(app_name: str):
    """
    - app_name | `str`: The name of the app the image will be used for
    """

    with open(json_path, "r") as f:
        image_list = json.load(f)[app_name]
        f.close()

    return image_list
