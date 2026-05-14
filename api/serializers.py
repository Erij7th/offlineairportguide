from rest_framework import serializers

from airport_helper.models import ChatMessage, Ticket


class TicketSerializer(serializers.ModelSerializer):
    gate_zone = serializers.CharField(read_only=True)
    boarding_pass_url = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "flight_number",
            "destination",
            "gate",
            "departure_time",
            "status",
            "airline",
            "departure_airport",
            "notes",
            "created_at",
            "updated_at",
            "gate_zone",
            "boarding_pass_url",
        ]

    def get_boarding_pass_url(self, obj):
        if not obj.boarding_pass:
            return ""

        request = self.context.get("request")
        url = obj.boarding_pass.url
        return request.build_absolute_uri(url) if request else url


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "message", "created_at"]


class TicketUpsertSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    flight_number = serializers.CharField(max_length=20)
    destination = serializers.CharField(max_length=120)
    gate = serializers.CharField(max_length=20)
    departure_time = serializers.DateTimeField()
    status = serializers.ChoiceField(
        choices=Ticket.FlightStatus.choices,
        required=False,
        default=Ticket.FlightStatus.ON_TIME,
    )
    airline = serializers.CharField(max_length=80, required=False, allow_blank=True)
    departure_airport = serializers.CharField(max_length=120, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class PendingChatPromptSerializer(serializers.Serializer):
    local_id = serializers.CharField(required=False, allow_blank=True)
    message = serializers.CharField()


class SyncRequestSerializer(serializers.Serializer):
    tickets = TicketUpsertSerializer(many=True, required=False)
    deleted_ticket_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
    )
    pending_chat_prompts = PendingChatPromptSerializer(many=True, required=False)
