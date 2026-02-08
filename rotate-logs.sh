#!/bin/bash
# Log rotation script for production

LOG_DIR="./logs"
LOG_FILE="./logs/app.log"
MAX_LOG_SIZE="10M"  # 10MB
MAX_LOG_FILES="5"

if [ -f "$LOG_FILE" ] && [ "$(stat -c%s "$LOG_FILE")" -gt "$(numfmt --from=iec $MAX_LOG_SIZE)" ]; then
    echo "🔄 Rotating logs..."

    # Rotate logs
    for i in $(seq $MAX_LOG_FILES -1 1); do
        if [ -f "$LOG_FILE.$i" ]; then
            mv "$LOG_FILE.$i" "$LOG_FILE.$((i+1))"
        fi
    done

    # Compress old logs
    find "$LOG_DIR" -name "*.log.*" -type f -mtime +7 -exec gzip {} \;

    # Create new log file
    mv "$LOG_FILE" "$LOG_FILE.1"
    touch "$LOG_FILE"

    echo "✅ Logs rotated successfully"
fi
