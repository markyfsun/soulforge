#!/bin/bash

# Logging System Setup Script for SoulForge

echo "🚀 Setting up logging system for SoulForge..."

# Create logs directory
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "✅ .env.local created. Please update with your configuration."
else
    echo "ℹ️  .env.local already exists."
fi

# Install additional dependencies if needed
echo "📦 Checking dependencies..."
if ! grep -q "logging" package.json; then
    echo "ℹ️  No additional logging dependencies needed."
fi

# Create log rotation script for production
cat > rotate-logs.sh << 'EOF'
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
EOF

chmod +x rotate-logs.sh

# Create development startup script
cat > start-dev-with-logs.sh << 'EOF'
#!/bin/bash
# Development server with logging dashboard

echo "🚀 Starting SoulForge development server with logging..."

# Start the main development server
npm run dev &
MAIN_PID=$!

# Wait a bit for the server to start
sleep 5

# Open browser to the logger dashboard
if command -v open >/dev/null; then
    echo "🌐 Opening logging dashboard in browser..."
    open http://localhost:3000/dev-logger
elif command -v xdg-open >/dev/null; then
    echo "🌐 Opening logging dashboard in browser..."
    xdg-open http://localhost:3000/dev-logger
else
    echo "🌐 Please visit http://localhost:3000/dev-logger to view the logging dashboard"
fi

echo "📊 Logging dashboard available at: http://localhost:3000/dev-logger"
echo "Press Ctrl+C to stop the server"

# Wait for the main process
wait $MAIN_PID
EOF

chmod +x start-dev-with-logs.sh

echo ""
echo "✅ Logging system setup complete!"
echo ""
echo "📊 Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Visit http://localhost:3000/dev-logger for the logging dashboard"
echo "3. Use ./start-dev-with-logs.sh to start development with logging"
echo "4. Use ./rotate-logs.sh to rotate logs in production"
echo ""
echo "📚 Documentation: LOGGING_SYSTEM_SUMMARY.md"