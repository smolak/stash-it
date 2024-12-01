#!/bin/bash

if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    source .env
else
    echo ".env file not found. Exiting."
    exit 1
fi

echo "Starting Redis using docker-compose..."
docker-compose up -d redis-server

echo "Waiting for Redis to be ready..."
RETRIES=30                   # Maximum retries before giving up
SLEEP_TIME=2                 # Time to wait between retries

for ((i=1; i<=RETRIES; i++)); do
    docker exec -it "$REDIS_CONTAINER_NAME" redis-cli SET test_key test_value > /dev/null
    VALUE=$(docker exec -i "$REDIS_CONTAINER_NAME" redis-cli GET test_key)

    if [[ "$VALUE" == "test_value" ]]; then
        # I still need to wait for a brief moment (I don't know why)
        sleep 2
        echo "Redis is ready!"

        docker exec -it "$REDIS_CONTAINER_NAME" redis-cli DEL test_key > /dev/null

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
