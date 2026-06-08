#!/bin/sh

# Wait for database to be ready with a timeout
echo "Waiting for database to be ready..."
max_retries=5
count=0
success=0

while [ $count -lt $max_retries ]; do
  if npx prisma migrate deploy; then
    echo "Database migrations applied successfully!"
    success=1
    break
  else
    count=$((count+1))
    echo "Database is not ready yet (Attempt $count/$max_retries) - sleeping..."
    sleep 3
  fi
done

if [ $success -eq 0 ]; then
  echo "⚠️ WARNING: Database connection failed after $max_retries attempts. Starting application to serve diagnostic errors."
fi

# Start the application
npm start
