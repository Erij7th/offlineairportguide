from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Ticket


class AirportHelperTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="traveler",
            password="SafePass123",
            email="traveler@example.com",
        )

    def test_home_page_loads(self):
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Welcome to Offline Airport Help")

    def test_dashboard_requires_authentication(self):
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_chat_endpoint_uses_saved_ticket(self):
        Ticket.objects.create(
            user=self.user,
            flight_number="AA204",
            destination="Los Angeles",
            gate="B14",
            departure_time=timezone.now() + timedelta(hours=4),
            status=Ticket.FlightStatus.ON_TIME,
            departure_airport="JFK Airport",
        )
        self.client.login(username="traveler", password="SafePass123")

        response = self.client.post(reverse("chat_message"), {"message": "What's my gate?"})

        self.assertEqual(response.status_code, 200)
        self.assertIn("B14", response.json()["bot"]["message"])
