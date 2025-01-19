let map, userMarker, ambulanceMarkers=[];
let directionsService, directionsRenderer;
let userPos=null;
let updater=null;
let routePath=null;
pollingInterval=null;
let riderMarker;

    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 0, lng: 0},
            zoom: 2
        });

        const locationButton = document.createElement("img");
        locationButton.classList.add("locate-me-button");
        locationButton.src='/static/findme.svg'
       

        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
        locationButton.addEventListener("click", () => {
            updateUserLocation(userPos)
        })

        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        var input = document.getElementById('location');
        var autocomplete = new google.maps.places.Autocomplete(input);

        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                window.alert("No details available for input: '" + place.name + "'");
                return;
            }
            updateUserLocation(place.geometry.location);
            userPos=place.geometry.location;
        });

        // Automatically get user's location when the map is ready
        getUserLocation();
    }

 
    async function startTracking(){

        if( localStorage.getItem('tracking_ambulance')){
            alert('Your ambulance is on the way. please Be patient. ( Hehe you already are.)')
            return 
        }
        const { error_message, ambulance_id } = await findAmbulance();
        if (await error_message){
            alert(error_message)
            return 
        }
        // add ambulance_id to session
        localStorage.setItem('ambulance_id',ambulance_id)
        localStorage.setItem('tracking_ambulance',true)

        riderMarker=new google.maps.Marker({
            position: location,
            map: map,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            // icon: {
            //     path: google.maps.SymbolPath.CIRCLE,
            //     scale: 10,
            //     fillOpacity: 1,
            //     strokeWeight: 2,
            //     fillColor: '#5384ED',
            //     strokeColor: '#ffffff',
            //   },
        });
        
        let interval=setInterval(() => {
            pollPosition(localStorage.getItem('ambulance_id'));
            
        }, 3000);
        console.log('interval',interval)
    }


    function getUserLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    userPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
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
        map.setZoom(16);

        if (userMarker) userMarker.setMap(null);
        userMarker = new google.maps.Marker({
            position: location,
            map: map,
            // icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillOpacity: 1,
                strokeWeight: 2,
                fillColor: '#5384ED',
                strokeColor: '#ffffff',
              },
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

    async function findAmbulance() {
        try {
            // Construct URL with the user's position
            let url = `/findAmbulance?latitude=${userPos.lat()}&longitude=${userPos.lng()}`;
        
            // Wait for the fetch request to complete and get the response
            let response = await fetch(url);
        
            // Parse the JSON response
            let data =await response.json();
    
            
        
            // Check if there is an error in the response
            if (data.error) {
                return { error_message: data.error, ambulance_id: null }; // Return the error and no ambulance id
            } else {
                return { error_message: null, ambulance_id:data.doc_id }; // Return ambulance id and no error
            }
        } catch (error) {
            console.error('Error fetching ambulances:', error);
            // Return a default error message and no ambulance id in case of a network issue
            return { error_message: 'Error occurred, check logs', ambulance_id: null };
        }
    }


    $('#find-ambulance-btn').click(async function() {
        localStorage.clear();
        startTracking();
    });
    
    $(document).ready(function() {
        initMap();

       
    });

/*
type="module"
main="script.js"
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyD5M0JcKCQ0x3IDGZni_K7vfB0RG2Yu6bE",
    authDomain: "smart-ambulance-427d3.firebaseapp.com",
    projectId: "smart-ambulance-427d3",
    storageBucket: "smart-ambulance-427d3.appspot.com",
    messagingSenderId: "766488484236",
    appId: "1:766488484236:web:564b9ca0442e8749025ea9",
    measurementId: "G-7B70PDVFGX"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
*/