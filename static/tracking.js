

// let riderMarker;
  // let routePath = [];
  // let stepIndex = 0;
  // let currentDestination = { lat: 34.0522, lng: -118.2437 }; // Example initial destination
  // let routeInitialized = false;

  

  // Poll the server every 3 seconds to get the new rider position
  function pollPosition(ambulance_id) {
    fetch(`/trackAmbulance/${ambulance_id}`)  // Your FastAPI endpoint
      .then(response => response.json())
      .then(data => {
        const lat = data.latitude;
        const lng=data.longitude;  // Assume the response has lat and lng
        const newPosition = { lat, lng };
        const userlat=userPos.lat()
        const userlng=userPos.lng()
        const currentPos={'lat':userlat,'lng':userlng}
        updateRiderPosition(newPosition);

        // If the route isn't initialized yet, calculate the initial route
        if (!localStorage.getItem('path')) {
          recalculateRoute(newPosition, currentPos);
        } else {
          // Check if the rider has deviated significantly from the route
          if (hasRouteChanged(newPosition)) {
            // Recalculate the route if necessary
            currentDestination =currentPos // Assume the rider now sets a new destination
            recalculateRoute(newPosition, currentDestination);
          }
        }
      })
      .catch(error => console.error('Error fetching position:', error));

  }

  // Function to check if the rider has deviated from the route
  function hasRouteChanged(newPosition) {
    // Create a LatLng object for the rider's new position
    const riderLatLng = new google.maps.LatLng(newPosition.lat, newPosition.lng);
    const routePath=JSON.parse(localStorage.getItem('path'))
    // Find the closest point on the current route
    let closestDistance = Infinity;
    let closestPoint = null;

    // Loop through the routePath and find the closest point
    for (let i = 0; i < routePath.length; i++) {
      const routePoint = routePath[i]; // This should be a LatLng object from the route steps
      
      // Calculate the distance between the rider's current position and the route point
      const distance = google.maps.geometry.spherical.computeDistanceBetween(riderLatLng, routePoint);

      // Update the closest point if we find a shorter distance
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = routePoint;
      }
    }

    // Determine if the rider is too far from the closest point
    const threshold = 100; // Threshold distance in meters (you can adjust this)

    // If the rider is more than the threshold distance from the closest route point, we assume they've changed route
    return closestDistance > threshold;
  }

  // Recalculate the route based on the new position and destination
  function recalculateRoute(startPosition, endPosition) {
    const request = {
      origin: startPosition,
      destination: endPosition,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (response, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(response);
        let routePath = response.routes[0].legs[0].steps.map(step => step.end_location);
        localStorage.setItem('path',JSON.stringify(routePath))
        
        stepIndex = 0; // Reset to start from the new route
        
      } else {
        console.error("Error recalculating route: " + status);
      }
    });
  }

  // Update the rider's position on the map
  function updateRiderPosition(newPosition) {
    
    riderMarker.setPosition(newPosition);
    //map.panTo(newPosition);  // Optionally pan the map to the new position
  }

  // Function to animate the rider along the route
  
