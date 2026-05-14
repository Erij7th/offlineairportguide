from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from api.views import offline_page, service_worker

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("sw.js", service_worker, name="service-worker"),
    path("offline/", offline_page, name="offline"),
    path("", include("airport_helper.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
