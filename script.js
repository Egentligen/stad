// Bounding box for Sweden (minLat, minLng, maxLat, maxLng)
const swedenBoundingBox = {
    minLat: 55.3,
    minLng: 11.2,
    maxLat: 69.0,
    maxLng: 24.1,
};

const swedishCities = {
    "Stockholm": { lat: 59.3293, lng: 18.0686, population: 1634299 },
    "Göteborg": { lat: 57.7089, lng: 11.9746, population: 607882 },
    "Malmö": { lat: 55.6049, lng: 13.0038, population: 358474 },
    "Uppsala": { lat: 59.8586, lng: 17.6389, population: 177074 },
    "Västerås": { lat: 59.6162, lng: 16.5528, population: 127799 }
};

function latLngToImagePosition(lat, lng, imgWidth, imgHeight) {
    // Calculate the relative position within the bounding box
    const latRatio = (lat - swedenBoundingBox.minLat) / (swedenBoundingBox.maxLat - swedenBoundingBox.minLat);
    const lngRatio = (lng - swedenBoundingBox.minLng) / (swedenBoundingBox.maxLng - swedenBoundingBox.minLng);

    // Invert latitude ratio (since image y-axis is inverted)
    const yRatio = 1 - latRatio;

    // Calculate pixel positions
    const x = lngRatio * imgWidth;
    const y = yRatio * imgHeight;

    return { x, y };
}

document.getElementById('searchButton').addEventListener('click', () => {
    const cityName = document.getElementById('cityInput').value.trim();
    if (cityName && swedishCities[cityName]) {
        const city = swedishCities[cityName];
        const mapImage = document.getElementById('swedenMap');
        const imgWidth = mapImage.offsetWidth;
        const imgHeight = mapImage.offsetHeight;

        // Calculate position on the image
        const { x, y } = latLngToImagePosition(city.lat, city.lng, imgWidth, imgHeight);

        // Create a marker
        const marker = document.createElement('div');
        marker.className = 'marker';
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.title = `${cityName} (Population: ${city.population})`;

        // Add the marker to the image container
        mapImage.parentNode.appendChild(marker);

        // Display city info
        document.getElementById('cityInfo').innerHTML = `
            <h2>${cityName}</h2>
            <p><strong>Population:</strong> ${city.population}</p>
        `;
    } else {
        alert("City not found. Please try another Swedish city.");
    }
});




