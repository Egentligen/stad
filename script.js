// DOM element references
const mapImage = document.getElementById("swedenMap");
const markerLayer = document.getElementById("markerLayer");
const imageBox = document.getElementById("imageBox");
const mapWrapper = document.getElementById("mapWrapper");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");
const cityInput = document.getElementById("cityInput");

// Global constants

// ----------------------------
// Real-world coardinates reach
const swedenBoundingBox = { 
    minLat: 55.1, minLng: 11.1, 
    maxLat: 69,   maxLng: 24.4 
};
// ----------------------------

// -------------------
// Zooming constraints
const minZoom = 0.5;
const maxZoom = 5;
// -------------------

// Global variables
let cities = [];
let zoomLevel = 1;
let panX = 0, panY = 0;
let isDragging = false, startX, startY;
let namedCities = new Set();
let totalPopulation = 0;

// -------------------
// HELPERS
// -------------------

// Allow special characters
function normalizeText(str) {
    return str
        .toLowerCase()
        .replace(/å|ä/g, "a")
        .replace(/ö/g, "o");
}

// Clamp values
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// -------------------
// LOAD CITY DATA
// -------------------

(async function loadCities() {
    const res = await fetch("data/swedenCities.json");
    cities = await res.json();
})();

// -------------------
// PAN
// -------------------

imageBox.addEventListener("mousedown", e => {
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

window.addEventListener("mouseup", () => isDragging = false);

// -------------------
// ZOOM
// -------------------

// Zoom at point
function zoomAt(x, y, factor) {
    const worldX = (x - panX) / zoomLevel;
    const worldY = (y - panY) / zoomLevel;

    zoomLevel = clamp(zoomLevel * factor, minZoom, maxZoom);

    panX = x - worldX * zoomLevel;
    panY = y - worldY * zoomLevel;

    updateTransform();
}

// Buttons
zoomIn.onclick = () => zoomCenter(1.2);
zoomOut.onclick = () => zoomCenter(1 / 1.2);

function zoomCenter(factor) {
    const rect = imageBox.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, factor);
}

// Wheel
imageBox.addEventListener("wheel", e => {
    e.preventDefault();
    const rect = imageBox.getBoundingClientRect();

    zoomAt(
        e.clientX - rect.left,
        e.clientY - rect.top,
        e.deltaY < 0 ? 1.1 : 1 / 1.1
    );
});

// -------------------
// MAP TRANSFORM
// -------------------

function updateTransform() {
    mapWrapper.style.transform =
        `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

// -------------------
// COORDINATES TO IMAGE-POSITION
// -------------------

function latLngToImagePosition(lat, lng) {
    const img = mapImage;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = img.clientWidth / img.clientHeight;

    let w, h, offsetX, offsetY;

    if (imgAspect > boxAspect) {
        w = img.clientWidth;
        h = w / imgAspect;

        // -------------------------
        // Vertical placement offset
        offsetX = 0;
        // -------------------------

        offsetY = (img.clientHeight - h) / 2;
    } else {
        h = img.clientHeight;
        w = h * imgAspect;
        offsetX = (img.clientWidth - w) / 2;

        // ---------------------------
        // Horizontal placement offset
        offsetY = 0.4;
        // ---------------------------
    }

    const xRatio = (lng - swedenBoundingBox.minLng) / (swedenBoundingBox.maxLng - swedenBoundingBox.minLng);

    const yRatio = 1 - (lat - swedenBoundingBox.minLat) / (swedenBoundingBox.maxLat - swedenBoundingBox.minLat);

    return {
        x: xRatio * w + offsetX,
        y: yRatio * h + offsetY
    };
}

// -------------------
// MARKERS
// -------------------

//Get size
function getMarkerSize(city) {

    // ---------------------
    // Specific marker sizes
    const specifiedSizes = {
        stockholm: 45,
        goteborg: 37.5,
        malmo: 30
    };
    // ---------------------

    const name = normalizeText(city.name);

    if (specifiedSizes[name]) return specifiedSizes[name];

    // -------------------------------
    // City population for marker size
    const minPop = 200, maxPop = 180000;
    const minSize = 3, maxSize = 20;
    // -------------------------------

    let size = ((city.population - minPop) / (maxPop - minPop)) * (maxSize - minSize) + minSize;

    return clamp(size, minSize, maxSize);
}

//Place
function showMarker(city) { 
    // Transform
    
    if (!namedCities.has(city.name)) {
        namedCities.add(city.name);
        totalPopulation += city.population;
        updateStats();
    }

    const pos = latLngToImagePosition(city.lat, city.lng);

    const marker = document.createElement("div");
    marker.className = "marker";

    const size = Math.round(getMarkerSize(city));

    Object.assign(marker.style, {
        width: size + "px",
        height: size + "px",
        left: pos.x + "px",
        top: pos.y + "px"
    });

    // Tooltip 

    const tooltip = document.getElementById("cityInfoTooltip");

    marker.onmouseenter = e => {
        tooltip.style.display = "block";
        tooltip.innerHTML = `
            <strong>${city.name}</strong><br>
            Befolkning: ${city.population.toLocaleString()}
        `;
    };

    marker.onmousemove = e => {
        tooltip.style.left = e.pageX + 10 + "px";
        tooltip.style.top = e.pageY + 10 + "px";
    };

    marker.onmouseleave = () => {
        tooltip.style.display = "none";
    };

    markerLayer.appendChild(marker);
}

// -------------------
// STATS
// -------------------

function updateStats() {
    document.getElementById("stats").innerHTML = `
        Antal städer: ${namedCities.size}<br>
        Population: ${totalPopulation.toLocaleString()}
    `;
}

// -------------------
// SEARCH
// -------------------

cityInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;

    const input = normalizeText(cityInput.value.trim());

    const city = cities.find(c =>
        normalizeText(c.name) === input
    );

    if (!city) {
        alert("Staden hittades inte");
    } else {
        showMarker(city);
        cityInput.value = "";
    }
});