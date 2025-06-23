import os
import json
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from app.config import settings

if not firebase_admin._apps:
    firebase_creds_env = os.getenv("FIREBASE_CREDENTIALS")

    if settings.FIREBASE_CREDENTIALS != "":
        # Running on Railway: credentials from env
        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS)
        cred = credentials.Certificate(cred_dict)
    else:
        # Local dev: read from file
        cred = credentials.Certificate("app/auth-a72f0-firebase-adminsdk-lbjwu-0c0b420eab.json")

    firebase_admin.initialize_app(cred)
