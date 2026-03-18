const swedenBoundingBox = { 
    minLat: 55.1, 
    minLng: 11.1, 
    maxLat: 69, 
    maxLng: 24.4 
};

const mapImage = document.getElementById("swedenMap");
const markerLayer = document.getElementById("markerLayer");
const imageBox = document.getElementById("imageBox");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");

let cities = [];

let zoomLevel = 1, panX = 0, panY = 0;
let isDragging = false, startX, startY;

const stockholmMarkerSizeRatio = 45;
const goteborgMarkerSizeRatio = 37.5;
const malmoMarkerSizeRatio = 30;
const minSize = 3, maxSize = 20;
const minPop = 200, maxPop = 180000;
const xOffset = 0.005;
const yOffset = -0.14;
const markerSize = 1;

let namedCities = new Set();
let totalPopulation = 0;

// Load city data
async function loadCities() {
    const res = await fetch("data/swedenCities.json");
    cities = await res.json();
}
loadCities();

// -------------------
// Panning
// -------------------

imageBox.addEventListener("mousedown", e => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
});

window.addEventListener("mousemove", e => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});

// -------------------
// Zoom controls
// -------------------

function zoomAt(screenX, screenY, factor) {
    // Convert screen → world (map space)
    const worldX = (screenX - panX) / zoomLevel;
    const worldY = (screenY - panY) / zoomLevel;

    // Apply zoom
    zoomLevel *= factor;

    // Convert back world → screen
    panX = screenX - worldX * zoomLevel;
    panY = screenY - worldY * zoomLevel;

    updateTransform();
}

zoomIn.addEventListener("click", () => {
    const rect = imageBox.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    zoomAt(centerX, centerY, 1.2);
});

zoomOut.addEventListener("click", () => {
    const rect = imageBox.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    zoomAt(centerX, centerY, 1 / 1.2);
});

imageBox.addEventListener("wheel", e => {
    e.preventDefault();

    const rect = imageBox.getBoundingClientRect();

    // Mouse position in screen space
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;

    // Convert mouse position into "world" (unscaled map space)
    const worldX = (mouseX - panX) / zoomLevel;
    const worldY = (mouseY - panY) / zoomLevel;

    // Apply zoom
    if (e.deltaY < 0) zoomLevel *= zoomFactor;
    else zoomLevel /= zoomFactor;

    // Convert back to screen space so the same point stays under cursor
    panX = mouseX - worldX * zoomLevel;
    panY = mouseY - worldY * zoomLevel;

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
// Lat/lng -> image coords
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

    return { x: xRatio * displayWidth + offsetX, y: yRatio * displayHeight + offsetY };
}

// -------------------
// Show marker
// -------------------

function showMarker(city) {
    if (!namedCities.has(city.name)) {
        namedCities.add(city.name);
        totalPopulation += city.population;
        updateStats();
    }

    let pos = latLngToImagePosition(city.lat, city.lng);

    pos.x += xOffset * mapImage.clientWidth / (swedenBoundingBox.maxLng - swedenBoundingBox.minLng);
    pos.y -= yOffset * mapImage.clientHeight / (swedenBoundingBox.maxLat - swedenBoundingBox.minLat);

    const marker = document.createElement("div");
    marker.className = "marker";

    let size;
    switch (city.name.toLowerCase()) {
        case "stockholm":
            size = stockholmMarkerSizeRatio * markerSize; break;
        case "göteborg":
        case "goteborg":
            size = goteborgMarkerSizeRatio * markerSize; break;
        case "malmö":
        case "malmo":
            size = malmoMarkerSizeRatio * markerSize; break;
        default:
            size = ((city.population - minPop) / (maxPop - minPop)) * (maxSize - minSize) + minSize;
            size = Math.max(minSize, Math.min(size, maxSize)) * markerSize;
    }

    marker.style.width = size + "px";
    marker.style.height = size + "px";
    marker.style.left = pos.x + "px";
    marker.style.top = pos.y + "px";

    const hoverBox = document.getElementById("cityInfoHover");

    marker.addEventListener("mouseenter", e => {
        document.getElementById("hoverCityName").textContent = city.name;
        document.getElementById("hoverCityPopulation").textContent = `Population: ${city.population.toLocaleString()}`;
        hoverBox.style.display = "block";
        hoverBox.style.left = e.pageX + 10 + "px";
        hoverBox.style.top = e.pageY + 10 + "px";
    });

    marker.addEventListener("mousemove", e => {
        hoverBox.style.left = e.pageX + 10 + "px";
        hoverBox.style.top = e.pageY + 10 + "px";
    });

    marker.addEventListener("mouseleave", () => {
        hoverBox.style.display = "none";
    });

    markerLayer.appendChild(marker);
}

// -------------------
// Update stats
// -------------------

function updateStats() {
    const statsDiv = document.getElementById("stats");
    statsDiv.innerHTML = `
        Antal städer nämnda: ${namedCities.size}<br>
        Total population: ${totalPopulation.toLocaleString()}
    `;
}

// -------------------
// Search
// -------------------

const cityInput = document.getElementById("cityInput");

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const name = cityInput.value.trim().toLowerCase();
        const city = cities.find(c => c.name.toLowerCase() === name);
        if (!city) {
            alert("Staden hittades inte");
        } else {
            showMarker(city);
            cityInput.value = "";
        }
    }
});