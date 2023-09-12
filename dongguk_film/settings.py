"""
Django settings for dongguk_film project.

Generated by 'django-admin startproject' using Django 4.1.7.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

from pathlib import Path
import os, json


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
secrets = os.path.join(BASE_DIR, "secrets.json")

with open(secrets) as f:
    secrets = json.loads(f.read())


def get_secret(setting):
    return secrets[setting]


SECRET_KEY = get_secret("SECRET_KEY")

PUBLIC_DATA_SERVICE_KEY = get_secret("PUBLIC_DATA_SERVICE_KEY")

KAKAO_REST_API_KEY = get_secret("KAKAO_REST_API_KEY")

UNSPLASH_ACCESS_KEY = get_secret("UNSPLASH_ACCESS_KEY")

DISCORD_TOKEN = get_secret("DISCORD_TOKEN")

DISCORD_MGT_WEBHOOK_URL = get_secret("DISCORD_MGT_WEBHOOK_URL")

DISCORD_DEV_WEBHOOK_URL = get_secret("DISCORD_DEV_WEBHOOK_URL")

NCP_ACCESS_KEY_ID = get_secret("NCP_ACCESS_KEY_ID")

NCP_SECRET_KEY = get_secret("NCP_SECRET_KEY")

NCP_SENS_SMS_SERVICE_ID = get_secret("NCP_SENS_SMS_SERVICE_ID")

NCP_CLOVA_OCR_SECRET_KEY = get_secret("NCP_CLOVA_OCR_SECRET_KEY")

NCP_CLOVA_OCR_APIGW_INVOKE_URL = get_secret("NCP_CLOVA_OCR_APIGW_INVOKE_URL")

MGT_PHONE = get_secret("MGT_PHONE")

DMD_URL = get_secret("DMD_URL")

DMD_COOKIE = get_secret("DMD_COOKIE")

NOTION_SECRET = get_secret("NOTION_SECRET")

NOTION_DB_ID = get_secret("NOTION_DB_ID")

SCRAPEOPS_API_KEY = get_secret("SCRAPEOPS_API_KEY")

OPENAI_ORG = get_secret("OPENAI_ORG")

OPENAI_API_KEY = get_secret("OPENAI_API_KEY")

SHORT_IO_DOMAIN_ID = get_secret("SHORT_IO_DOMAIN_ID")

SHORT_IO_API_KEY = get_secret("SHORT_IO_API_KEY")

GOOGLE_SA_CREDS = get_secret("GOOGLE_SA_CREDS")

GOOGLE_SA_EMAIL = get_secret("GOOGLE_SA_EMAIL")

GOOGLE_DRIVE_FOLDER_ID = get_secret("GOOGLE_DRIVE_FOLDER_ID")

AWS_ACCESS_KEY = get_secret("AWS_ACCESS_KEY")

AWS_SECRET_ACCESS_KEY = get_secret("AWS_SECRET_ACCESS_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ["dongguk.edu"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.kakao",
    "allauth.socialaccount.providers.naver",
    "home",
    "dflink",
    "notice",
    "users",
    "utility",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "dongguk_film.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "dongguk_film" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "dongguk_film.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "ko-kr"

TIME_ZONE = "Asia/Seoul"

USE_I18N = True

USE_TZ = False


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"

STATICFILES_DIRS = [BASE_DIR / "dongguk_film" / "static"]

STATIC_ROOT = BASE_DIR / "dongguk_film" / "staticfiles"

# Media files

MEDIA_URL = "media/"

MEDIA_ROOT = BASE_DIR / "dongguk_film" / "mediafiles"

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django-allauth

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

SITE_ID = 1

LOGIN_REDIRECT_URL = "/"

LOGOUT_REDIRECT_URL = "/"

SESSION_COOKIE_AGE = 3600

SESSION_EXPIRE_AT_BROWSER_CLOSE = True

SESSION_SAVE_EVERY_REQUEST = True

SOCIALACCOUNT_FORMS = {
    "signup": "users.forms.SocialSignupForm",
}

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "PROCESS": "login",
        "SCOPE": [
            "profile",
            "email",
        ],
        "AUTH_PARAMS": {
            "access_type": "offline",
            "prompt": "select_account",
        },
    },
    "kakao": {
        "AUTH_PARAMS": {
            "prompt": "login",
        },
    },
    "naver": {
        "AUTH_PARAMS": {
            "auth_type": "reauthenticate",
        },
    },
}

SOCIALACCOUNT_AUTO_SIGNUP = False

SOCIALACCOUNT_EMAIL_REQUIRED = True

SOCIALACCOUNT_LOGIN_ON_GET = True  # TODO: need to use POST request

ACCOUNT_LOGOUT_ON_GET = True  # TODO: need to use POST request

ACCOUNT_USERNAME_REQUIRED = False

ACCOUNT_EMAIL_REQUIRED = True

ACCOUNT_AUTHENTICATION_METHOD = "email"

# Email

EMAIL_HOST = "smtp.gmail.com"

EMAIL_PORT = "587"

EMAIL_HOST_USER = get_secret("EMAIL_HOST_USER")

EMAIL_HOST_PASSWORD = get_secret("EMAIL_HOST_PASSWORD")

EMAIL_USE_TLS = True

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
