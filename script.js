// DOM element references
const mapImage = document.getElementById("swedenMap");
const markerLayer = document.getElementById("markerLayer");
const imageBox = document.getElementById("imageBox");
const mapWrapper = document.getElementById("mapWrapper");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");
const cityInput = document.getElementById("cityInput");

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

function normalizeText(str) {
    return str
        .toLowerCase()
        .replace(/å|ä/g, "a")
        .replace(/ö/g, "o");
}

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

function zoomAt(x, y, factor) {
    const minZoom = 0.8;
    const maxZoom = 8;

    const worldX = (x - panX) / zoomLevel;
    const worldY = (y - panY) / zoomLevel;

    zoomLevel = clamp(zoomLevel * factor, minZoom, maxZoom);

    panX = x - worldX * zoomLevel;
    panY = y - worldY * zoomLevel;

    updateTransform();
}

zoomIn.onclick = () => zoomCenter(1.2);
zoomOut.onclick = () => zoomCenter(1 / 1.2);

function zoomCenter(factor) {
    const rect = imageBox.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, factor);
}

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

    updateAllMarkers();
}

// -------------------
// COORDINATES TO IMAGE POSITION
// -------------------

function latLngToImagePosition(lat, lng) {
    const swedenBoundingBox = { 
    minLat: 55.1, minLng: 11.1, 
    maxLat: 69,   maxLng: 24.4 
    };
    
    const offsetX = 0.02;
    const offsetY = 0.017;

    const img = mapImage;

    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    const scale = Math.min(scaleX, scaleY);

    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    const baseOffsetX = (img.clientWidth - w) / 2;
    const baseOffsetY = (img.clientHeight - h) / 2;

    const xRatio = (lng - swedenBoundingBox.minLng) / (swedenBoundingBox.maxLng - swedenBoundingBox.minLng);
    const yRatio = 1 - (lat - swedenBoundingBox.minLat) / (swedenBoundingBox.maxLat - swedenBoundingBox.minLat);

    return {
        x: xRatio * w + baseOffsetX + xRatio * w * offsetX,
        y: yRatio * h + baseOffsetY + yRatio * h * offsetY
    };
}

// -------------------
// MARKERS
// -------------------

function updateAllMarkers() {
    const markers = document.querySelectorAll(".marker");

    markers.forEach(marker => {
        const city = JSON.parse(marker.dataset.city);
        const pos = latLngToImagePosition(city.lat, city.lng);

        marker.style.left = pos.x + "px";
        marker.style.top = pos.y + "px";
    });
}

function getMarkerSize(city) {
    const specifiedSizes = {
        stockholm: 45,
        goteborg: 37.5,
        malmo: 30
    };

    const minLargePop = 78000, maxLargePop = 180000;
    const minLargeSize = 18, maxLargeSize = 21;

    const minSmallPop = 200, maxSmallPop = 78000;
    const minSmallSize = 4, maxSmallSize = 18;

    const name = normalizeText(city.name);
    if (specifiedSizes[name]) return specifiedSizes[name];

    let size;

    if (city.population < 100000) {
        size = ((city.population - minSmallPop) / (maxSmallPop - minSmallPop)) 
             * (maxSmallSize - minSmallSize) + minSmallSize;

        return clamp(size, minSmallSize, maxSmallSize);
    } else {
        size = ((city.population - minLargePop) / (maxLargePop - minLargePop)) 
             * (maxLargeSize - minLargeSize) + minLargeSize;

        return clamp(size, minLargeSize, maxLargeSize);
    }
}

function showMarker(city) { 
    if (!namedCities.has(city.name)) {
        namedCities.add(city.name);
        totalPopulation += city.population;
        updateStats();
    }

    const pos = latLngToImagePosition(city.lat, city.lng); 

    const marker = document.createElement("div");
    marker.className = "marker";

    marker.dataset.city = JSON.stringify(city);

    const size = Math.round(getMarkerSize(city));

    Object.assign(marker.style, {
        width: size + "px",
        height: size + "px",
        left: pos.x + "px",
        top: pos.y + "px"
    });

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

window.addEventListener("resize", updateAllMarkers);

mapImage.onload = () => {
    updateAllMarkers();
};

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
    } else if (namedCities.has(city.name)) {
        alert("Staden är redan nämnd");
    } else {
        showMarker(city);
        cityInput.value = "";
    }
});