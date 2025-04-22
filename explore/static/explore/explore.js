let map;
let service;
let infoWindow;
let destinationMarker = null;
let placeMarkers = [];
let photoIndex = 0;
let photoList = [];

function initMap(lat = 33.7490, lng = -84.3880) {
  // grab DOM elements
  const mapDiv         = document.getElementById('map');
  const input          = document.getElementById('autocomplete');
  const categorySelect = document.querySelector("select[name='category']");

  // parse any existing URL params
  const params   = new URLSearchParams(window.location.search);
  const destParam   = params.get('destination');
  const categoryParam = params.get('category') || '';

  // hide map until we search
  if (destParam) {
    mapDiv.style.visibility = 'hidden';
  }

  // initialize map & services
  const defaultLocation = new google.maps.LatLng(lat, lng);
  map = new google.maps.Map(mapDiv, {
    center: defaultLocation,
    zoom: 14,
  });
  service    = new google.maps.places.PlacesService(map);
  infoWindow = new google.maps.InfoWindow();

  // wire up autocomplete
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  document.getElementById('explore-form').addEventListener('submit', e => {
    e.preventDefault();
    const destination = input.value.trim();
    const category    = categorySelect.value;
    if (!destination) return alert('Please enter a destination.');

    const newParams = new URLSearchParams();
    newParams.set('destination', destination);
    if (category) newParams.set('category', category);
    window.history.pushState({}, '', window.location.pathname + '?' + newParams);

    // run search
    searchPlaces(destination, category);
  });

  //refresh forward backward handler
  window.addEventListener('popstate', () => {
    const p     = new URLSearchParams(window.location.search);
    const dest  = p.get('destination');
    const cat   = p.get('category') || '';
    if (dest) {
      input.value          = dest;
      categorySelect.value = cat;
      searchPlaces(dest, cat);
    } else {
      // no params → clear map
      clearPlaceMarkers();
      if (destinationMarker) destinationMarker.setMap(null);
    }
  });

  if (destParam) {
    input.value          = destParam;
    categorySelect.value = categoryParam;
    searchPlaces(destParam, categoryParam);
  } else {
    mapDiv.style.visibility = 'visible';
  }

  // preserve your POI‑click handler
  map.addListener('click', event => {
    if (event.placeId) {
      event.stop();
      handlePOIClick(event.placeId);
    }
  });
}

function searchPlaces(query, category) {
  const input = document.getElementById("autocomplete");
  const destination = input ? input.value : "";

  if (!destination || destination.trim() === "") {
    alert("Please enter a destination.");
    return;
  }

  if (destinationMarker) destinationMarker.setMap(null);
  clearPlaceMarkers();

  const request = {
    query: destination,
    fields: ["geometry"],
  };

  const placesService = new google.maps.places.PlacesService(map);
  placesService.findPlaceFromQuery(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
      const location = results[0].geometry.location;

      map.setCenter(location);

      document.getElementById('map').style.visibility = 'visible';

      destinationMarker = new google.maps.Marker({
        map,
        position: location,
        title: query,

        // title: "Selected Destination",
        // icon: {
        //   url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        //   scaledSize: new google.maps.Size(45, 45)
        // }
      });

      findNearby(location, category);
    } else {
      alert("Location not found: " + status);
    }
  });
}

function findNearby(location, category) {
  // map our dropdown values to Places types
  const categoryMap = {
    food: 'restaurant',
    cafes: 'cafe',
    nightlife: 'bar',
    shopping: 'shopping_mall',
    museums: 'museum',
    parks: 'park',
    art: 'art_gallery',
    hotels: 'lodging',
    attractions: 'tourist_attraction',
    religion: 'church',
    entertainment: 'movie_theater'
  };

  // clear any old markers
  clearPlaceMarkers();

  // decide which types to search
  const typesToSearch = category
    ? [ categoryMap[category] ]
    : [
        'restaurant', 'cafe', 'park',
        'museum', 'art_gallery',
        'shopping_mall', 'lodging',
        'tourist_attraction', 'church',
        'movie_theater'
      ];

  const allResults = [];
  let completed = 0;

  typesToSearch.forEach(type => {
    const request = { location, radius: 2000, type };
    const localService = new google.maps.places.PlacesService(map);

    localService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK
          && results && results.length > 0) {
        allResults.push(...results);
      } else {
        console.warn(`No nearby places for type "${type}": ${status}`);
      }

      completed++;

      if (completed === typesToSearch.length) {
        const unique = deduplicatePlaces(allResults);
        const sampled = shuffle(unique).slice(0, 20);
        displayResults(sampled);
        sampled.forEach((place, i) => createMarker(place, i));
      }
    });
  });
}


