let directionsRenderer = null;
let directionsService = null;

window.routeDurationLabels = [];

window.setupRouting = function(map) {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#3367d6',
      strokeOpacity: 1,
      strokeWeight: 10
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#3367d6',
      strokeOpacity: 1,
      strokeWeight: 10
    }
  });

  const routeBtn = document.getElementById('generate-route-btn');

  if (window.map instanceof google.maps.Map) {
    directionsRenderer.setMap(window.map);
  } else {
    console.warn("Map instance not available yet for directions rendering.");
  }

  document.getElementById('clear-route-btn').addEventListener('click', clearRoute);

  routeBtn.addEventListener('click', () => {
    if (!routeBtn.classList.contains('disabled')) {
      generateAndDisplayRoute();
    }
  });

  document.getElementById('optimize-route-btn').addEventListener('click', () => {
    generateAndDisplayRoute(true); // pass optimize=true
  });

  window.addEventListener('itineraryUpdated', updateRouteButtonState);
  updateRouteButtonState();
});

function updateRouteButtonState() {
  const raw = localStorage.getItem('ts_itinerary');
  const items = raw ? JSON.parse(raw) : [];

  const generateBtn = document.getElementById('generate-route-btn');
  const optimizeBtn = document.getElementById('optimize-route-btn');

  // Generate Route Button logic
  if (items.length >= 2) {
    generateBtn.classList.remove('disabled');
    generateBtn.removeAttribute('title');
  } else {
    generateBtn.classList.add('disabled');
    generateBtn.setAttribute('title', 'Itinerary must have at least 2 items to generate route');
  }

  // Optimize Button logic – only show if route is active and there are 4+ items
  if (window.routeActive && items.length >= 4) {
    optimizeBtn.classList.remove('hidden');
  } else {
    optimizeBtn.classList.add('hidden');
  }
}

function clearRoute() {
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] });
  }

  if (window.routeDurationLabels) {
    window.routeDurationLabels.forEach(label => label.setMap(null));
    window.routeDurationLabels = [];
  }

  // Clear custom route markers if you’re using them
  if (window.customRouteMarkers) {
    window.customRouteMarkers.forEach(marker => marker.setMap(null));
    window.customRouteMarkers = [];
  }

  // Hide or clear route summary
  const summaryEl = document.getElementById('route-summary');
  if (summaryEl) {
    summaryEl.innerHTML = '';
    summaryEl.classList.add('hidden');
  }

  // Hide top info box
  const infoBox = document.getElementById('route-info-box');
  if (infoBox) {
    infoBox.classList.add('hidden');
  }

  window.routeActive = false;
  document.getElementById('clear-route-btn').classList.add('hidden');
  //document.getElementById('optimize-route-btn').classList.add('hidden');
  updateRouteButtonState()
}

window.addEventListener('itineraryUpdated', () => {
  updateRouteButtonState();

  const raw = localStorage.getItem('ts_itinerary');
  const items = raw ? JSON.parse(raw) : [];

  if (items.length >= 2 && window.routeActive) {
    generateAndDisplayRoute();
  } else {
    clearRoute();
  }
});

function getPolylineMidpoint(leg) {
  const path = [];

  leg.steps.forEach(step => {
    const decoded = google.maps.geometry.encoding.decodePath(step.polyline.points);
    path.push(...decoded);
  });

  if (path.length === 0) return leg.start_location;

  const midIndex = Math.floor(path.length / 2);
  return path[midIndex];
}

function createDurationOverlay(position, text) {
  const div = document.createElement('div');
  div.className = 'duration-label';
  div.textContent = `⏱ ${text}`;

  const overlay = new google.maps.OverlayView();
  overlay.onAdd = function () {
    const panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
  };
  overlay.draw = function () {
    const projection = this.getProjection();
    const point = projection.fromLatLngToDivPixel(position);
    if (point) {
      div.style.left = point.x + 'px';
      div.style.top = point.y + 'px';
    }
  };
  overlay.onRemove = function () {
    div.remove();
  };
  overlay.setMap(window.map);

  window.routeDurationLabels.push(overlay);
}

function addDurationLabel(leg) {
  /*
  const midpoint = getPolylineMidpoint(leg);
  const duration = leg.duration.text;

  const label = new google.maps.InfoWindow({
    content: `<div style="font-weight:bold; font-size:12px;">⏱ ${duration}</div>`,
    position: midpoint,
    pixelOffset: new google.maps.Size(0, -10),
  });

  label.open(window.map);
  window.routeDurationLabels.push(label);
   */

  window.routeDurationLabels.forEach(label => label.setMap(null));
  window.routeDurationLabels = [];

  createDurationOverlay(getPolylineMidpoint(leg), leg.duration.text);
}

function generateAndDisplayRoute(optimize = false) {
  window.routeDurationLabels = window.routeDurationLabels || [];
  window.routeActive = true;
  document.getElementById('clear-route-btn').classList.remove('hidden');

  const raw = localStorage.getItem('ts_itinerary');
  const items = raw ? JSON.parse(raw) : [];

  if (items.length < 2) return;

  const placeIds = items.filter(item => item && item.place_id).map(item => item.place_id);
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

  if (window.routeDurationLabels) {
    window.routeDurationLabels.forEach(label => label.setMap(null));
    window.routeDurationLabels = [];
  }

  // Create numbered marker
  function createNumberedMarker(position, number, title, placeId) {
    if (!placeId) return;

    const marker = new google.maps.Marker({
      position,
      label: `${number}`,
      map: window.map,
      title,
      zIndex: 1000 + number
    });
    window.customRouteMarkers.push(marker);

    if (!window.markerMap) window.markerMap = {};
    window.markerMap[placeId] = marker;
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
          optimizeWaypoints: optimize,
          travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, (response, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(response);

            clearCustomMarkers();

            // Update itinerary with optimized route (if applicable)
            if (optimize && response.routes[0].waypoint_order) {
              const order = response.routes[0].waypoint_order;
              const original = [...items];
              const reordered = [original[0], ...order.map(i => original[i + 1]), original[original.length - 1]];

              localStorage.setItem('ts_itinerary', JSON.stringify(reordered));
              window.dispatchEvent(new Event('itineraryUpdated'));

              return; // Don't regenerate right away — let itineraryUpdated handle it
            }

            const legs = response.routes[0].legs;

            legs.forEach((leg, i) => {
              createNumberedMarker(leg.start_location, i + 1, leg.start_address, items[i]?.place_id);
              if (i === legs.length - 1) {
                createNumberedMarker(leg.end_location, i + 2, leg.end_address, items[items.length - 1]?.place_id);
              }

              // ➕ Add duration label at midpoint of this leg
              const steps = leg.steps;
              if (steps && steps.length > 0) {
                const midpoint = steps[Math.floor(steps.length / 2)].start_location;
                createDurationOverlay(midpoint, leg.duration.text);
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

            //document.getElementById('optimize-route-btn').classList.remove('hidden');
            updateRouteButtonState()
          } else {
            alert('Failed to generate route: ' + status);
          }
        });
      }
    });
  });
}