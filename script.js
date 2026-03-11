// Bounding box for Sweden (minLat, minLng, maxLat, maxLng)
const swedenBoundingBox = {
    minLat: 55.0,
    minLng: 11.0,
    maxLat: 69.0,
    maxLng: 24.0
};

// Swedish cities data (name, lat, lng, population)
const swedishCities = {
    "Stockholm": { lat: 59.3293, lng: 18.0686, population: 1634299 },
    "Gothenburg": { lat: 57.7089, lng: 11.9746, population: 607882 },
    "Malmö": { lat: 55.6049, lng: 13.0038, population: 358474 },
    "Uppsala": { lat: 59.8586, lng: 17.6389, population: 177074 },
    "Västerås": { lat: 59.6162, lng: 16.5528, population: 127799 },
    "Örebro": { lat: 59.2741, lng: 15.2066, population: 126604 },
    "Linköping": { lat: 58.4108, lng: 15.6214, population: 115686 },
    "Helsingborg": { lat: 56.0465, lng: 12.6945, population: 113961 },
    "Jönköping": { lat: 57.7815, lng: 14.1562, population: 100208 },
    "Norrköping": { lat: 58.5847, lng: 16.1827, population: 98396 }
};

// Convert coordinates to image positions
function latLngToImagePosition(lat, lng, imgWidth, imgHeight) {
    const latRatio = (lat - swedenBoundingBox.minLat) / (swedenBoundingBox.maxLat - swedenBoundingBox.minLat);
    const lngRatio = (lng - swedenBoundingBox.minLng) / (swedenBoundingBox.maxLng - swedenBoundingBox.minLng);
    const yRatio = 1 - latRatio;
    const x = lngRatio * imgWidth;
    const y = yRatio * imgHeight;
    return { x, y };
}

// Zoom functionality
let zoomLevel = 1;
const mapImage = document.getElementById('swedenMap');
const imageBox = document.querySelector('.image-box');

document.getElementById('zoomIn').addEventListener('click', () => {
    zoomLevel += 0.2;
    mapImage.style.transform = `scale(${zoomLevel})`;
});

document.getElementById('zoomOut').addEventListener('click', () => {
    zoomLevel = Math.max(0.2, zoomLevel - 0.2);
    mapImage.style.transform = `scale(${zoomLevel})`;
});

// Search button event listener
document.getElementById('searchButton').addEventListener('click', () => {
    const cityName = document.getElementById('cityInput').value.trim();
    if (cityName && swedishCities[cityName]) {
        const city = swedishCities[cityName];
        const imgWidth = mapImage.offsetWidth * zoomLevel;
        const imgHeight = mapImage.offsetHeight * zoomLevel;
        const { x, y } = latLngToImagePosition(city.lat, city.lng, imgWidth, imgHeight);

        // Remove previous markers
        const markers = document.querySelectorAll('.marker');
        markers.forEach(marker => marker.remove());

        // Create a marker
        const marker = document.createElement('div');
        marker.className = 'marker';
        marker.style.left = `${x / zoomLevel}px`;
        marker.style.top = `${y / zoomLevel}px`;
        marker.title = `${cityName} (Population: ${city.population})`;
        imageBox.appendChild(marker);

        // Display city info
        document.getElementById('cityInfo').innerHTML = `
            <h2>${cityName}</h2>
            <p><strong>Population:</strong> ${city.population}</p>
            <p><strong>Coordinates:</strong> ${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}</p>
        `;
    } else {
        alert("City not found. Please try another Swedish city.");
    }
});