function deduplicatePlaces(places) {
  const seen = new Set();
  return places.filter(p => {
    if (!p.place_id || seen.has(p.place_id)) return false;
    seen.add(p.place_id);
    return true;
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createMarker(place, index = 0) {
  if (!place.geometry || !place.geometry.location) {
    console.warn(`Skipping place without geometry: ${place.name}`);
    return;
  }

  const infoCard = generateInfoCard(place);

  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
    title: place.name,
    icon: {
    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    },
    opacity: 0 // start hidden
  });

  placeMarkers.push(marker);

  // Animate pulse-in using opacity only (avoids icon errors)
  setTimeout(() => {
    let opacity = 0;
    const interval = setInterval(() => {
      opacity += 0.1;
      marker.setOpacity(opacity);
      if (opacity >= 1) clearInterval(interval);
    }, 16); // 60fps fade-in
  }, index * 10); // staggered delay

  const infowindow = new google.maps.InfoWindow({ content: infoCard });

  marker.addListener("mouseover", () => infowindow.open(map, marker));
  marker.addListener("mouseout", () => infowindow.close());
  marker.addListener("click", () => {
    if (place.place_id) showPlaceDetails(place.place_id);
  });
}

function generateInfoCard(place) {
  const name = place.name || "Unnamed Place";
  const rating = place.rating || 0;
  const ratingCount = place.user_ratings_total || 0;
  const priceLevel = place.price_level ?? -1;
  const types = place.types || [];
  const status = place.business_status || "OPERATIONAL";
  const category = formatPlaceType(types);

  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 150, maxHeight: 100 });
  const imageHTML = photoUrl
    ? `<img src="${photoUrl}" alt="Place image" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 12px;">`
    : '';

  // Build star rating display
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let starsHTML = '';
  for (let i = 0; i < fullStars; i++) starsHTML += '★';
  if (halfStar) starsHTML += '☆';
  for (let i = 0; i < emptyStars; i++) starsHTML += '☆';

  // Build price level display
  let priceHTML = '';
  const adjusted = Math.max(1, priceLevel);
  for (let i = 0; i < 4; i++) {
    priceHTML += `<span style="color:${i < adjusted ? '#2e7d32' : '#ccc'}">$</span>`;
  }

  const statusHTML = (status === 'OPERATIONAL')
    ? `<span style="color:#2e7d32;">🟢 Open now</span>`
    : `<span style="color:#c62828;">🔴 Closed</span>`;

  return `
    <div style="display: flex; align-items: center; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0;">
      ${imageHTML}
      <div style="line-height: 1.4; font-size: 14px;">
        <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${name}</div>
        <div style="font-size: 13px;">${starsHTML} (${rating.toFixed(1)}) · ${ratingCount}</div>
        <div style="font-size: 13px;">${priceHTML} · ${category}</div>
        <div style="font-size: 13px; margin-top: 4px;">${statusHTML}</div>
      </div>
    </div>
  `;
}

function clearPlaceMarkers() {
  placeMarkers.forEach(marker => marker.setMap(null));
  placeMarkers = [];
}

