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

echo "Starting MySQL using docker-compose..."
docker-compose up -d --no-build mysql

echo "Waiting for MySQL to be ready..."
RETRIES=30                   # Maximum retries before giving up
SLEEP_TIME=2                 # Time to wait between retries

for ((i=1; i<=RETRIES; i++)); do
    # Note: Don't use -t flag as it requires a TTY which isn't available in scripts
    # Redirect stderr to suppress MySQL's password warning on command line
    if docker exec "$MYSQL_CONTAINER_NAME" mysql -u "$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
        echo "MySQL is ready!"

        if [ $# -gt 0 ]; then
            echo "Running: $@"

            "$@" 
        fi

        echo "Cleaning up Docker containers..."
        docker-compose kill
        docker-compose rm -f
        exit 0
    else
        echo "MySQL is not ready yet. Retrying in $SLEEP_TIME seconds... ($i/$RETRIES)"
        sleep $SLEEP_TIME
    fi
done

# If we reach here, the database never became ready
echo "MySQL did not become ready in time. Cleaning up Docker and exiting."
docker-compose kill
docker-compose rm -f
exit 1
