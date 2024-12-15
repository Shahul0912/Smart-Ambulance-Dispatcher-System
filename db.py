import firebase_admin
from firebase_admin import credentials, firestore
import os 



current_dir = os.path.dirname(os.path.abspath(__file__))  # Get the current directory of main.py
cred_path = os.path.join(current_dir, 'firebase_creds.json')  # Construct the path to firebase_creds.json


if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()