import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

# Initialize Firebase Admin SDK (add this to your app startup)
# You'll need to download the service account key from Firebase Console
# and set the path in your environment variables
if not firebase_admin._apps:
    cred = credentials.Certificate("app/auth-a72f0-firebase-adminsdk-lbjwu-0c0b420eab.json")
    # Or use environment variable:
    # cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH"))
    firebase_admin.initialize_app(cred)