function displayResults(results) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (!results || results.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "place-result no-results";
    noResults.innerHTML = `
      <div class="place-title">No results found</div>
      <div style="font-size: 14px; color: #666; margin-top: 4px;">
        Try adjusting the destination or category.
      </div>
    `;
    resultsDiv.appendChild(noResults);
    return;
  }

  results.forEach(place => {
    const el = document.createElement("div");
    el.className = "place-result";

    const rating = place.rating || 0;
    const ratingCount = place.user_ratings_total || 0;
    const priceLevel = place.price_level ?? -1;
    const types = place.types || [];
    const businessStatus = place.business_status || "OPERATIONAL";

    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) starsHTML += '<span class="star full">★</span>';
    if (halfStar) starsHTML += '<span class="star half">★</span>';
    for (let i = 0; i < emptyStars; i++) starsHTML += '<span class="star empty">★</span>';

    let priceHTML = '';
    const adjustedPriceLevel = Math.max(1, priceLevel);
    for (let i = 0; i < 4; i++) {
      priceHTML += `<span class="price-sign ${i < adjustedPriceLevel ? 'filled' : 'empty'}">$</span>`;
    }

    const readableType = formatPlaceType(types);

    let statusHTML = '';
    if (businessStatus !== 'OPERATIONAL') {
      const statusMap = {
        'CLOSED_TEMPORARILY': 'Temporarily Closed',
        'CLOSED_PERMANENTLY': 'Permanently Closed'
      };
      statusHTML = `<div class="place-status status-${businessStatus.toLowerCase()}">🔴 ${statusMap[businessStatus] || 'Closed'}</div>`;
    } else {
      statusHTML = `<div class="place-status status-open">🟢 Open now</div>`;
    }

    el.innerHTML = `
      <div class="place-title">${place.name}</div>
      <div class="star-rating">
        <span class="star-number">${rating.toFixed(1)}</span>
        ${starsHTML}
        <span class="rating-count">(${ratingCount})</span>
      </div>
      <div class="details-line">
        <span class="price-group">${priceHTML}</span>
        <span class="separator">|</span>
        <span class="place-type">${readableType}</span>
      </div>
      ${statusHTML}
    `;

    el.addEventListener("click", () => {
      if (place.place_id) showPlaceDetails(place.place_id);
    });

    resultsDiv.appendChild(el);


    window.dispatchEvent(new CustomEvent('placeCard', {
      detail: { el, place }
    }));
  });
}

function formatPlaceType(types) {
  if (!types || types.length === 0) return 'Unknown';
  const type = types.find(t =>
    ['restaurant', 'museum', 'park', 'bar', 'cafe', 'zoo', 'art_gallery', 'amusement_park',
      'shopping_mall', 'lodging', 'tourist_attraction', 'church', 'movie_theater'].includes(t)
  ) || types[0];

  const emojiMap = {
    restaurant: '🍽️ Restaurant',
    museum: '🏛️ Museum',
    park: '🌳 Park',
    bar: '🍸 Bar',
    cafe: '☕ Cafe',
    zoo: '🦁 Zoo',
    art_gallery: '🖼️ Art Gallery',
    amusement_park: '🎢 Amusement Park',
    shopping_mall: '🛍️ Shopping',
    lodging: '🛏️ Hotel',
    tourist_attraction: '📸 Tourist Spot',
    church: '⛪ Church',
    movie_theater: '🎬 Movie Theater'
  };

  return emojiMap[type] || type.replace(/_/g, ' ');
}

