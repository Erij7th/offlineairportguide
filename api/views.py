from pathlib import Path

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.staticfiles import finders
from django.http import Http404, HttpResponse
from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from airport_helper.chatbot import build_bot_reply
from airport_helper.models import ChatMessage, Ticket

from .serializers import (
    ChatMessageSerializer,
    SyncRequestSerializer,
    TicketSerializer,
)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(login_required, name="dispatch")
class SyncView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_build_sync_payload(request))

    def post(self, request):
        serializer = SyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        for ticket_id in payload.get("deleted_ticket_ids", []):
            Ticket.objects.filter(user=request.user, id=ticket_id).delete()

        for ticket_data in payload.get("tickets", []):
            ticket_data = dict(ticket_data)
            ticket_id = ticket_data.pop("id", None)

            if ticket_id:
                ticket = Ticket.objects.filter(user=request.user, id=ticket_id).first()
                if ticket:
                    for field, value in ticket_data.items():
                        setattr(ticket, field, value)
                    ticket.save(update_fields=[*ticket_data.keys(), "updated_at"])
                    continue

            Ticket.objects.create(user=request.user, **ticket_data)

        for chat_data in payload.get("pending_chat_prompts", []):
            prompt = chat_data.get("message", "").strip()
            if not prompt:
                continue

            ChatMessage.objects.create(
                user=request.user,
                role=ChatMessage.Role.USER,
                message=prompt,
            )
            ChatMessage.objects.create(
                user=request.user,
                role=ChatMessage.Role.BOT,
                message=build_bot_reply(request.user, prompt),
            )

        return Response(_build_sync_payload(request), status=status.HTTP_200_OK)


@never_cache
@require_GET
def service_worker(request):
    static_path = finders.find("js/sw.js") or str(Path(settings.BASE_DIR) / "static" / "js" / "sw.js")
    try:
        with open(static_path, "r", encoding="utf-8") as handle:
            content = handle.read()
    except OSError as exc:
        raise Http404("Service worker not found.") from exc

    response = HttpResponse(content, content_type="application/javascript; charset=utf-8")
    response["Service-Worker-Allowed"] = "/"
    response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


@require_GET
def offline_page(request):
    return render(request, "offline.html")


def _build_sync_payload(request):
    tickets = request.user.tickets.all()
    chat_messages = request.user.chat_messages.all()
    return {
        "server_time": timezone.now().isoformat(),
        "tickets": TicketSerializer(tickets, many=True, context={"request": request}).data,
        "chat_messages": ChatMessageSerializer(chat_messages, many=True).data,
    }
