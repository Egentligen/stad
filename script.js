const swedenBoundingBox = { minLat: 55.1, minLng: 11.1, maxLat: 69, maxLng: 24.4 };

const mapImage = document.getElementById("swedenMap");
const markerLayer = document.getElementById("markerLayer");
const imageBox = document.getElementById("imageBox");
const cityInfo = document.getElementById("cityInfo");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");

let cities = [];
let zoomLevel = 1, panX = 0, panY = 0;
let isDragging = false, startX, startY;

let namedCities = new Set();
let totalPopulation = 0;

// Load city data
async function loadCities() {
    const res = await fetch("data/swedenCities.json");
    cities = await res.json();
    cityInfo.innerHTML = `<p>Loaded ${cities.length} cities</p>`;
}
loadCities();

// -------------------
// Panning
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
// Zoom controls
// -------------------

zoomIn.addEventListener("click", () => { 
    zoomLevel *= 1.2; 
    updateTransform(); 
});

zoomOut.addEventListener("click", () => {
    zoomLevel /= 1.2; 
    updateTransform(); 
});

imageBox.addEventListener("wheel", e => {
    e.preventDefault(); // Prevent page scroll

    const rect = imageBox.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // cursor X relative to imageBox
    const mouseY = e.clientY - rect.top;  // cursor Y relative to imageBox

    const zoomFactor = 1.1; // how much to zoom per scroll tick
    const zoomOld = zoomLevel;

    if (e.deltaY < 0) {
        // scroll up = zoom in
        zoomLevel *= zoomFactor;
    } else {
        // scroll down = zoom out
        zoomLevel /= zoomFactor;
    }

    // Adjust pan so zoom centers on cursor
    panX -= (mouseX - panX) * (zoomLevel / zoomOld - 1);
    panY -= (mouseY - panY) * (zoomLevel / zoomOld - 1);

    updateTransform();
});

// -------------------
// Update map & marker transform
// -------------------

function updateTransform() {
    mapImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    markerLayer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

// -------------------
// Convert Lat/lng to displayed image position
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

    // Scale marker by population
    const minSize = 5, maxSize = 40;
    const minPop = 2000;
    const maxPop = 900000;
    let size = ((city.population - minPop) / (maxPop - minPop)) * (maxSize - minSize) + minSize;
    size = Math.max(minSize, Math.min(size, maxSize));
    marker.style.width = size + "px";
    marker.style.height = size + "px";

    marker.style.left = pos.x + "px";
    marker.style.top = pos.y + "px";

    markerLayer.appendChild(marker);

    // Update city info
    cityInfo.innerHTML = `
        <h2>${city.name}</h2>
        <p><strong>Population:</strong> ${city.population}</p>
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
        Antal städer nämnda: ${namedCities.size}<br>
        Total population: ${totalPopulation.toLocaleString()}
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