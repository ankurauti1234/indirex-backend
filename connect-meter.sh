#!/bin/bash

# Prompt the user to enter the Meter ID if not provided as an argument
if [ $# -eq 0 ]; then
  read -p "Enter the Meter ID: " METER_ID
else
  METER_ID=$1
fi

# Check if the Meter ID is provided
if [ -z "$METER_ID" ]; then
  echo "Please provide the METER_ID."
  exit 1
fi

NEW_USER="meter_$METER_ID"

# Get the list of ports associated with the meter user
PORT_LIST=$(sudo lsof -i -n | grep LISTEN | grep "$NEW_USER" | grep "\[::1\]:" | awk '{print $2, $9}' | awk -F'[: ]' '{print $1, $NF}' | sort -nr)

# Check if any ports were found
if [[ -z "$PORT_LIST" ]]; then
    echo "Error: No active SSH port found for user $NEW_USER."
    exit 1
fi

# Extract the latest port (highest PID)
LATEST_PORT=$(echo "$PORT_LIST" | awk 'NR==1 {print $2}')

# Validate that we actually got a port
if [[ -z "$LATEST_PORT" ]]; then
    echo "Error: Could not determine the latest port for $NEW_USER."
    exit 1
fi

echo "Latest active port for $NEW_USER is $LATEST_PORT"
echo "Connecting to meter $METER_ID on port $LATEST_PORT..."
ssh -i meter_auth_key -p "$LATEST_PORT" root@localhost