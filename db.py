import firebase_admin
from firebase_admin import credentials, firestore
import os 


mode=os.getenv('mode')



if not firebase_admin._apps:
    cred_path=None
    if mode=='prod':
        cred_path='/etc/secrets/firebase_creds.json'
    if mode=='dev':
        current_dir = os.path.dirname(os.path.abspath(__file__))  # Get the current directory of main.py
        cred_path = os.path.join(current_dir, 'firebase_creds.json')  # Construct the path to firebase_creds.json
    else:
        raise ValueError('mode must be specified as dev or prod in .env')

    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()