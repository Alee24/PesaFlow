#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
until npx prisma db push --accept-data-loss; do
  echo "Database is not ready yet - sleeping..."
  sleep 2
done

echo "Database is ready!"

# Start the application
npm start
