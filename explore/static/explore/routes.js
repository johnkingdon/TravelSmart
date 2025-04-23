let directionsRenderer = null;
let directionsService = null;

window.setupRouting = function(map) {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true
  });
};

let customRouteMarkers = [];

function createNumberedMarker(position, number, labelText) {
  return new google.maps.Marker({
    position: position,
    label: {
      text: number.toString(),
      color: 'white',
      fontWeight: 'bold'
    },
    map: window.map,
    title: labelText
  });
}
function clearCustomMarkers() {
  customRouteMarkers.forEach(m => m.setMap(null));
  customRouteMarkers = [];
}

document.addEventListener('DOMContentLoaded', () => {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true
  });

  const routeBtn = document.getElementById('generate-route-btn');
  if (window.map instanceof google.maps.Map) {
    directionsRenderer.setMap(window.map);
  } else {
    console.warn("Map instance not available yet for directions rendering.");
  }


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

  const placeIds = items.filter(item => item.place_id).map(item => item.place_id);
  if (placeIds.length < 2) return alert("Not enough valid places to generate route.");

  const service = new google.maps.places.PlacesService(document.createElement('div'));
  const locations = [];
  let completed = 0;

  // Array to track custom markers
  window.customRouteMarkers = window.customRouteMarkers || [];

  // Cleanup old markers
  function clearCustomMarkers() {
    window.customRouteMarkers.forEach(marker => marker.setMap(null));
    window.customRouteMarkers = [];
  }

  // Create numbered marker
  function createNumberedMarker(position, number, title) {
    const marker = new google.maps.Marker({
      position,
      label: `${number}`,
      map: window.map,
      title
    });
    window.customRouteMarkers.push(marker);
  }

  placeIds.forEach((id, index) => {
    service.getDetails({ placeId: id, fields: ['geometry', 'name'] }, (place, status) => {
      completed++;
      if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        locations[index] = {
          location: place.geometry.location,
          name: place.name
        };
      } else {
        console.warn("Failed to get location for place:", id);
      }

      if (completed === placeIds.length) {
        if (locations.length !== placeIds.length) return alert("One or more locations failed.");

        const origin = locations[0].location;
        const destination = locations[locations.length - 1].location;
        const waypoints = locations.slice(1, -1).map(loc => ({ location: loc.location, stopover: true }));

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
            directionsRenderer.setDirections(response);

            clearCustomMarkers();

            const legs = response.routes[0].legs;

            // Add numbered markers at start of each leg
            legs.forEach((leg, i) => {
              createNumberedMarker(leg.start_location, i + 1, leg.start_address);

              if (i === legs.length - 1) {
                createNumberedMarker(leg.end_location, i + 2, leg.end_address);
              }
            });

            // Total distance/time
            let totalDist = 0;
            let totalTime = 0;
            legs.forEach(leg => {
              totalDist += leg.distance.value;
              totalTime += leg.duration.value;
            });

            // Calculate gas cost
            const totalMiles = totalDist / 1609.34;
            const mpg = 25;
            const gasPrice = 3.5;
            const gasCost = (totalMiles / mpg) * gasPrice;

            // Update summary box
            const infoBox = document.getElementById('route-info-box');
            infoBox.classList.remove('hidden');
            infoBox.innerHTML = `
              <div class="title">Route Summary</div>
              🚗 <strong>Distance:</strong> ${totalMiles.toFixed(2)} mi<br>
              ⏱️ <strong>Time:</strong> ${(totalTime / 60).toFixed(1)} mins<br>
              ⛽ <strong>Estimated Gas Cost:</strong> $${gasCost.toFixed(2)}
            `;
          } else {
            alert('Failed to generate route: ' + status);
          }
        });
      }
    });
  });
}