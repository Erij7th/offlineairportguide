from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User

from .models import Ticket


FIELD_CLASS = "input-field"


class StyledAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        label="Username",
        widget=forms.TextInput(
            attrs={
                "class": FIELD_CLASS,
                "placeholder": "Your username",
                "autocomplete": "username",
            }
        ),
    )
    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput(
            attrs={
                "class": FIELD_CLASS,
                "placeholder": "Your password",
                "autocomplete": "current-password",
            }
        ),
    )


class SignUpForm(UserCreationForm):
    email = forms.EmailField(
        label="Email",
        required=True,
        widget=forms.EmailInput(
            attrs={
                "class": FIELD_CLASS,
                "placeholder": "you@example.com",
                "autocomplete": "email",
            }
        ),
    )

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        placeholders = {
            "username": "Pick a travel-ready username",
            "password1": "Create a secure password",
            "password2": "Confirm your password",
        }
        for name, field in self.fields.items():
            field.widget.attrs.setdefault("class", FIELD_CLASS)
            field.widget.attrs.setdefault("placeholder", placeholders.get(name, field.label))

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user


class TicketForm(forms.ModelForm):
    departure_time = forms.DateTimeField(
        input_formats=["%Y-%m-%dT%H:%M"],
        widget=forms.DateTimeInput(
            attrs={
                "class": FIELD_CLASS,
                "type": "datetime-local",
            }
        ),
    )

    class Meta:
        model = Ticket
        fields = (
            "airline",
            "flight_number",
            "destination",
            "departure_airport",
            "gate",
            "departure_time",
            "status",
            "boarding_pass",
            "notes",
        )
        widgets = {
            "airline": forms.TextInput(
                attrs={"class": FIELD_CLASS, "placeholder": "Delta, JetBlue, United..."}
            ),
            "flight_number": forms.TextInput(
                attrs={"class": FIELD_CLASS, "placeholder": "AA204"}
            ),
            "destination": forms.TextInput(
                attrs={"class": FIELD_CLASS, "placeholder": "Los Angeles"}
            ),
            "departure_airport": forms.TextInput(
                attrs={"class": FIELD_CLASS, "placeholder": "JFK Airport"}
            ),
            "gate": forms.TextInput(
                attrs={"class": FIELD_CLASS, "placeholder": "B14"}
            ),
            "status": forms.Select(attrs={"class": FIELD_CLASS}),
            "boarding_pass": forms.ClearableFileInput(
                attrs={"class": FIELD_CLASS, "accept": "image/*,.pdf"}
            ),
            "notes": forms.Textarea(
                attrs={
                    "class": FIELD_CLASS,
                    "placeholder": "Seat 18A, carry-on only, grab coffee first...",
                    "rows": 4,
                }
            ),
        }
        labels = {
            "airline": "Airline",
            "flight_number": "Flight number",
            "destination": "Destination",
            "departure_airport": "Departure airport",
            "gate": "Gate",
            "departure_time": "Departure time",
            "status": "Flight status",
            "boarding_pass": "Boarding pass photo or PDF",
            "notes": "Travel notes",
        }
