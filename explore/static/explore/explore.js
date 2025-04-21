let map;
let service;
let infoWindow;
let destinationMarker = null;
let placeMarkers = [];
let photoIndex = 0;
let photoList = [];

function initMap(lat = 33.7490, lng = -84.3880) {
  const defaultLocation = new google.maps.LatLng(lat, lng);
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 14,
  });

  infoWindow = new google.maps.InfoWindow();

  document.getElementById("explore-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const destination = document.querySelector("input[name='destination']").value;
    const category = document.querySelector("select[name='category']").value;
    searchPlaces(destination, category);
  });

  const input = document.getElementById("autocomplete");
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);
}

function searchPlaces(query, category) {
  if (destinationMarker) destinationMarker.setMap(null);
  clearPlaceMarkers();

  const request = {
    query,
    fields: ["geometry"],
  };

  const placesService = new google.maps.places.PlacesService(map);
  placesService.findPlaceFromQuery(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
      const location = results[0].geometry.location;
      map.setCenter(location);

      destinationMarker = new google.maps.Marker({
        map,
        position: location,
        title: "Selected Destination",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });

      findNearby(location, category);
    } else {
      alert("Location not found: " + status);
    }
  });
}

function findNearby(location, category) {
  const categoryMap = {
    food: 'restaurant',
    culture: 'museum',
    shopping: 'shopping_mall',
    adventure: 'amusement_park'
  };

  const request = {
    location,
    radius: 2000,
    type: categoryMap[category] || undefined,
  };

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      displayResults(results);
      results.forEach(place => createMarker(place));
    } else {
      console.error("Nearby search failed: ", status);
    }
  });
}

function createMarker(place) {
  if (!place.geometry || !place.geometry.location) return;

  const hasPhoto = place.photos && place.photos.length > 0;
  const photoUrl = hasPhoto ? place.photos[0].getUrl({ maxWidth: 200 }) : '';

  const infoCard = `
    <div style="display: flex; align-items: center; padding: 0; margin: 0; font-family: 'Segoe UI', sans-serif; max-width: 300px;">
      ${hasPhoto ? `<img src="${photoUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 10px;">` : ''}
      <div style="margin: 0;">
        <strong>${place.name}</strong><br>
        ${place.rating ? `⭐ ${place.rating.toFixed(1)}<br>` : ''}
        ${place.price_level ? `💲 ${place.price_level.toFixed(2)}` : ''}
      </div>
    </div>
  `;

  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
    title: place.name,
  });

  placeMarkers.push(marker);

  const infowindow = new google.maps.InfoWindow({ content: infoCard });

  marker.addListener("mouseover", () => infowindow.open(map, marker));
  marker.addListener("mouseout", () => infowindow.close());

  marker.addListener("click", () => {
    if (place.place_id) {
      showPlaceDetails(place.place_id);
    }
  });
}

function clearPlaceMarkers() {
  placeMarkers.forEach(marker => marker.setMap(null));
  placeMarkers = [];
}

function displayResults(results) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  results.forEach(place => {
    const el = document.createElement("div");
    el.className = "place-result";
    el.innerHTML = `
      <strong>${place.name}</strong><br>
      ${place.rating ? `⭐ ${place.rating.toFixed(1)}<br>` : ''}
      ${place.price_level ? `💲 ${place.price_level.toFixed(2)}<br>` : ''}
    `;
    el.addEventListener("click", () => {
      if (place.place_id) showPlaceDetails(place.place_id);
    });
    resultsDiv.appendChild(el);
  });
}

function showPlaceDetails(placeId) {
  const service = new google.maps.places.PlacesService(document.createElement('div'));
  service.getDetails({
    placeId,
    fields: ['name', 'formatted_address', 'rating', 'price_level', 'website', 'photos', 'reviews']
  }, (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      document.getElementById('modal-title').textContent = place.name;
      document.getElementById('modal-address').textContent = place.formatted_address;
      document.getElementById('modal-rating').textContent = place.rating ? `⭐ ${Number(place.rating).toFixed(1)}` : '';
      document.getElementById('modal-price').textContent = place.price_level ? `💲 ${Number(place.price_level).toFixed(2)}` : '';

      const websiteBtn = document.getElementById('modal-website');
      if (place.website) {
        websiteBtn.href = place.website;
        websiteBtn.innerHTML = 'Visit Website';
        websiteBtn.classList.add('btn');
        websiteBtn.style.display = 'inline-block';
      } else {
        websiteBtn.href = '#';
        websiteBtn.innerHTML = '';
        websiteBtn.style.display = 'none';
      }

      photoList = place.photos || [];
      photoIndex = 0;

      function updatePhotoDisplay() {
        const img = document.getElementById('modal-photo-img');
        if (photoList.length > 0) {
          img.src = photoList[photoIndex].getUrl({ maxWidth: 600 });
          img.style.display = 'block';
        } else {
          img.style.display = 'none';
        }
      }

      updatePhotoDisplay();

      document.getElementById('prev-photo').onclick = () => {
        if (photoList.length > 0) {
          photoIndex = (photoIndex - 1 + photoList.length) % photoList.length;
          updatePhotoDisplay();
        }
      };

      document.getElementById('next-photo').onclick = () => {
        if (photoList.length > 0) {
          photoIndex = (photoIndex + 1) % photoList.length;
          updatePhotoDisplay();
        }
      };

      const reviewContainer = document.getElementById('modal-reviews');
      reviewContainer.innerHTML = '';

      if (place.reviews) {
        const label = document.createElement('h3');
        label.textContent = "🗣️ Reviews";
        label.style.marginTop = '15px';
        reviewContainer.appendChild(label);

        place.reviews.slice(0, 3).forEach(r => {
          const p = document.createElement('p');
          p.innerHTML = `⭐ ${r.rating}: ${r.text}`;
          reviewContainer.appendChild(p);
        });
      }

      document.getElementById('place-modal').classList.remove('hidden');
      document.getElementById('modal-backdrop').classList.remove('hidden');
    }
  });
}

document.getElementById('modal-backdrop').addEventListener('click', () => {
  document.getElementById('place-modal').classList.add('hidden');
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('place-modal').classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
});

window.initMap = initMap;