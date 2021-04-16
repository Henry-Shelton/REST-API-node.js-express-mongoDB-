(function() {

// Localize jQuery variable
    var jQuery;

    /******** Load jQuery if not present *********/
    if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.4.2') {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type","text/javascript");
        script_tag.setAttribute("src",
            "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js");
        if (script_tag.readyState) {
            script_tag.onreadystatechange = function () { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    scriptLoadHandler();
                }
            };
        } else {
            script_tag.onload = scriptLoadHandler;
        }
        // Try to find the head, otherwise default to the documentElement
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    } else {
        // The jQuery version on the window is the one we want to use
        jQuery = window.jQuery;
        main();
    }

    /******** Called once jQuery has loaded ******/
    function scriptLoadHandler() {
        // Restore $ and window.jQuery to their previous values and store the
        // new jQuery in our local jQuery variable
        jQuery = window.jQuery.noConflict(true);
        // Call our main function
        main();
    }

        /******** Our main function ********/
        function main() {


            var script_tag = document.createElement('script');
            script_tag.setAttribute("type","text/javascript");
            script_tag.setAttribute("src",
                "https://api.mapbox.com/mapbox-gl-js/v2.0.1/mapbox-gl.js");
            (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);

            /******* Load CSS *******/
            var css_link = jQuery("<link>", {
                rel: "stylesheet",
                type: "text/css",
                href: "https://api.mapbox.com/mapbox-gl-js/v2.0.1/mapbox-gl.css"
            });
            css_link.appendTo('head');


            jQuery(document).ready(function($) {

                // /******* Load HTML *******/
                // var jsonp_url = "http://localhost:3000/api/v1/stores";
                // $.getJSON(jsonp_url, function(data) {
                //     $('#map').html("This data comes from another server: " + data.html);
                //     console.log(data);
                // });

                mapboxgl.accessToken = 'pk.eyJ1IjoiaGVucnlzaGVsdG9uIiwiYSI6ImNrY3RrMHQ0aTF6NTYyeGxmc3Niazh5eHQifQ.RBR-x4buK_55KQn9JIuPGg';

                //define userid to pass to filter from api stores - create when generating widget embed
                const userId_MATCH = '5ffa279c67db7c26a46eb34a'

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
                    const res = await fetch('http://localhost:3000/api/v1/stores');
                    const data = await res.json();


                    const filteredObjects =  data.data.filter(function(match) {
                        return match.userId === userId_MATCH;
                    });
                    //console.log(filteredObjects);

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

            });
        }

})(); // We call our anonymous function immediately