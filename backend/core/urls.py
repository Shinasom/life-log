from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. 🔧 FIX: Move these to 'api/v1/auth/' to match your frontend API client
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # The Core App
    path('api/v1/', include('tracker.urls')),
    path('api/v1/auth/', include('users.urls')),
]