// Sweden bounding box
const swedenBoundingBox = {
minLat:55,
minLng:11,
maxLat:69,
maxLng:24
};

// Swedish cities
const swedishCities = {
Stockholm:{lat:59.3293,lng:18.0686,population:1634299},
Gothenburg:{lat:57.7089,lng:11.9746,population:607882},
Malmö:{lat:55.6049,lng:13.0038,population:358474},
Uppsala:{lat:59.8586,lng:17.6389,population:177074},
Västerås:{lat:59.6162,lng:16.5528,population:127799},
Örebro:{lat:59.2741,lng:15.2066,population:126604},
Linköping:{lat:58.4108,lng:15.6214,population:115686},
Helsingborg:{lat:56.0465,lng:12.6945,population:113961},
Jönköping:{lat:57.7815,lng:14.1562,population:100208},
Norrköping:{lat:58.5847,lng:16.1827,population:98396}
};

const mapWrapper = document.getElementById("mapWrapper");
const mapImage = document.getElementById("swedenMap");
const markerLayer = document.getElementById("markerLayer");

// disable browser image dragging
mapImage.addEventListener("dragstart", e => e.preventDefault());

let zoomLevel = 1;
let panX = 0;
let panY = 0;

let isDragging = false;
let startX = 0;
let startY = 0;

// update transform (pan + zoom)
function updateTransform(){
mapWrapper.style.transform =
`translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

// convert lat/lng → percent
function latLngToPercent(lat,lng){

const latRatio =
(lat - swedenBoundingBox.minLat) /
(swedenBoundingBox.maxLat - swedenBoundingBox.minLat);

const lngRatio =
(lng - swedenBoundingBox.minLng) /
(swedenBoundingBox.maxLng - swedenBoundingBox.minLng);

return{
x: lngRatio * 100,
y: (1 - latRatio) * 100
};

}

// zoom buttons
document.getElementById("zoomIn").onclick = () => {

zoomLevel += 0.2;
updateTransform();

};

document.getElementById("zoomOut").onclick = () => {

zoomLevel = Math.max(0.4, zoomLevel - 0.2);
updateTransform();

};

// mouse wheel zoom centered on cursor
mapWrapper.addEventListener("wheel", (e) => {

e.preventDefault();

const zoomSpeed = 0.1;

const rect = mapWrapper.getBoundingClientRect();

// mouse position inside map
const mouseX = e.clientX - rect.left;
const mouseY = e.clientY - rect.top;

// world position before zoom
const worldX = (mouseX - panX) / zoomLevel;
const worldY = (mouseY - panY) / zoomLevel;

// zoom direction
if(e.deltaY < 0){
zoomLevel += zoomSpeed;
}else{
zoomLevel = Math.max(0.4, zoomLevel - zoomSpeed);
}

// adjust pan so cursor stays on same map point
panX = mouseX - worldX * zoomLevel;
panY = mouseY - worldY * zoomLevel;

updateTransform();

});

// search for city
document.getElementById("searchButton").onclick = () => {

const cityName =
document.getElementById("cityInput").value.trim();

if(!swedishCities[cityName]){
alert("City not found");
return;
}

const city = swedishCities[cityName];

const pos = latLngToPercent(city.lat, city.lng);

// remove old markers
markerLayer.innerHTML = "";

// create marker
const marker = document.createElement("div");
marker.className = "marker";

marker.style.left = pos.x + "%";
marker.style.top = pos.y + "%";

markerLayer.appendChild(marker);

// show info
document.getElementById("cityInfo").innerHTML = `

<h2>${cityName}</h2>
<p><strong>Population:</strong> ${city.population}</p>
<p><strong>Coordinates:</strong> ${city.lat}, ${city.lng}</p>
`;

};

// start dragging
mapWrapper.addEventListener("mousedown", e => {

e.preventDefault();

isDragging = true;
mapWrapper.classList.add("dragging");

startX = e.clientX - panX;
startY = e.clientY - panY;

});

// drag movement
document.addEventListener("mousemove", e => {

if(!isDragging) return;

panX = e.clientX - startX;
panY = e.clientY - startY;

updateTransform();

});

// stop dragging
document.addEventListener("mouseup", () => {

isDragging = false;
mapWrapper.classList.remove("dragging");

});

