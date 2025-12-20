# Vercel serverless function entry point
# This file is required for Vercel to properly handle Django requests

from landing_project.wsgi import application

def handler(request):
    return application(request)

