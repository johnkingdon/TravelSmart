// itinerary.js
console.log('🛠️ itinerary.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  // ── State & Persistence ───────────────────
  let itinerary = [];
  const STORAGE_KEY = 'ts_itinerary';

  function saveItinerary() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));

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

  // ── Add new from a place object ──────────
  function addItineraryItem(place) {
    const item = {
      itemId: Date.now().toString() + Math.random().toString(36).substr(2,6),
      place_id: place.place_id,
      name: place.name
    };
    itinerary.push(item);
    renderItineraryItem(item);
    saveItinerary();
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
    if (raw) addItineraryItem(JSON.parse(raw));
  });

  // ── Wire up new cards from explore.js ────
  window.addEventListener('placeCard', e => {
    const { el, place } = e.detail;
    el.draggable = true;
    el.addEventListener('dragstart', ev => {
      ev.dataTransfer.setData(
        'application/json',
        JSON.stringify({ place_id: place.place_id, name: place.name })
      );
    });
  });

  // ── Kick things off ──────────────────────
  loadItinerary();
  updateItineraryNumbers();
});