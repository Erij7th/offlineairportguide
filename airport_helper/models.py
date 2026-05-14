from django.conf import settings
from django.db import models


class Ticket(models.Model):
    class FlightStatus(models.TextChoices):
        ON_TIME = "on_time", "On Time"
        DELAYED = "delayed", "Delayed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tickets",
    )
    flight_number = models.CharField(max_length=20)
    destination = models.CharField(max_length=120)
    gate = models.CharField(max_length=20)
    departure_time = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=FlightStatus.choices,
        default=FlightStatus.ON_TIME,
    )
    airline = models.CharField(max_length=80, blank=True)
    departure_airport = models.CharField(max_length=120, blank=True)
    boarding_pass = models.FileField(upload_to="boarding_passes/", blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["departure_time", "-created_at"]

    def __str__(self):
        return f"{self.flight_number} to {self.destination}"

    @property
    def status_color(self):
        return {
            self.FlightStatus.ON_TIME: "green",
            self.FlightStatus.DELAYED: "orange",
            self.FlightStatus.CANCELLED: "red",
        }[self.status]

    @property
    def gate_zone(self):
        for char in self.gate:
            if char.isalpha():
                return char.upper()
        return "MAIN"


class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = "user", "User"
        BOT = "bot", "Bot"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    role = models.CharField(max_length=10, choices=Role.choices)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.role}"
