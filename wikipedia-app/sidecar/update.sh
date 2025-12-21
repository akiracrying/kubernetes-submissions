#!/bin/sh
set -e

# Generate random wait time between 5 and 15 minutes (300-900 seconds)
WAIT_TIME=$((300 + RANDOM % 600))
echo "Waiting $WAIT_TIME seconds (between 5 and 15 minutes) before downloading random Wikipedia page..."
sleep $WAIT_TIME

# Download random Wikipedia page
echo "Downloading random Wikipedia page..."
curl -L -o /www/index.html https://en.wikipedia.org/wiki/Special:Random

echo "Random Wikipedia page downloaded successfully"

