const swedenBoundingBox = { minLat: 55, minLng: 11, maxLat: 69, maxLng: 24 };
const mapImage = document.getElementById("swedenMap");
const markerLayer = document.getElementById("markerLayer");
const cityInfo = document.getElementById("cityInfo");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");

let cities = [];
let zoomLevel = 1, panX = 0, panY = 0;
let isDragging = false, startX, startY;

// Load city data
async function loadCities() {
  const res = await fetch("data/swedenCities.json");
  cities = await res.json();
  cityInfo.innerHTML = `<p>Loaded ${cities.length} cities</p>`;
}
loadCities();

// -------------------
// Map interactions
// -------------------
const imageBox = mapImage.parentElement;

imageBox.addEventListener("mousedown", e => {
  isDragging = true; startX = e.clientX - panX; startY = e.clientY - panY;
});
window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  panX = e.clientX - startX; panY = e.clientY - startY;
  updateTransform();
});
window.addEventListener("mouseup", () => { isDragging = false; });

// Zoom buttons
zoomIn.addEventListener("click", () => { zoomLevel *= 1.2; updateTransform(); });
zoomOut.addEventListener("click", () => { zoomLevel /= 1.2; updateTransform(); });

// Update map transform
function updateTransform() {
  mapImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  markerLayer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

// -------------------
// Marker functions
// -------------------
function latLngToImagePosition(lat, lng) {
    const img = mapImage;

    // Aspect ratios
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = img.clientWidth / img.clientHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imgAspect > boxAspect) {
        // Image fits width, vertical letterbox
        displayWidth = img.clientWidth;
        displayHeight = displayWidth / imgAspect;
        offsetX = 0;
        offsetY = (img.clientHeight - displayHeight) / 2;
    } else {
        // Image fits height, horizontal letterbox
        displayHeight = img.clientHeight;
        displayWidth = displayHeight * imgAspect;
        offsetX = (img.clientWidth - displayWidth) / 2;
        offsetY = 0;
    }

    // Compute normalized ratios
    const xRatio = (lng - swedenBoundingBox.minLng) / (swedenBoundingBox.maxLng - swedenBoundingBox.minLng);
    const yRatio = 1 - (lat - swedenBoundingBox.minLat) / (swedenBoundingBox.maxLat - swedenBoundingBox.minLat);

    // Convert to actual pixel positions
    return {
        x: xRatio * displayWidth + offsetX,
        y: yRatio * displayHeight + offsetY
    };
}

// -------------------
// Search city
// -------------------
document.getElementById("searchButton").addEventListener("click", () => {
  const name = document.getElementById("cityInput").value.trim().toLowerCase();
  const city = cities.find(c => c.name.toLowerCase() === name);
  if (!city) return alert("City not found");
  showMarker(city);
});