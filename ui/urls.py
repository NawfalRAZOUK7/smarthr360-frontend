from django.urls import path

from . import views

app_name = "ui"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("logout/", views.logout_view, name="logout"),
    path("refresh/", views.refresh_view, name="refresh"),
    path("predictions/new/", views.create_prediction_view, name="prediction_create"),
    path("predictions/<str:prediction_id>/", views.prediction_detail, name="prediction_detail"),
    path("profile/", views.profile_view, name="profile"),
]