function showPlaceDetails(placeId) {
  const service = new google.maps.places.PlacesService(document.createElement('div'));
  service.getDetails({
    placeId,
    fields: ['name', 'formatted_address', 'rating', 'price_level', 'website', 'photos', 'reviews', 'types', 'business_status', 'user_ratings_total']
  }, (place, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;

    // Elements
    const modal = document.getElementById('place-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const titleEl = document.getElementById('modal-title');
    const addressEl = document.getElementById('modal-address');
    const ratingEl = document.getElementById('modal-rating');
    const priceEl = document.getElementById('modal-price');
    const websiteBtn = document.getElementById('modal-website');
    const photoImg = document.getElementById('modal-photo-img');
    const reviewsEl = document.getElementById('modal-reviews');

    // Clear duplicate content
    const existingTypeBlock = document.querySelector('.place-type-block');
    if (existingTypeBlock) existingTypeBlock.remove();

    // ✨ Basic Info
    titleEl.textContent = place.name || 'Unknown';
    addressEl.textContent = place.formatted_address || '';

    // ✨ Star Rating + Review Count
    const rating = place.rating || 0;
    const ratingCount = place.user_ratings_total || 0;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) starsHTML += '<span class="star full">★</span>';
    if (halfStar) starsHTML += '<span class="star half">★</span>';
    for (let i = 0; i < emptyStars; i++) starsHTML += '<span class="star empty">★</span>';
    ratingEl.innerHTML = `
      <div class="star-rating">
        <span class="star-number">${rating.toFixed(1)}</span>
        ${starsHTML}
        <span class="rating-count">(${ratingCount})</span>
      </div>
    `;

    // 💲 Price Level
    const priceLevel = place.price_level ?? -1;
    let priceHTML = '';
    const adjustedPriceLevel = Math.max(1, priceLevel);
    for (let i = 0; i < 4; i++) {
      priceHTML += `<span class="price-sign ${i < adjustedPriceLevel ? 'filled' : 'empty'}">$</span>`;
    }
    priceEl.innerHTML = priceHTML;

    // 📍 Type (with emoji)
    const type = formatPlaceType(place.types);
    const business_status = place.business_status === 'OPERATIONAL' ?
      '<div class="place-status status-open">🟢 Open now</div>' :
      '<div class="place-status status-closed">🔴 Closed</div>';
    const typeBlock = document.createElement('div');
    typeBlock.className = 'place-type-block';
    typeBlock.innerHTML = `
      <div class="details-line" style="margin-top: 8px;">
        ${business_status}
        <div class="place-type">${type}</div>
      </div>
    `;
    priceEl.insertAdjacentElement('afterend', typeBlock);

    // 🌐 Website Button
    if (place.website) {
      websiteBtn.href = place.website;
      websiteBtn.textContent = 'Visit Website';
      websiteBtn.classList.add('btn');
      websiteBtn.style.display = 'inline-block';
    } else {
      websiteBtn.style.display = 'none';
    }

    // 📷 Photo
    photoList = place.photos || [];
    photoIndex = 0;
    const updatePhotoDisplay = () => {
      if (photoList.length > 0) {
        photoImg.src = photoList[photoIndex].getUrl({ maxWidth: 600 });
        photoImg.style.display = 'block';
      } else {
        photoImg.src = 'https://maps.gstatic.com/tactile/basepage/no_photo-1x.png';
        photoImg.style.display = 'block';
      }
    };
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

    // 🗣 Reviews
    reviewsEl.innerHTML = '';
    if (place.reviews && place.reviews.length > 0) {
      const label = document.createElement('h3');
      label.textContent = '🗣️ Reviews';
      label.style.margin = '16px 0 8px';
      reviewsEl.appendChild(label);

      const scrollBox = document.createElement('div');
      scrollBox.style.maxHeight = '200px';
      scrollBox.style.overflowY = 'auto';

      place.reviews.forEach(r => {
        const p = document.createElement('p');
        p.className = 'review';

        const full = Math.floor(r.rating);
        const half = r.rating % 1 >= 0.25 && r.rating % 1 < 0.75;
        let reviewStars = '';
        for (let i = 0; i < full; i++) reviewStars += '<span class="star full">★</span>';
        if (half) reviewStars += '<span class="star half">★</span>';
        for (let i = 0; i < 5 - full - (half ? 1 : 0); i++) reviewStars += '<span class="star empty">★</span>';

        p.innerHTML = `<div class="review-stars">${reviewStars}</div><div class="review-text">${r.text}</div>`;
        scrollBox.appendChild(p);
      });
      reviewsEl.appendChild(scrollBox);
    }

    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
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

// Safety fallback: retry map init after short delay if map didn't load
setTimeout(() => {
  if (!map || typeof map.getCenter !== 'function') {
    console.warn("Map failed to initialize. Retrying...");
    initMap();
  }
}, 500); // Try after 1.5 seconds