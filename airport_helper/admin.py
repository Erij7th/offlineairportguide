from django.contrib import admin

from .models import ChatMessage, Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("flight_number", "destination", "gate", "departure_time", "status")
    list_filter = ("status", "airline")
    search_fields = ("flight_number", "destination", "user__username")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__username", "message")
