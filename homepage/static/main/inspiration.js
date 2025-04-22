document.addEventListener('DOMContentLoaded', function() {
  const link       = document.getElementById('inspiration-link');
  const exploreURL = link.dataset.exploreUrl;

  //list of popular destinations
  const destinations = [
    "Eiffel Tower, Paris, France",
    "Colosseum, Rome, Italy",
    "Great Wall of China, China",
    "Machu Picchu, Peru",
    "Taj Mahal, Agra, India",
    "Pyramids of Giza, Giza, Egypt",
    "Christ the Redeemer, Rio de Janeiro, Brazil",
    "Statue of Liberty, New York City, USA",
    "Sydney Opera House, Sydney, Australia",
    "Angkor Wat, Siem Reap, Cambodia",
    "Santorini, Greece",
    "Grand Canyon, Arizona, USA",
    "Banff National Park, Alberta, Canada",
    "Mount Fuji, Honshu, Japan",
    "Petra, Jordan",
    "Northern Lights, Iceland",
    "Bora Bora, French Polynesia",
    "Galápagos Islands, Ecuador",
    "Uluru/Ayers Rock, Northern Territory, Australia",
    "Serengeti National Park, Tanzania",
    "Great Barrier Reef, Australia",
    "Iguazu Falls, Argentina/Brazil",
    "Amalfi Coast, Italy",
    "Venice Canals, Venice, Italy",
    "Barcelona, Spain",
    "London Eye, London, UK",
    "Burj Khalifa, Dubai, UAE",
    "Ban Gioc–Detian Falls, Vietnam/China",
    "Cappadocia Hot Air Balloons, Cappadocia, Turkey",
    "Redwood National Park, California, USA"
  ];

  link.addEventListener('click', function(e) {
    e.preventDefault();
    const idx  = Math.floor(Math.random() * destinations.length);
    const dest = destinations[idx];
    window.location.href = exploreURL
      + '?destination='
      + encodeURIComponent(dest);
  });
});
