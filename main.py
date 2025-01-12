from fastapi import FastAPI, HTTPException,Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from firebase_admin import firestore
from pydantic import BaseModel
from typing import List
from uuid import UUID, uuid4
from typing import List,Any
from math import radians, cos, sin, asin, sqrt
import os
from dotenv import load_dotenv
from fastapi.templating import Jinja2Templates
from db import db
from authRouter import authRouter

load_dotenv()



app = FastAPI(title="Simple Ambulance Tracker")
app.include_router(authRouter)

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# Define the Ambulance model
class Ambulance(BaseModel):
    id: UUID
    name: str
    latitude: float
    longitude: float
    active:bool


def haversine(lon1, lat1, lon2, lat2):
    # Calculate the distance between two points on the Earth (Haversine formula)
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    return 6371 * c  # Radius of Earth in kilometers

@app.get("/findAmbulance")
async def find_ambulance(latitude: float, longitude: float):
    nearby_ambulances = []
    collection=db.collection('ambulances')
    query=collection.where('active','==',True).where('patient_latitude','==',None)

    docs=query.stream()
    ambulances = []
    for doc in docs:
        ambulances.append(doc.to_dict())    

    # Calculate distances and store them with the ambulance data
    for ambulance in ambulances:
        distance = haversine(longitude, latitude, ambulance["longitude"], ambulance["latitude"])
        nearby_ambulances.append({**ambulance, "distance": distance})

    # Sort ambulances by distance and get the closest 10
    nearby_ambulances = sorted(nearby_ambulances, key=lambda x: x["distance"])
    if len(nearby_ambulances)==0:
        return {"error":"Couldn't find Ambulances"}
    # Return the ambulances without the distance info
    return nearby_ambulances[0]

@app.get("/trackAmbulance/{ambulance_id}")
def track_ambulance(ambulance_id: str):
    collection=db.collection('ambulances')
    query=collection.where("id","==",ambulance_id)

    docs=query.stream()
    ambulances = []
    for doc in docs:
        ambulances.append(doc.to_dict()) 
    
    if len(ambulances)>0:
        return ambulances[0]
    else:
        return {'error':'Ambulance not found'}
    

# def update_ambulance_position(user_id:str,latitude:float,longitude:float):
#     collection=db.collection('ambulances')
#     doc=collection.document(ambulance_id)
#     if doc.exists:
#         doc.update({'latitude':latitude,'longitude':longitude})
#         return {'success':'successfully updated the position '}
#     else:
#         return {'error':'no ambulance found for the id'}

class updatePositionSchema(BaseModel):
    user_id:Any
    latitude:Any
    longitude:Any

@app.post("/updateAmbulancePosition")
def update_ambulance_position(req:updatePositionSchema):
    user_id=req.user_id
    latitude=req.latitude
    longitude=req.longitude
    
    
    try:
        collection = db.collection('ambulances')
        
        # Query to find documents with the specified user_id
        docs = collection.where('user_id', '==', user_id).stream()

        updated_count = 0
        patient_latitude = None
        patient_longitude = None

        for doc in docs:
            # Update the position and lastUpdated field of each ambulance that matches the user_id
            doc.reference.update({
                'latitude': latitude,
                'longitude': longitude,
                'lastUpdated': firestore.SERVER_TIMESTAMP  # Automatically sets current server time
            })
            # Get patient_latitude and patient_longitude from the document (or keep as None)
            patient_latitude = doc.to_dict().get('patient_latitude', None)
            patient_longitude = doc.to_dict().get('patient_longitude', None)
            updated_count += 1

        if updated_count > 0:
            response= {
                'success': f'Successfully updated the position of {updated_count} ambulances.',
                }
            if patient_latitude and patient_longitude:
                response['targetLatitude']=patient_latitude,
                response['targetLongitude']=patient_longitude
            return response
        else:
            # If no documents are found, create a new document with the provided data and lastUpdated
            new_doc_ref = collection.add({
                'user_id': user_id,
                'latitude': latitude,
                'longitude': longitude,
                'patient_latitude': None,
                'patient_longitude': None,
                'lastUpdated': firestore.SERVER_TIMESTAMP  # Automatically sets current server time
            })
            return {
                'success': 'No matching ambulances found. A new ambulance document was created.',
               
            }

    except Exception as e:
        return {'error': f'An error occurred: {str(e)}'}

    

# Serve the HTML file at root
@app.get("/", response_class=HTMLResponse)
def read_root(request:Request):
    context = {
        "request": request,  # Required by Jinja2Templates
        "api_key": os.environ.get('GOOGLE_MAPS_API_KEY','hello')
    }
    return templates.TemplateResponse("index.html", context)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
