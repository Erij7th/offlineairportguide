from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from .chatbot import build_bot_reply
from .forms import SignUpForm, StyledAuthenticationForm, TicketForm
from .models import ChatMessage, Ticket


def home(request):
    return render(request, "airport_helper/home.html")


def signup_view(request):
    if request.user.is_authenticated:
        return redirect("dashboard")

    form = SignUpForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        ChatMessage.objects.create(
            user=user,
            role=ChatMessage.Role.BOT,
            message=(
                "Hi there! I'm your airport buddy 🤖 Ask me about gates, flight status, "
                "food nearby, bathroom directions, or a quick joke while you wait."
            ),
        )
        messages.success(request, "Your account is ready. Welcome aboard ✨")
        return redirect("dashboard")

    return render(
        request,
        "registration/signup.html",
        {
            "form": form,
            "auth_mode": "signup",
        },
    )


class StyledLoginView(LoginView):
    template_name = "registration/login.html"
    authentication_form = StyledAuthenticationForm
    redirect_authenticated_user = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["auth_mode"] = "login"
        return context


@login_required
def dashboard(request):
    tickets = request.user.tickets.all()
    chat_messages = request.user.chat_messages.all()

    if not chat_messages.exists():
        ChatMessage.objects.create(
            user=request.user,
            role=ChatMessage.Role.BOT,
            message=(
                f"Welcome, {request.user.username}! ✈️ I can help with your gate, timing, "
                "food options, restroom directions, or just keep you company while you wait."
            ),
        )
        chat_messages = request.user.chat_messages.all()

    return render(
        request,
        "airport_helper/dashboard.html",
        {
            "tickets": tickets,
            "chat_messages": chat_messages,
        },
    )


@login_required
def ticket_create(request):
    form = TicketForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        ticket = form.save(commit=False)
        ticket.user = request.user
        ticket.save()
        messages.success(
            request,
            f"{ticket.flight_number} was saved offline and is ready on your dashboard 💾",
        )
        return redirect("dashboard")

    return render(
        request,
        "airport_helper/ticket_form.html",
        {
            "form": form,
        },
    )


@login_required
@require_POST
def ticket_delete(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id, user=request.user)
    flight_number = ticket.flight_number
    ticket.delete()
    messages.info(request, f"{flight_number} was removed from your saved tickets.")
    return redirect("dashboard")


@login_required
@require_POST
def chat_message(request):
    prompt = request.POST.get("message", "").strip()
    if not prompt:
        return JsonResponse(
            {"error": "Please type a message so I can help."},
            status=400,
        )

    user_message = ChatMessage.objects.create(
        user=request.user,
        role=ChatMessage.Role.USER,
        message=prompt,
    )
    bot_message = ChatMessage.objects.create(
        user=request.user,
        role=ChatMessage.Role.BOT,
        message=build_bot_reply(request.user, prompt),
    )
    return JsonResponse(
        {
            "user": _serialize_message(user_message),
            "bot": _serialize_message(bot_message),
        }
    )


def _serialize_message(message):
    return {
        "role": message.role,
        "message": message.message,
        "timestamp": timezone.localtime(message.created_at).strftime("%I:%M %p").lstrip("0"),
    }
