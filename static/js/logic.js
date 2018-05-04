// url for map base layer
var layer = "https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
            "access_token=pk.eyJ1Ijoic3Rzb2lhc3VlIiwiYSI6ImNqZHdnbG9xcjQ1azEyd3Awd3g5ODN0Nm8ifQ." + 
            "5Tb_iL5C11miDiNaM_XmDQ";

var layer2 = "https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?" +
            "access_token=pk.eyJ1Ijoic3Rzb2lhc3VlIiwiYSI6ImNqZHdnbG9xcjQ1azEyd3Awd3g5ODN0Nm8ifQ." +
            "5Tb_iL5C11miDiNaM_XmDQ";

var layer3 = "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}" + 
            "?access_token=pk.eyJ1Ijoic3Rzb2lhc3VlIiwiYSI6ImNqZHdnbG9xcjQ1azEyd3Awd3g5ODN0Nm8ifQ." +
            "5Tb_iL5C11miDiNaM_XmDQ";
                        
// base layers
var darkMap = L.tileLayer(layer);
var lightMap = L.tileLayer(layer2)
var satMap = L.tileLayer(layer3)

// url for earthquake geoJSON data        
var quakeURL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson';
var plates = '../static/js/tectonicPlates/PB2002_boundaries.json'

// function to determine circle size
function markerSize(magnitude) {
    return magnitude * 5;
}

// call to earthquake url
d3.json(quakeURL, function(error, quakeData) {
    if (error) {
        console.warn(error);
    };
    
    // function to determine circle color
    var getColors2 = d3.scaleLinear()
        .domain(d3.extent(quakeData.features, function(quake){
            return +quake.properties.mag;
        }))
        .range(['greenyellow', 'red']);
    
    var legendData = [];

    // add geoJSON data
    var quakesLayer = L.geoJSON(quakeData, {
        pointToLayer: function (feature, latlng) {
            // plot circle with color and size proportional to earthquake magnitude
            
            markerSz = markerSize(+feature.properties.mag);
            markerColor = getColors2(+feature.properties.mag);

            // add color and magnitude to legendData array
            legendData.push([+feature.properties.mag, markerColor]);
            
            marker = L.circleMarker(latlng, {
                radius: markerSz,
                fillColor: markerColor,
                color: "#000",
                weight: 1,
                fillOpacity: 0.8,
                test: ""
            })
            return marker;
        },
        // add popup at each point
        onEachFeature: function popUpText(feature, layer) {
            layer.bindPopup(`<strong>Location:</strong> ${feature.properties.place}<br>` +
                            `<strong>Earthquake Magnitude:</strong> ${feature.properties.mag}`);
        }
    });
    
    // sort legend data array
    legendData.sort(function(a, b){return a[0]-b[0]})

    // call to tectonic plates json file
    d3.json(plates, function(error, platesData) {
        if (error) {
            console.warn(error);    
        };
        
        // create layer with geoJSON 
        var platesLayer = L.geoJSON(platesData);
        
        // create leaflet map
        var myMap = L.map("map", {
            center: [37.09, -95.71],
            zoom: 5,
            layers: [
                darkMap, quakesLayer, platesLayer
            ]
        });

        var legend = L.control({
            position: "bottomright"
        });

        legend.onAdd = function() {
            var div = L.DomUtil.create("div", "info legend");

            var labels = [];
            
            // Add min & max
            var legendInfo = "<h1>Earthquake Magnitude</h1>" +
        "<div class='labels'>" +
            "<div class='min'>" + legendData[0][0] + "</div>" +
            "<div class='max'>" + legendData[legendData.length - 1][0] + "</div>" +
        "</div>";

            div.innerHTML = legendInfo;

            legendData.forEach(function(marker) {
                labels.push("<li style='background-color: " + marker[1] + "'></li>");
            });

            // for (i=0; i<legendData.length; i + (legendData.length/5)) {
            //     labels.push("<li style='background-color: " + legendData[i][1] + "'></li>");
            // };

            div.innerHTML += "<ul>" + labels.join("") + "</ul>";

            return div;
        };

        // Adding legend to the map
        legend.addTo(myMap);

        var overlayLayers = {
            "Earthquakes": quakesLayer,
            "Tectonic Plates": platesLayer
        };

        var baseLayers ={
            "Dark Map": darkMap,
            "Light Map": lightMap,
            "Satellite Map": satMap
        };

        L.control
            .layers(baseLayers, overlayLayers)
            .addTo(myMap)
    });
});