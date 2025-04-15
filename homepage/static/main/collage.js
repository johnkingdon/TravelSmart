const images = document.querySelectorAll('.collage-img');

function switchImage() {
  const current = document.querySelector('.collage-img.active');
  const next = images[Math.floor(Math.random() * images.length)];

  if (next !== current) {
    current.classList.remove('active');
    next.classList.add('active');
  }

  const delay = Math.random() * 4000 + 3000;
  setTimeout(switchImage, 6000);
}

window.onload = function () {
  setTimeout(switchImage, 4000);
};
