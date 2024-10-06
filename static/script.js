let map, userMarker, ambulanceMarkers=[];
let directionsService, directionsRenderer;

    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 0, lng: 0},
            zoom: 2
        });

        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true
        });

        var input = document.getElementById('location');
        var autocomplete = new google.maps.places.Autocomplete(input);

        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                window.alert("No details available for input: '" + place.name + "'");
                return;
            }
            updateUserLocation(place.geometry.location);
        });

        // Automatically get user's location when the map is ready
        getUserLocation();
    }

    function getUserLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var userPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    updateUserLocation(userPos);
                },
                function(error) {
                    $('#status').text("Error: " + error.message);
                }
            );
        } else {
            $('#status').text("Geolocation is not supported by this browser.");
        }
    }

    function updateUserLocation(location) {
        map.setCenter(location);
        map.setZoom(15);

        if (userMarker) userMarker.setMap(null);
        userMarker = new google.maps.Marker({
            position: location,
            map: map,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'location': location}, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    $('#location').val(results[0].formatted_address);
                    $('#status').text('Your location has been found.');
                } else {
                    $('#status').text('No address found for this location.');
                }
            } else {
                $('#status').text('Geocoder failed due to: ' + status);
            }
        });
    }


  
    function findAmbulances() {
        // Clear any existing ambulance markers
        ambulanceMarkers.forEach(marker => marker.setMap(null));
        ambulanceMarkers=[]
    
        // Fetch ambulances from the API
        fetch('/findAmbulance')
            .then(response => response.json())
            .then(data => {
                data.forEach(ambulance => {
                    var ambulancePos = new google.maps.LatLng(ambulance.latitude, ambulance.longitude);
                    
                    // Create ambulance marker
                    var ambulanceMarker = new google.maps.Marker({
                        position: ambulancePos,
                        map: map,
                        title: ambulance.name, // Set title to the ambulance name
                        icon: {
                            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 512'%3E%3Cpath fill='%23007bff' d='M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm144-248c0 4.4-3.6 8-8 8h-56v56c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8v-56h-56c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h56v-56c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v56h56c4.4 0 8 3.6 8 8v48zm176 248c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z'/%3E%3C/svg%3E",
                            scaledSize: new google.maps.Size(40, 40),
                            anchor: new google.maps.Point(20, 20)
                        }
                    });
    
                    // Store the ambulance ID in the marker
                    ambulanceMarker.ambulanceId = ambulance.id;
    
                    // Add an event listener to the marker to select an ambulance for booking
                    google.maps.event.addListener(ambulanceMarker, 'click', function() {
                        // Access the ambulance ID when clicking on the marker
                        console.log("Selected ambulance ID:", this.ambulanceId);
                        $('#status').text('Ambulance ' + ambulance.name + ' selected for booking.');
                    });
    
                    // Add ambulance marker to the map and store it in the array
                   ambulanceMarkers.push(ambulanceMarker);
                });
            })
            .catch(error => {
                console.error('Error fetching ambulances:', error);
            });
    }
        
    




    $(document).ready(function() {
        initMap();

       
    });
