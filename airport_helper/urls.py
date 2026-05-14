from django.contrib.auth.views import LogoutView
from django.urls import path

from .views import (
    StyledLoginView,
    chat_message,
    dashboard,
    home,
    init_db,
    signup_view,
    ticket_create,
    ticket_delete,
)


urlpatterns = [
    path("", home, name="home"),
    path("signup/", signup_view, name="signup"),
    path("login/", StyledLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("dashboard/", dashboard, name="dashboard"),
    path("init-db/", init_db, name="init_db"),
    path("tickets/new/", ticket_create, name="ticket_create"),
    path("tickets/<int:ticket_id>/delete/", ticket_delete, name="ticket_delete"),
    path("chat/", chat_message, name="chat_message"),
]
