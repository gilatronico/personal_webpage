#!/bin/bash
# Build script for Vercel
# This script runs before the deployment

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build completed!"

