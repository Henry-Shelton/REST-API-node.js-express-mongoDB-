var jQueryScript = document.createElement('script');
jQueryScript.setAttribute('src','https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js');
document.head.appendChild(jQueryScript);

mapboxgl.accessToken = 'pk.eyJ1IjoiaGVucnlzaGVsdG9uIiwiYSI6ImNrY3RrMHQ0aTF6NTYyeGxmc3Niazh5eHQifQ.RBR-x4buK_55KQn9JIuPGg';

const userId_MATCH = document.getElementById('user-id')
console.log(userId_MATCH.defaultValue);

var bounds = [
     [-10.65, 49.87], // Southwest coordinates
     [2.09, 58.75] // Northeast coordinates
];

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-0.118092, 51.509865],
    maxBounds: bounds,
    zoom: 6,
    // minZoom: 4,
    // maxZoom: 18,
    //scrollZoom: false THIS IS OPTIONAL LATER ON
});

//fetching shops from API
async function getStores() {
    const res = await fetch('/api/v1/stores');
    const data = await res.json();
    console.log(data);

    const filteredObjects =  data.filter(function(match) {
        return match.userId === userId_MATCH.defaultValue;
    });
    console.log(filteredObjects);

    const stores = filteredObjects.map(store => {
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    store.location.coordinates[0],
                    store.location.coordinates[1]
                ]
            },
            properties: {
                storeId: store.storeId,
                icon: 'shop'
            }
        };
    });

    loadMap(stores);
}

//map loading properties for each shop
function loadMap(stores) {
    map.on('load', function() {
        map.addLayer({
            id: 'points',
            type: 'symbol',
            source: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: stores
                }
            },
            layout: {
                'icon-image': '{icon}-15',
                'icon-size': 1.5,
                'text-field': '{storeId}',
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-offset': [0, 0.9],
                'text-anchor': 'top'
            }
        });
    });
}

getStores();