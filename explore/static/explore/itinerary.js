// itinerary.js
console.log('🛠️ itinerary.js loaded');

function saveItineraryLog(destination, category, priceFilter) {
  fetch('/save-itinerary/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: new URLSearchParams({
      destination: destination,
      category: category,
      price_filter: priceFilter
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Itinerary log saved:', data);
  })
  .catch(error => {
    console.error('Error saving itinerary log:', error);
  });
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('DOMContentLoaded', () => {
  // ── State & Persistence ───────────────────
  let itinerary = [];
  const STORAGE_KEY = 'ts_itinerary';

  function saveItinerary() {
    // Persist full itinerary item info (with address, rating, category, price_level, etc.)
    const cleaned = itinerary.map(item => ({
      itemId: item.itemId,
      place_id: item.place_id,
      name: item.name,
      address: item.address || 'Address not available',
      rating: item.rating || null,
      price_level: item.price_level || null,
      category: item.category || ''
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));

    window.dispatchEvent(new Event('itineraryUpdated'));
    updateItineraryNumbers();
  }


  function loadItinerary() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        itinerary = JSON.parse(raw).filter(item => item && item.itemId && item.name && item.place_id);
        itinerary.forEach(renderItineraryItem);
      } catch (e) {
        console.error("Failed to parse itinerary from localStorage:", e);
        itinerary = [];
      }
    }
  }

  function updateItineraryNumbers() {
    const cards = document.querySelectorAll('.itinerary-item');
    cards.forEach((card, index) => {
      let numberLabel = card.querySelector('.number-label');
      if (!numberLabel) {
        numberLabel = document.createElement('span');
        numberLabel.className = 'number-label';
        card.prepend(numberLabel);
      }
      numberLabel.textContent = `${index + 1}`;
    });
  }

  window.addEventListener('itineraryUpdated', () => {
    const list = document.getElementById('itinerary-list');
    list.innerHTML = '<p class="empty-text">Drag destinations here</p>';
    loadItinerary();
    updateItineraryNumbers();
  });

  // ── Render a saved item ───────────────────
  function renderItineraryItem(item) {
    const list = document.getElementById('itinerary-list');
    list.querySelector('.empty-text')?.remove();

    const div = document.createElement('div');
    div.className = 'itinerary-item';
    div.draggable = true;
    div.dataset.itemId = item.itemId;
    div.innerHTML = `
      <span>${item.name}</span>
      <button class="remove-btn" title="Remove">×</button>
    `;
    list.appendChild(div);

    // Add hover events to highlight corresponding marker
    const placeId = item.place_id;
    div.dataset.placeId = placeId;

    /*
    div.addEventListener('mouseenter', () => {
      const marker = window.markerMap?.[placeId];
      if (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    });

    div.addEventListener('mouseleave', () => {
      const marker = window.markerMap?.[placeId];
      if (marker) {
        marker.setAnimation(null);
      }
    });
    /*

     */
    // remove handler
    div.querySelector('.remove-btn').onclick = () =>
      removeItineraryItem(item.itemId);

    div.addEventListener('click', (e) => {
      if (e.target.closest('.remove-btn')) return; // ignore clicks on the ❌
      if (placeId) showPlaceDetails(placeId);
    });

    // reorder handlers
    div.addEventListener('dragstart', dragStart);
    div.addEventListener('dragover', e => {
      e.preventDefault();
      const rect = div.getBoundingClientRect();
      const isAboveHalf = e.clientY < rect.top + rect.height / 2;

      div.classList.toggle('drop-before', isAboveHalf);
      div.classList.toggle('drop-after', !isAboveHalf);
    });

    div.addEventListener('dragleave', () => {
      div.classList.remove('drop-before', 'drop-after');
    });

    div.addEventListener('drop', e => {
      e.preventDefault();
      const rect = div.getBoundingClientRect();
      const isAboveHalf = e.clientY < rect.top + rect.height / 2;

      const list = div.parentNode;
      if (draggedItem && draggedItem !== div) {
        if (isAboveHalf) {
          list.insertBefore(draggedItem, div);
        } else {
          list.insertBefore(draggedItem, div.nextSibling);
        }

        // update the state
        itinerary = Array.from(list.children)
          .filter(el => el.classList.contains('itinerary-item'))
          .map(el => itinerary.find(i => i.itemId === el.dataset.itemId));
        saveItinerary();
      }

      div.classList.remove('drop-before', 'drop-after');
    });
  }
  window.renderItineraryItem = renderItineraryItem;

  // ── Add new from a place object ──────────
  function addItineraryItem(place) {
    const item = {
      itemId: Date.now().toString() + Math.random().toString(36).substr(2,6),
      place_id: place.place_id,
      name: place.name || 'Unnamed Place',
      address: place.formatted_address || place.vicinity || 'Address not available',
      category: place.types ? place.types[0] : '',
      rating: place.rating,
      price_level: place.price_level
    };
    itinerary.push(item);
    renderItineraryItem(item);
    saveItinerary();

    // ✅ Log the added item:
    const destination = place.name;
    const category = place.types ? place.types[0] : '';            // Handles category if available
    const priceFilter = place.price_level ?? '';                   // Handles price_level if available
    saveItineraryLog(destination, category, priceFilter);
  }

  const addToItineraryService = new google.maps.places.PlacesService(document.createElement('div'));
  function addToItineraryFromPlaceId(placeId) {
    addToItineraryService.getDetails({
      placeId,
      fields: ['name', 'formatted_address', 'rating', 'price_level', 'types', 'place_id']
    }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        addItineraryItem(place);
      } else {
        alert("Could not load details for selected place.");
      }
    });
  }

  // ── Remove by its unique id ──────────────
  function removeItineraryItem(itemId) {
    const idx = itinerary.findIndex(i => i.itemId === itemId);
    if (idx > -1) {
      itinerary.splice(idx, 1);
      saveItinerary();
    }
    document
      .querySelector(`.itinerary-item[data-item-id="${itemId}"]`)
      ?.remove();
    if (!itinerary.length) {
      document.getElementById('itinerary-list')
        .innerHTML = '<p class="empty-text">Drag destinations here</p>';
    }
  }

  // ── Drag & drop within list ──────────────
  let draggedItem = null;
  function dragStart(e) {
    draggedItem = e.currentTarget;
  }
  function dropOnItem(e) {
    e.preventDefault();
    if (!draggedItem || draggedItem === this) return;
    const list = this.parentNode;
    const rect = this.getBoundingClientRect();
    if (e.clientY < rect.top + rect.height/2) {
      list.insertBefore(draggedItem, this);
    } else {
      list.insertBefore(draggedItem, this.nextSibling);
    }
    // rebuild order
    itinerary = Array.from(list.children)
      .filter(el => el.classList.contains('itinerary-item'))
      .map(el => itinerary.find(i => i.itemId === el.dataset.itemId));
    saveItinerary();
  }

  // ── Trash‑can drop to delete ─────────────
  const trash = document.getElementById('itinerary-trash');
  trash.addEventListener('dragover', e => {
    e.preventDefault();
    trash.classList.add('dragover');
  });
  trash.addEventListener('dragleave', () => {
    trash.classList.remove('dragover');
  });
  trash.addEventListener('drop', e => {
    e.preventDefault();
    trash.classList.remove('dragover');
    if (draggedItem) {
      removeItineraryItem(draggedItem.dataset.itemId);
      draggedItem = null;
    }
  });

  // ── Accept drops from Explore cards ──────
  const listEl = document.getElementById('itinerary-list');
  listEl.addEventListener('dragover', e => e.preventDefault());
  listEl.addEventListener('drop', e => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (raw) {
      const dropped = JSON.parse(raw);

      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails({
        placeId: dropped.place_id,
        fields: ['name', 'formatted_address', 'rating', 'price_level', 'types', 'place_id']
      }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          addItineraryItem(place);
        } else {
          alert("Failed to fetch details for dropped place.");
        }
      });
    }
  });

  // ── Wire up new cards from explore.js ────
  window.addEventListener('placeCard', e => {
    const { el, place } = e.detail;
    el.draggable = true;
    el.addEventListener('dragstart', ev => {
      ev.dataTransfer.setData(
        'application/json',
        JSON.stringify({
          place_id: place.place_id,
          name: place.name,
          types: place.types,
          price_level: place.price_level
        })
      );
    });
  });

  // ── Kick things off ──────────────────────
  loadItinerary();
  updateItineraryNumbers();

  const downloadButton = document.getElementById('download-itinerary-pdf');
  const itineraryList = document.getElementById('itinerary-list');

  if (downloadButton && itineraryList) {
    downloadButton.addEventListener('click', () => {
      const trash = document.getElementById('itinerary-trash');
      trash.style.display = 'none';

      const raw = localStorage.getItem('ts_itinerary');
      const items = raw ? JSON.parse(raw) : [];

      if (!items.length) {
        alert("You must add at least one destination before downloading your itinerary.");
        return;
      }

      // Add download to itinerary log in admin panel
      const destinationRaw = localStorage.getItem('ts_destination');
      fetch('/explore/log-itinerary-download/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: new URLSearchParams({
          destination: items[0]?.name || 'Unknown'
        })
      });

      const container = document.createElement('div');
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.padding = '40px';
      container.style.color = '#333';

      // Title
      const title = document.createElement('h1');
      title.textContent = 'My Itinerary';
      title.style.textAlign = 'center';
      title.style.fontSize = '32px';
      title.style.marginBottom = '10px';
      container.appendChild(title);

      // Date
      const date = document.createElement('p');
      date.textContent = `Generated on: ${new Date().toLocaleDateString()}`;
      date.style.textAlign = 'center';
      date.style.marginBottom = '30px';
      date.style.color = '#666';
      container.appendChild(date);

      // Route Summary
      const summaryBox = document.createElement('div');
      summaryBox.style.border = '1px solid #ccc';
      summaryBox.style.borderRadius = '8px';
      summaryBox.style.padding = '15px';
      summaryBox.style.marginBottom = '30px';
      summaryBox.style.backgroundColor = '#f9f9f9';

      //const routeRaw = localStorage.getItem('ts_route_summary');
      //const route = routeRaw ? JSON.parse(routeRaw) : null;
      const summaryElement = document.getElementById('route-summary-box');
      const isRouteVisible = summaryElement && summaryElement.offsetParent !== null;

      if (isRouteVisible) {
        const routeRaw = localStorage.getItem('ts_route_summary');
        const route = routeRaw ? JSON.parse(routeRaw) : null;

        if (route) {
          const summaryBox = document.createElement('div');
          summaryBox.style.border = '1px solid #ccc';
          summaryBox.style.borderRadius = '8px';
          summaryBox.style.padding = '15px';
          summaryBox.style.marginBottom = '30px';
          summaryBox.style.backgroundColor = '#f9f9f9';
          summaryBox.innerHTML = `
            <strong>Route Summary</strong><br>
            ⏱️ Estimated Time: ${route.duration}<br>
            🛣️ Distance: ${route.distance}<br>
            ⛽ Estimated Gas Cost: ${route.gasCost}
          `;
          container.appendChild(summaryBox);
        }
      }

      // Destination List
      const listBox = document.createElement('div');
      listBox.style.border = '1px solid #ddd';
      listBox.style.borderRadius = '10px';
      listBox.style.padding = '25px';
      listBox.style.backgroundColor = '#fbfbfb';

      items.forEach((item, index) => {
        const itemBox = document.createElement('div');
        itemBox.style.display = 'flex';
        itemBox.style.alignItems = 'center';
        itemBox.style.marginBottom = index === items.length - 1 ? '0px' : '20px';

        const badge = document.createElement('div');
        badge.textContent = `${index + 1}`;
        badge.style.width = '28px';
        badge.style.height = '28px';
        badge.style.borderRadius = '50%';
        badge.style.backgroundColor = '#3367d6';
        badge.style.color = 'white';
        badge.style.display = 'flex';
        badge.style.justifyContent = 'center';
        badge.style.alignItems = 'center';
        badge.style.fontWeight = 'bold';
        badge.style.marginRight = '12px';
        itemBox.appendChild(badge);

        const name = document.createElement('div');
        name.textContent = item.name;
        name.style.fontWeight = '600';

        itemBox.appendChild(name);
        listBox.appendChild(itemBox);
      });

      container.appendChild(listBox);

      // Footer
      const footer = document.createElement('p');
      footer.textContent = 'Generated using TravelSmart | www.travelsmart.com';
      footer.style.fontSize = '10px';
      footer.style.color = '#aaa';
      footer.style.textAlign = 'center';
      footer.style.marginTop = '40px';
      container.appendChild(footer);

      // PDF Options
      const options = {
        margin: 0.5,
        filename: 'my_itinerary.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(options).from(container).save()
        .finally(() => {
          trash.style.display = 'block';
        });
    });
  }
});