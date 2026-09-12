#!/bin/sh
set -eu

# The database service is health-checked by Compose. Running migrations here
# makes a newly created local volume usable before the API accepts requests.
alembic upgrade head

exec "$@"
