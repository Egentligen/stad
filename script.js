const swedenBoundingBox = { minLat: 55, minLng: 11, maxLat: 69, maxLng: 24 };

const mapImage = document.getElementById("swedenMap");
const markerLayer = document.getElementById("markerLayer");
const imageBox = document.getElementById("imageBox");
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
// Panning (click and drag anywhere in imageBox)
// -------------------
imageBox.addEventListener("mousedown", e => {
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    imageBox.classList.add("dragging");
});
window.addEventListener("mousemove", e => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
});
window.addEventListener("mouseup", () => {
    isDragging = false;
    imageBox.classList.remove("dragging");
});

// -------------------
// Zoom buttons
// -------------------
zoomIn.addEventListener("click", () => { zoomLevel *= 1.2; updateTransform(); });
zoomOut.addEventListener("click", () => { zoomLevel /= 1.2; updateTransform(); });

// -------------------
// Update map & marker transform
// -------------------
function updateTransform() {
    mapImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    markerLayer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

// -------------------
// Lat/lng -> displayed image position
// -------------------
function latLngToImagePosition(lat, lng) {
    const img = mapImage;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = img.clientWidth / img.clientHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imgAspect > boxAspect) {
        displayWidth = img.clientWidth;
        displayHeight = displayWidth / imgAspect;
        offsetX = 0;
        offsetY = (img.clientHeight - displayHeight) / 2;
    } else {
        displayHeight = img.clientHeight;
        displayWidth = displayHeight * imgAspect;
        offsetX = (img.clientWidth - displayWidth) / 2;
        offsetY = 0;
    }

    const xRatio = (lng - swedenBoundingBox.minLng) / (swedenBoundingBox.maxLng - swedenBoundingBox.minLng);
    const yRatio = 1 - (lat - swedenBoundingBox.minLat) / (swedenBoundingBox.maxLat - swedenBoundingBox.minLat);

    return {
        x: xRatio * displayWidth + offsetX,
        y: yRatio * displayHeight + offsetY
    };
}

// -------------------
// Show marker
// -------------------
let namedCities = new Set(); // Keep track of named cities
let totalPopulation = 0;

function showMarker(city) {
    // If this city hasn't been named before, count it
    if (!namedCities.has(city.name)) {
        namedCities.add(city.name);
        totalPopulation += city.population;
    }

    // Map lat/lng to image position
    const pos = latLngToImagePosition(city.lat, city.lng);
    const marker = document.createElement("div");
    marker.className = "marker";

    // Scale marker by population (normalize between 10px and 50px)
    const minSize = 10, maxSize = 50;
    const minPop = 5000;   // adjust based on your dataset
    const maxPop = 2000000; // adjust based on your dataset
    let size = ((city.population - minPop) / (maxPop - minPop)) * (maxSize - minSize) + minSize;
    size = Math.max(minSize, Math.min(size, maxSize));
    marker.style.width = size + "px";
    marker.style.height = size + "px";

    marker.style.left = pos.x + "px";
    marker.style.top = pos.y + "px";

    // Random slight color variation
    const hue = 50 + Math.random() * 40; // yellow-orange range
    marker.style.backgroundColor = `hsla(${hue}, 100%, 50%, 0.7)`;

    markerLayer.appendChild(marker);

    // Update city info
    cityInfo.innerHTML = `
        <h2>${city.name}</h2>
        <p><strong>Population:</strong> ${city.population}</p>
        <p><strong>Coordinates:</strong> ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}</p>
    `;

    // Update stats
    updateStats();
}

function updateStats() {
    let statsDiv = document.getElementById("stats");
    if (!statsDiv) {
        statsDiv = document.createElement("div");
        statsDiv.id = "stats";
        cityInfo.appendChild(statsDiv);
    }
    statsDiv.innerHTML = `
        Total cities named: ${namedCities.size}<br>
        Total population named: ${totalPopulation.toLocaleString()}
    `;
}

// -------------------
// Search
// -------------------
document.getElementById("searchButton").addEventListener("click", () => {
    const name = document.getElementById("cityInput").value.trim().toLowerCase();
    const city = cities.find(c => c.name.toLowerCase() === name);
    if (!city) return alert("City not found");
    showMarker(city);
});