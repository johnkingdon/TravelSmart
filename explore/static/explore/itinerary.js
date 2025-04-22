// itinerary.js
console.log('🛠️ itinerary.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  // ── State & Persistence ───────────────────
  let itinerary = [];
  const STORAGE_KEY = 'ts_itinerary';

  function saveItinerary() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
  }

  function loadItinerary() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      itinerary = JSON.parse(raw);
      itinerary.forEach(renderItineraryItem);
    }
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

    // remove handler
    div.querySelector('.remove-btn').onclick = () =>
      removeItineraryItem(item.itemId);

    // reorder handlers
    div.addEventListener('dragstart', dragStart);
    div.addEventListener('dragover', e => e.preventDefault());
    div.addEventListener('drop', dropOnItem);
  }

  // ── Add new from a place object ──────────
  function addItineraryItem(place) {
    const item = {
      itemId: Date.now().toString() + Math.random().toString(36).substr(2,6),
      place_id: place.place_id,
      name: place.name
    };
    itinerary.push(item);
    saveItinerary();
    renderItineraryItem(item);
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
});
