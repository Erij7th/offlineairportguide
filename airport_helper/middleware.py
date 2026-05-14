import threading

from django.core.management import call_command
from django.db import connection


class EnsureMigratedMiddleware:
    _has_run = False
    _lock = threading.Lock()

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not self.__class__._has_run:
            with self.__class__._lock:
                if not self.__class__._has_run:
                    self._ensure_migrated()
                    self.__class__._has_run = True

        return self.get_response(request)

    def _ensure_migrated(self):
        try:
            print("[EnsureMigratedMiddleware] Checking for auth_user table...")
            existing_tables = connection.introspection.table_names()

            if "auth_user" in existing_tables:
                print("[EnsureMigratedMiddleware] auth_user table already exists. Skipping migrations.")
                return

            print("[EnsureMigratedMiddleware] auth_user table missing. Running migrations now...")
            call_command("migrate", interactive=False, run_syncdb=True, verbosity=1)
            print("[EnsureMigratedMiddleware] Migrations completed successfully.")
        except Exception as exc:
            print(f"[EnsureMigratedMiddleware] Migration check failed: {exc}")
