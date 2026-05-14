#!/bin/sh
set -e

python manage.py migrate --noinput

exec gunicorn --bind :8080 offline_airport_help.wsgi:application
