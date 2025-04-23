let directionsRenderer = null;
let directionsService = null;

window.setupRouting = function(map) {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false
  });
};

document.addEventListener('DOMContentLoaded', () => {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false
  });

  const routeBtn = document.getElementById('generate-route-btn');
  directionsRenderer.setMap(window.map); // assumes `map` is global

  routeBtn.addEventListener('click', () => {
    if (!routeBtn.classList.contains('disabled')) {
      generateAndDisplayRoute();
    }
  });

  window.addEventListener('itineraryUpdated', updateRouteButtonState);
  updateRouteButtonState();
});

function updateRouteButtonState() {
  const raw = localStorage.getItem('ts_itinerary');
  const items = raw ? JSON.parse(raw) : [];

  const btn = document.getElementById('generate-route-btn');
  if (items.length >= 2) {
    btn.classList.remove('disabled');
    btn.removeAttribute('title');
  } else {
    btn.classList.add('disabled');
    btn.setAttribute('title', 'Itinerary must have at least 2 items to generate route');
  }
}

function generateAndDisplayRoute() {
  const raw = localStorage.getItem('ts_itinerary');
  const items = raw ? JSON.parse(raw) : [];

  if (items.length < 2) return;

  const placeIds = items.map(item => item.place_id);
  const service = new google.maps.places.PlacesService(document.createElement('div'));

  const locations = [];
  let completed = 0;

  placeIds.forEach((id, index) => {
    service.getDetails({ placeId: id, fields: ['geometry'] }, (place, status) => {
      completed++;
      if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        locations[index] = place.geometry.location;
      } else {
        console.warn("Failed to get location for place:", id);
      }

      if (completed === placeIds.length) {
        if (locations.length !== placeIds.length) return alert("One or more locations failed.");

        const origin = locations[0];
        const destination = locations[locations.length - 1];
        const waypoints = locations.slice(1, -1).map(loc => ({ location: loc, stopover: true }));

        const request = {
          origin,
          destination,
          waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, (response, status) => {
          console.log("Directions response:", response, "Status:", status);

          if (status === 'OK') {
            const legs = response.routes[0].legs;
            directionsRenderer.setDirections(response);
          } else {
            alert('Failed to generate route: ' + status);
          }
        });
      }
    });
  });
}
