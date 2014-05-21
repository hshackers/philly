

// Mapbox
var map = L.mapbox.map('map', 'hshackers1.2f6tuik9')
    .setView([2.1252,24.1440], 15)

    L.mapbox.featureLayer({
        // this feature is in the GeoJSON format: see geojson.org
        // for the full specification
        type: 'Feature',
        geometry: {
            type: 'Point',
            // coordinates here are in longitude, latitude order because
            // x, y is the standard for GeoJSON and many formats
            coordinates: [2.1252,24.1440]
        },
        properties: {
            title: 'Meetup Address',
            description: '{{Address}}',
            // one can customize markers by adding simplestyle properties
            // http://mapbox.com/developers/simplestyle/
            'marker-size': 'large',
            'marker-color': '#f0a'
        }
    }).addTo(map);
    map.scrollWheelZoom.disable();


