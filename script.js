// Sweden bounding box
const swedenBoundingBox = {
    minLat: 55.0,
    minLng: 11.0,
    maxLat: 69.0,
    maxLng: 24.0
};

const mapWrapper = document.getElementById("mapWrapper");
const mapImage = document.getElementById("swedenMap");
const imageBox = document.querySelector(".image-box");

let zoomLevel = 1;
let panX = 0;
let panY = 0;

let isDragging = false;
let startX;
let startY;

// Prevent image drag
mapImage.addEventListener("dragstart", e => e.preventDefault());

// Convert lat/lng to map pixel position
function latLngToImagePosition(lat, lng) {

    const latRange = swedenBoundingBox.maxLat - swedenBoundingBox.minLat;
    const lngRange = swedenBoundingBox.maxLng - swedenBoundingBox.minLng;

    const xRatio = (lng - swedenBoundingBox.minLng) / lngRange;
    const yRatio = 1 - (lat - swedenBoundingBox.minLat) / latRange;

    const imgWidth = mapImage.clientWidth;
    const imgHeight = mapImage.clientHeight;

    return {
        x: xRatio * imgWidth,
        y: yRatio * imgHeight
    };
}

// Update zoom and pan
function updateTransform() {
    mapWrapper.style.transform =
        `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

// Zoom buttons
document.getElementById("zoomIn").addEventListener("click", () => {
    zoomLevel += 0.2;
    updateTransform();
});

document.getElementById("zoomOut").addEventListener("click", () => {
    zoomLevel = Math.max(0.2, zoomLevel - 0.2);
    updateTransform();
});

// Mouse wheel zoom centered on cursor
mapWrapper.addEventListener("wheel", (e) => {

    e.preventDefault();

    const rect = mapWrapper.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;

    if (e.deltaY < 0) {
        zoomLevel *= zoomFactor;
    } else {
        zoomLevel /= zoomFactor;
    }

    panX = mouseX - (mouseX - panX) * (zoomLevel / (zoomLevel / zoomFactor));
    panY = mouseY - (mouseY - panY) * (zoomLevel / (zoomLevel / zoomFactor));

    updateTransform();

}, { passive: false });

// Drag / pan map
mapWrapper.addEventListener("mousedown", e => {

    e.preventDefault();

    isDragging = true;

    mapWrapper.classList.add("dragging");

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

    mapWrapper.classList.remove("dragging");

});

// Remove old markers
function clearMarkers() {
    document.querySelectorAll(".marker").forEach(m => m.remove());
}

// Place marker
function showMarker(lat, lng, cityName, population) {

    clearMarkers();

    const pos = latLngToImagePosition(lat, lng);

    const marker = document.createElement("div");
    marker.className = "marker";

    marker.style.left = pos.x + "px";
    marker.style.top = pos.y + "px";

    imageBox.appendChild(marker);

    document.getElementById("cityInfo").innerHTML = `
        <h2>${cityName}</h2>
        <p><strong>Population:</strong> ${population}</p>
        <p><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
    `;
}

// Search city using GeoNames (browser-friendly, Sweden only)
async function searchCity(cityName) {
    // Make sure to replace YOUR_USERNAME with your GeoNames username
    const url = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(cityName)}&maxRows=1&country=SE&username=stad1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.geonames || data.geonames.length === 0) {
            alert("City not found in Sweden");
            return;
        }

        const city = data.geonames[0];
        const lat = parseFloat(city.lat);
        const lng = parseFloat(city.lng);
        const population = city.population || "Unknown";

        // Check if the city is inside the Sweden bounding box
        if (
            lat < swedenBoundingBox.minLat || lat > swedenBoundingBox.maxLat ||
            lng < swedenBoundingBox.minLng || lng > swedenBoundingBox.maxLng
        ) {
            alert("City is outside Sweden bounds");
            return;
        }

        // Show the marker
        showMarker(lat, lng, city.name, population);

    } catch (error) {
        console.error(error);
        alert("Error contacting GeoNames. Make sure your username is correct and activated.");
    }
}

// Search button
document.getElementById("searchButton")
.addEventListener("click", () => {

    const cityName =
        document.getElementById("cityInput").value.trim();

    if (!cityName) return;

    searchCity(cityName);

});