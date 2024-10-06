from fastapi import FastAPI, HTTPException,Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
from uuid import UUID, uuid4
from typing import List
from math import radians, cos, sin, asin, sqrt
import os
from dotenv import load_dotenv
from fastapi.templating import Jinja2Templates

load_dotenv()
app = FastAPI(title="Simple Ambulance Tracker")

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# Define the Ambulance model
class Ambulance(BaseModel):
    id: UUID
    name: str
    latitude: float
    longitude: float

# Hardcoded ambulances near Cubbon Park, Bangalore
ambulances = [
    {
        "id": "dda3f363-f012-4bcc-8464-2666aac8f830",
        "name": "Ambulance A",
        "latitude": 12.9762,
        "longitude": 77.5905
    },
    {
        "id": "b514d5f5-d77d-4ff7-b4c1-12b04fd0d7b8",
        "name": "Ambulance B",
        "latitude": 12.9750,
        "longitude": 77.5910
    },
    {
        "id": "014515a4-3ed4-4f5a-9404-fd498fd9e5e9",
        "name": "Ambulance C",
        "latitude": 12.9775,
        "longitude": 77.5890
    },
    # Add more ambulances as needed
]


def haversine(lon1, lat1, lon2, lat2):
    # Calculate the distance between two points on the Earth (Haversine formula)
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    return 6371 * c  # Radius of Earth in kilometers

@app.get("/findAmbulance", response_model=List[Ambulance])
async def find_ambulance(latitude: float, longitude: float):
    nearby_ambulances = []
    
    # Calculate distances and store them with the ambulance data
    for ambulance in ambulances:
        distance = haversine(longitude, latitude, ambulance["longitude"], ambulance["latitude"])
        nearby_ambulances.append({**ambulance, "distance": distance})

    # Sort ambulances by distance and get the closest 10
    nearby_ambulances = sorted(nearby_ambulances, key=lambda x: x["distance"])[:10]
    
    # Return the ambulances without the distance info
    return [Ambulance(**a) for a in nearby_ambulances]


@app.get("/trackAmbulance/{ambulance_id}", response_model=Ambulance)
def track_ambulance(ambulance_id: str):
    for ambulance in ambulances:
        if ambulance['id'] == ambulance_id:
            return Ambulance(**ambulance)
    raise HTTPException(status_code=404, detail="Ambulance not found")

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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
