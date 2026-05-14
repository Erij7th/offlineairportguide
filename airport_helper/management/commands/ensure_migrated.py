import logging

from django.core.management import BaseCommand, call_command
from django.db import connections


logger = logging.getLogger(__name__)


def auth_user_table_exists():
    connection = connections["default"]
    table_names = connection.introspection.table_names()
    return "auth_user" in table_names


class Command(BaseCommand):
    help = "Ensures database migrations have run before the app handles traffic."

    def handle(self, *args, **options):
        if auth_user_table_exists():
            logger.info("Database already initialized; auth_user table exists.")
            return

        logger.warning("auth_user table is missing. Running migrations now.")

        try:
            call_command("migrate", interactive=False, run_syncdb=True, verbosity=1)
            connections.close_all()

            if auth_user_table_exists():
                logger.info("Database migrations completed successfully.")
            else:
                logger.error("Migration finished, but auth_user table is still missing.")
        except Exception:
            logger.exception("Automatic migration attempt failed.")
            raise
