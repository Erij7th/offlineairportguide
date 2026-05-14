import logging
import threading

from django.core.management import call_command


logger = logging.getLogger(__name__)
_migration_check_complete = False
_migration_check_lock = threading.Lock()


class EnsureMigratedMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self._ensure_migrated_once()
        return self.get_response(request)

    def _ensure_migrated_once(self):
        global _migration_check_complete

        if _migration_check_complete:
            return

        with _migration_check_lock:
            if _migration_check_complete:
                return

            try:
                logger.info("Running ensure_migrated check on first request.")
                call_command("ensure_migrated")
            except Exception:
                logger.exception("ensure_migrated failed during request startup.")
            finally:
                _migration_check_complete = True
