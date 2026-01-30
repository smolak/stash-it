#!/bin/bash

if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    source .env
else
    echo "Error: .env file not found."
    echo "Copy .env.example to .env and adjust if needed:"
    echo "  cp .env.example .env"
    exit 1
fi

echo "Starting PostgreSQL using docker-compose..."
docker-compose up -d --no-build postgresql

echo "Waiting for PostgreSQL to be ready..."
RETRIES=30                   # Maximum retries before giving up
SLEEP_TIME=2                 # Time to wait between retries

for ((i=1; i<=RETRIES; i++)); do
    # Note: Don't use -t flag as it requires a TTY which isn't available in scripts
    # Use -h localhost to force TCP connection instead of Unix socket
    # Redirect stdout and stderr to suppress connection errors and query output
    if docker exec "$POSTGRES_CONTAINER_NAME" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" -c "SELECT 1" > /dev/null 2>&1; then
        echo "PostgreSQL is ready!"

        if [ $# -gt 0 ]; then
            echo "Running: $@"

            "$@" 
        fi

        echo "Cleaning up Docker containers..."
        docker-compose kill
        docker-compose rm -f
        exit 0
    else
        echo "PostgreSQL is not ready yet. Retrying in $SLEEP_TIME seconds... ($i/$RETRIES)"
        sleep $SLEEP_TIME
    fi
done

# If we reach here, the database never became ready
echo "PostgreSQL did not become ready in time. Cleaning up Docker and exiting."
docker-compose kill
docker-compose rm -f
exit 1
