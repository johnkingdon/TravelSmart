# TravelSmart

Area-based trip planner: select a region (type an address or click the map), surface nearby POIs with **reviews & prices**, and build a time/budget aware itinerary. Supports **drag-and-drop reordering** with **one-click route optimization** after you rearrange stops.

## ✅ Features
- Type a destination **or** click anywhere to set the area
- POIs include **reviews** and **price info**
- **Category** and **price** filters
- Itinerary builder that respects opening hours & travel time
- **Drag → Optimize:** reorder stops, then optimize the route in one click
- **Cost overview**
- **Random suggestions** on the home page
- **Export itineraries to PDF**

## 🔍 Search Destination Feature
![search_demo](https://github.com/user-attachments/assets/1eb13eb4-ee2a-4011-8557-bde17ac65974)

## 💲 Optimize/Reorder Route Feature
![optimize_demo](https://github.com/user-attachments/assets/cff5a8f8-139d-4fed-bee6-8d25a8b0407b)

## 🔧 Tech Stack
- **Backend:** Django 5 (monolith; built-in auth)
- **Database:** SQLite (dev)
- **Frontend:** Django templates + vanilla JS/CSS (`static/explore/*.js`, `*.css`)
- **Maps & Places:** Google Maps JavaScript API
  - Places: Autocomplete, Nearby Search, Place Details (ratings, reviews, price_level)
  - Directions: route drawing with `optimizeWaypoints` (re-optimizes after you reorder)
  - Geometry: polyline decoding (for mid-route labels)
- **PDF Export:** html2pdf.js (html2canvas + jsPDF bundle)
- **Email (password reset, etc.):** SMTP configured (Gmail) in `settings.py`

- ## 🔗 Links
- <a href="https://sites.google.com/view/travelsmartdemo?usp=sharing" target="_blank" rel="noopener noreferrer">Showcase website</a>
- <a href="https://youtu.be/zRYvnxVJbQg?t=145" target="_blank" rel="noopener noreferrer">Watch the demo at 2:25 (2x speed recommended)</a>
