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

echo "Starting Redis using docker-compose..."
docker-compose up -d --no-build redis-server

echo "Waiting for Redis to be ready..."
RETRIES=30                   # Maximum retries before giving up
SLEEP_TIME=2                 # Time to wait between retries

for ((i=1; i<=RETRIES; i++)); do
    # Note: Don't use -t flag as it requires a TTY which isn't available in scripts
    docker exec "$REDIS_CONTAINER_NAME" redis-cli SET test_key test_value > /dev/null 2>&1
    VALUE=$(docker exec "$REDIS_CONTAINER_NAME" redis-cli GET test_key)

    if [[ "$VALUE" == "test_value" ]]; then
        # I still need to wait for a brief moment (I don't know why)
        sleep 2
        echo "Redis is ready!"

        docker exec "$REDIS_CONTAINER_NAME" redis-cli DEL test_key > /dev/null 2>&1

        if [ $# -gt 0 ]; then
            echo "Running: $@"

            "$@" 
        fi

        echo "Cleaning up Docker containers..."
        docker-compose kill
        docker-compose rm -f
        exit 0
    else
        echo "Redis is not ready yet. Retrying in $SLEEP_TIME seconds... ($i/$RETRIES)"
        sleep $SLEEP_TIME
    fi
done

# If we reach here, the database never became ready
echo "Redis did not become ready in time. Cleaning up Docker and exiting."
docker-compose kill
docker-compose rm -f
exit 1
