from fastapi import APIRouter
from pydantic import BaseModel
from db import db 

authRouter=APIRouter()



class registrationForm(BaseModel):
    username:str
    password:str
    phone_number:str
    driving_license_number:str
    vehicle_number:str

@authRouter.post('/register')
def register(details:registrationForm):
    collection=db.collection('users')
    response={}

    try:
        collection.add(details.model_dump())
    except:
        print('error inserting into db ')
        response['error']='there was a error while regestering'
    else:
        response['message']='registered successfully'
    return response
    

class loginForm(BaseModel):
    username:str
    password:str

@authRouter.post('/login')
def login(form: loginForm):
    collection = db.collection('users')
    query = collection.where("username", "==", form.username).where('password', '==', form.password)
    docs = query.stream()

    user = None
    for doc in docs:
        user = doc.to_dict()  # Get user data
        user_id = doc.id      # Get the document ID
        break  # Since we're only looking for one user, we can stop here

    if user:
        return {"success": "Login successful", "user_id": user_id}
    else:
        return {"error": "Invalid username/password"}


class getUserSchema(BaseModel):
    id:str
@authRouter.post('/getUserDetails')
def get_user_details(req:getUserSchema):
    collection = db.collection('users')
    query = collection.where("id", "==",req.id)
    docs = query.stream()
    user=None
    for doc in docs:
        user = doc.to_dict()  # Get user data
        return user
    return {'error':'no user found for the user id'}

