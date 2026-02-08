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
