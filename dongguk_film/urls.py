"""dongguk_film URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.views.static import serve as serve_static
from django.urls import path, re_path, include
import home

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("", include("home.urls")),
    path("equipment/", include("equipment.urls")),
    path("dflink/", include("dflink.urls")),
    path("notice/", include("notice.urls")),
    path("users/", include("users.urls")),
    path("utility/", include("utility.urls")),
    re_path(
        r"^sw.js$",
        serve_static,
        {"document_root": settings.STATIC_ROOT, "path": "js/sw.js"},
    ),
    # re_path(
    #     r"^sw.js$",
    #     serve_static,
    #     {"document_root": settings.STATICFILES_DIRS[0], "path": "js/sw.js"},
    # ),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler400 = home.views.error_400
handler404 = home.views.error_404
handler408 = home.views.error_408
handler500 = home.views.error_500
handler502 = home.views.error_502
