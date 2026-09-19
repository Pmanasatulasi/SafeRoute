/* =========================================================
   SAFEROUTE INDIA
   LIVE ROUTE + TIME-AWARE SAFETY
========================================================= */


/* =========================================================
   API ENDPOINTS
========================================================= */

const API = {

    photon:
        "https://photon.komoot.io/api/",

    osrm:
        "https://router.project-osrm.org/route/v1/driving",

    overpass:
        "https://overpass-api.de/api/interpreter"

};


/* =========================================================
   INDIA BOUNDS
========================================================= */

const INDIA_BOUNDS = {

    minLat: 6,

    maxLat: 37.5,

    minLon: 68,

    maxLon: 98

};


/* =========================================================
   STATE
========================================================= */

let map = null;

let mapInitialized = false;

let startMarker = null;

let destinationMarker = null;

let routeLayers = [];

let featureMarkers = [];

let analyzedRoutes = [];

let selectedRouteIndex = 0;

let currentStart = null;

let currentDestination = null;

let currentSafetyData = null;

let analysisTime = null;


/* =========================================================
   DOM
========================================================= */

const startInput =
    document.getElementById(
        "startInput"
    );

const destinationInput =
    document.getElementById(
        "destinationInput"
    );

const locateBtn =
    document.getElementById(
        "locateBtn"
    );

const analyzeBtn =
    document.getElementById(
        "analyzeBtn"
    );

const resultsSection =
    document.getElementById(
        "resultsSection"
    );

const routeResults =
    document.getElementById(
        "routeResults"
    );

const routeCount =
    document.getElementById(
        "routeCount"
    );

const mapStatus =
    document.getElementById(
        "mapStatus"
    );

const safetyBreakdown =
    document.getElementById(
        "safetyBreakdown"
    );

const dataStatus =
    document.getElementById(
        "dataStatus"
    );

const loadingOverlay =
    document.getElementById(
        "loadingOverlay"
    );

const loadingText =
    document.getElementById(
        "loadingText"
    );

const liveTime =
    document.getElementById(
        "liveTime"
    );

const timeContextIcon =
    document.getElementById(
        "timeContextIcon"
    );

const timeContextTitle =
    document.getElementById(
        "timeContextTitle"
    );

const timeContextDescription =
    document.getElementById(
        "timeContextDescription"
    );

const timeContextBadge =
    document.getElementById(
        "timeContextBadge"
    );

const resultsTimeIcon =
    document.getElementById(
        "resultsTimeIcon"
    );

const resultsTimeTitle =
    document.getElementById(
        "resultsTimeTitle"
    );

const resultsTimeText =
    document.getElementById(
        "resultsTimeText"
    );

const dashboardTimeText =
    document.getElementById(
        "dashboardTimeText"
    );

const mainScore =
    document.getElementById(
        "mainScore"
    );

const mainScoreRing =
    document.getElementById(
        "mainScoreRing"
    );

const mainScoreLabel =
    document.getElementById(
        "mainScoreLabel"
    );

const crimeDataCard =
    document.getElementById(
        "crimeDataCard"
    );

const sosBtn =
    document.getElementById(
        "sosBtn"
    );

const sosModal =
    document.getElementById(
        "sosModal"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const shareLocationBtn =
    document.getElementById(
        "shareLocationBtn"
    );

const shareStatus =
    document.getElementById(
        "shareStatus"
    );


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupEvents();

        updateTimeInterface();

        setInterval(
            updateTimeInterface,
            1000
        );

    }
);


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    locateBtn.addEventListener(
        "click",
        useCurrentLocation
    );


    analyzeBtn.addEventListener(
        "click",
        analyzeRoutes
    );


    sosBtn.addEventListener(
        "click",
        () => {

            sosModal.classList.remove(
                "hidden"
            );

        }
    );


    closeModal.addEventListener(
        "click",
        closeSOS
    );


    sosModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                sosModal
            ) {

                closeSOS();

            }

        }
    );


    shareLocationBtn.addEventListener(
        "click",
        shareLocation
    );

}


/* =========================================================
   TIME INFORMATION
========================================================= */

function getTimeInfo(
    date = new Date()
) {

    const hour =
        date.getHours();


    let period;

    let icon;

    let title;

    let description;

    let badge;


    if (
        hour >= 5 &&
        hour < 17
    ) {

        period =
            "day";

        icon =
            "☀️";

        title =
            "Daytime safety analysis";

        description =
            "Public activity and road environment have greater influence.";

        badge =
            "DAY";

    }

    else if (
        hour >= 17 &&
        hour < 21
    ) {

        period =
            "evening";

        icon =
            "🌆";

        title =
            "Evening safety analysis";

        description =
            "Lighting and public services receive greater importance.";

        badge =
            "EVENING";

    }

    else {

        period =
            "night";

        icon =
            "🌙";

        title =
            "Night safety analysis";

        description =
            "Lighting and nearby emergency services receive higher importance.";

        badge =
            "NIGHT";

    }


    return {

        now:
            date,

        period,

        icon,

        title,

        description,

        badge

    };

}


/* =========================================================
   LIVE CLOCK
========================================================= */

function updateTimeInterface() {

    const info =
        getTimeInfo();


    liveTime.textContent =
        formatCurrentTime(
            info.now,
            true
        );


    timeContextIcon.textContent =
        info.icon;

    timeContextTitle.textContent =
        info.title;

    timeContextDescription.textContent =
        info.description;

    timeContextBadge.textContent =
        info.badge;


    /*
       IMPORTANT:
       Once a route has been analyzed, we do NOT
       continuously change its score every second.

       The score remains tied to the exact analysis
       timestamp. This makes the displayed score reproducible.
    */

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatCurrentTime(
    date,
    seconds = false
) {

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour:
                "2-digit",

            minute:
                "2-digit",

            second:
                seconds
                    ? "2-digit"
                    : undefined,

            hour12:
                true
        }
    );

}


/* =========================================================
   MAP INITIALIZATION
========================================================= */

function initializeMap() {

    if (
        mapInitialized
    ) {

        setTimeout(
            () =>
                map.invalidateSize(
                    true
                ),
            100
        );

        return;

    }


    map =
        L.map(
            "map",
            {
                preferCanvas:
                    true
            }
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom:
                19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    ).addTo(
        map
    );


    map.setView(
        [
            20.5937,
            78.9629
        ],
        5
    );


    mapInitialized =
        true;


    setTimeout(
        () =>
            map.invalidateSize(
                true
            ),
        200
    );

}


/* =========================================================
   USE CURRENT LOCATION
========================================================= */

function useCurrentLocation() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;

    }


    setLoading(
        true,
        "Getting your current location..."
    );


    navigator.geolocation.getCurrentPosition(

        async position => {

            const lat =
                position.coords.latitude;

            const lon =
                position.coords.longitude;


            if (
                !isInsideIndia(
                    lat,
                    lon
                )
            ) {

                setLoading(
                    false
                );

                alert(
                    "SafeRoute currently supports India only."
                );

                return;

            }


            try {

                const name =
                    await reverseGeocode(
                        lat,
                        lon
                    );


                startInput.value =
                    name ||
                    `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

            }

            catch {

                startInput.value =
                    `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

            }


            setLoading(
                false
            );

        },


        () => {

            setLoading(
                false
            );

            alert(
                "Unable to access your location. Please enter it manually."
            );

        },


        {

            enableHighAccuracy:
                true,

            timeout:
                15000,

            maximumAge:
                30000

        }

    );

}


/* =========================================================
   MAIN ANALYSIS
========================================================= */

async function analyzeRoutes() {

    const startText =
        startInput.value.trim();

    const destinationText =
        destinationInput.value.trim();


    if (!startText) {

        alert(
            "Please enter a starting location."
        );

        return;

    }


    if (!destinationText) {

        alert(
            "Please enter a destination."
        );

        return;

    }


    try {

        /*
           Freeze the analysis timestamp.

           The clock can continue moving,
           but this particular result belongs
           to this exact time.
        */

        analysisTime =
            new Date();


        setLoading(
            true,
            "Finding your locations..."
        );


        currentStart =
            await resolveLocation(
                startText
            );


        currentDestination =
            await resolveLocation(
                destinationText
            );


        if (
            !isInsideIndia(
                currentStart.lat,
                currentStart.lon
            ) ||
            !isInsideIndia(
                currentDestination.lat,
                currentDestination.lon
            )
        ) {

            throw new Error(
                "SafeRoute currently supports India only."
            );

        }


        setLoading(
            true,
            "Generating genuine route alternatives..."
        );


        const routes =
            await getRoutes(
                currentStart,
                currentDestination
            );


        if (
            routes.length === 0
        ) {

            throw new Error(
                "No drivable route was found."
            );

        }


        setLoading(
            true,
            "Querying fresh safety infrastructure data..."
        );


        currentSafetyData =
            await getSafetyFeatures(
                routes
            );


        setLoading(
            true,
            "Calculating time-aware safety scores..."
        );


        analyzedRoutes =
            calculateRouteScores(
                routes,
                currentSafetyData,
                analysisTime
            );


        rankRoutes();


        selectedRouteIndex =
            0;


        resultsSection.classList.remove(
            "hidden"
        );


        initializeMap();


        updateResultsTimeUI();


        renderRouteCards();

        drawMap();

        renderBreakdown();

        renderCrimeData();

        renderDataStatus(
            currentSafetyData
        );


        setTimeout(
            () =>
                map.invalidateSize(
                    true
                ),
            150
        );


        window.scrollTo(
            {
                top:
                    resultsSection.offsetTop - 20,

                behavior:
                    "smooth"
            }
        );

    }


    catch (error) {

        console.error(
            error
        );

        alert(
            error.message ||
            "Something went wrong."
        );

    }


    finally {

        setLoading(
            false
        );

    }

}


/* =========================================================
   PHOTON GEOCODING
========================================================= */

async function resolveLocation(
    query
) {

    const url =
        `${API.photon}?q=${encodeURIComponent(query)}&limit=5`;


    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            "Location search failed."
        );

    }


    const data =
        await response.json();


    const candidates =
        (
            data.features ||
            []
        )
        .filter(
            feature => {

                const coords =
                    feature.geometry?.coordinates;


                if (!coords) {

                    return false;

                }


                return isInsideIndia(
                    coords[1],
                    coords[0]
                );

            }
        );


    if (
        candidates.length === 0
    ) {

        throw new Error(
            `Could not find "${query}" inside India.`
        );

    }


    const feature =
        candidates[0];


    const coords =
        feature.geometry.coordinates;


    return {

        lat:
            Number(
                coords[1]
            ),

        lon:
            Number(
                coords[0]
            ),

        name:
            formatPlaceName(
                feature.properties ||
                {}
            )

    };

}


/* =========================================================
   REVERSE GEOCODING
========================================================= */

async function reverseGeocode(
    lat,
    lon
) {

    const response =
        await fetch(
            `${API.photon}?lat=${lat}&lon=${lon}&limit=1`
        );


    if (!response.ok) {

        return null;

    }


    const data =
        await response.json();


    if (
        !data.features ||
        !data.features.length
    ) {

        return null;

    }


    return formatPlaceName(
        data.features[0].properties ||
        {}
    );

}


/* =========================================================
   PLACE NAME
========================================================= */

function formatPlaceName(
    properties
) {

    const parts = [];


    if (
        properties.name
    ) {

        parts.push(
            properties.name
        );

    }


    if (
        properties.city &&
        !parts.includes(
            properties.city
        )
    ) {

        parts.push(
            properties.city
        );

    }


    if (
        properties.state &&
        !parts.includes(
            properties.state
        )
    ) {

        parts.push(
            properties.state
        );

    }


    return parts.join(
        ", "
    );

}


/* =========================================================
   ROUTING
========================================================= */

async function getRoutes(
    start,
    destination
) {

    const coordinates =
        `${start.lon},${start.lat};${destination.lon},${destination.lat}`;


    /*
       Ask OSRM for up to 3 alternatives.

       We display every route actually returned.
       We NEVER manufacture a route if fewer are returned.
    */

    const url =
        `${API.osrm}/${coordinates}` +
        `?alternatives=3` +
        `&overview=full` +
        `&geometries=geojson`;


    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            "Routing service is temporarily unavailable."
        );

    }


    const data =
        await response.json();


    if (
        data.code !==
        "Ok"
    ) {

        throw new Error(
            data.message ||
            "No route found."
        );

    }


    return (
        data.routes ||
        []
    ).map(
        (
            route,
            index
        ) => {

            return {

                id:
                    `route-${index + 1}`,

                distance:
                    Number(
                        route.distance ||
                        0
                    ),

                duration:
                    Number(
                        route.duration ||
                        0
                    ),

                geometry:
                    route.geometry,

                originalRank:
                    index + 1

            };

        }
    );

}


/* =========================================================
   OVERPASS SAFETY DATA
========================================================= */

async function getSafetyFeatures(
    routes
) {

    const bbox =
        calculateBoundingBox(
            routes
        );


    const query = `

[out:json][timeout:30];

(
  node["highway"="street_lamp"](${bbox});
  way["highway"="street_lamp"](${bbox});

  node["amenity"="police"](${bbox});
  way["amenity"="police"](${bbox});

  node["amenity"="hospital"](${bbox});
  way["amenity"="hospital"](${bbox});

  node["amenity"="clinic"](${bbox});
  way["amenity"="clinic"](${bbox});

  node["amenity"="fire_station"](${bbox});
  way["amenity"="fire_station"](${bbox});

  node["amenity"="pharmacy"](${bbox});
  way["amenity"="pharmacy"](${bbox});

  node["amenity"="restaurant"](${bbox});
  way["amenity"="restaurant"](${bbox});

  node["amenity"="cafe"](${bbox});
  way["amenity"="cafe"](${bbox});

  node["shop"](${bbox});
  way["shop"](${bbox});

  node["highway"="bus_stop"](${bbox});
  node["public_transport"="platform"](${bbox});

  node["amenity"="bar"](${bbox});
  way["amenity"="bar"](${bbox});

  node["amenity"="pub"](${bbox});
  way["amenity"="pub"](${bbox});

  node["highway"="crossing"](${bbox});
);

out center tags;

`;


    try {

        const response =
            await fetch(
                API.overpass,
                {

                    method:
                        "POST",

                    headers:
                        {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                    body:
                        "data=" +
                        encodeURIComponent(
                            query
                        )

                }
            );


        if (!response.ok) {

            return {

                available:
                    false,

                features:
                    []

            };

        }


        const data =
            await response.json();


        const features =
            (
                data.elements ||
                []
            )
            .map(
                normalizeFeature
            )
            .filter(Boolean);


        return {

            available:
                true,

            features

        };

    }


    catch (
        error
    ) {

        console.error(
            "Overpass error:",
            error
        );


        return {

            available:
                false,

            features:
                []

        };

    }

}


/* =========================================================
   BBOX
========================================================= */

function calculateBoundingBox(
    routes
) {

    let minLat = 90;

    let minLon = 180;

    let maxLat = -90;

    let maxLon = -180;


    routes.forEach(
        route => {

            const coordinates =
                route.geometry?.coordinates ||
                [];


            coordinates.forEach(
                point => {

                    const lon =
                        point[0];

                    const lat =
                        point[1];


                    minLat =
                        Math.min(
                            minLat,
                            lat
                        );

                    minLon =
                        Math.min(
                            minLon,
                            lon
                        );

                    maxLat =
                        Math.max(
                            maxLat,
                            lat
                        );

                    maxLon =
                        Math.max(
                            maxLon,
                            lon
                        );

                }
            );

        }
    );


    const padding =
        0.015;


    return [

        minLat - padding,

        minLon - padding,

        maxLat + padding,

        maxLon + padding

    ].join(",");

}


/* =========================================================
   NORMALIZE FEATURE
========================================================= */

function normalizeFeature(
    element
) {

    const tags =
        element.tags ||
        {};


    let lat =
        element.lat;

    let lon =
        element.lon;


    if (
        element.center
    ) {

        lat =
            lat ??
            element.center.lat;

        lon =
            lon ??
            element.center.lon;

    }


    if (
        lat === undefined ||
        lon === undefined
    ) {

        return null;

    }


    const type =
        classifyFeature(
            tags
        );


    if (!type) {

        return null;

    }


    return {

        lat:
            Number(lat),

        lon:
            Number(lon),

        type,

        name:
            tags.name ||
            featureLabel(
                type
            ),

        tags

    };

}


/* =========================================================
   CLASSIFY
========================================================= */

function classifyFeature(
    tags
) {

    if (
        tags.highway ===
        "street_lamp"
    ) {

        return "lighting";

    }


    if (
        tags.amenity ===
        "police"
    ) {

        return "police";

    }


    if (
        tags.amenity ===
        "hospital"
    ) {

        return "hospital";

    }


    if (
        tags.amenity ===
        "clinic"
    ) {

        return "clinic";

    }


    if (
        tags.amenity ===
        "fire_station"
    ) {

        return "fire";

    }


    if (
        tags.amenity ===
        "pharmacy"
    ) {

        return "pharmacy";

    }


    if (
        tags.amenity ===
            "bar" ||
        tags.amenity ===
            "pub"
    ) {

        return "nightlife";

    }


    if (
        tags.highway ===
        "crossing"
    ) {

        return "crossing";

    }


    if (
        tags.amenity ===
            "restaurant" ||

        tags.amenity ===
            "cafe" ||

        tags.shop ||

        tags.highway ===
            "bus_stop" ||

        tags.public_transport ===
            "platform"
    ) {

        return "activity";

    }


    return null;

}


/* =========================================================
   FEATURE LABEL
========================================================= */

function featureLabel(
    type
) {

    const labels = {

        lighting:
            "Street light",

        police:
            "Police station",

        hospital:
            "Hospital",

        clinic:
            "Clinic",

        fire:
            "Fire station",

        pharmacy:
            "Pharmacy",

        activity:
            "Public activity",

        nightlife:
            "Nightlife",

        crossing:
            "Pedestrian crossing"

    };


    return (
        labels[type] ||
        "Mapped feature"
    );

}


/* =========================================================
   ROUTE SCORING
========================================================= */

function calculateRouteScores(
    routes,
    safetyData,
    timestamp
) {

    const distances =
        routes.map(
            route =>
                route.distance
        );


    const minDistance =
        Math.min(
            ...distances
        );


    const maxDistance =
        Math.max(
            ...distances
        );


    const timeInfo =
        getTimeInfo(
            timestamp
        );


    const weights =
        getTimeWeights(
            timeInfo.period
        );


    return routes.map(
        route => {

            const nearby =
                getNearbyFeatures(
                    route,
                    safetyData.features
                );


            const lighting =
                calculateLighting(
                    nearby,
                    timeInfo.period
                );


            const activity =
                calculateActivity(
                    nearby,
                    timeInfo.period
                );


            const services =
                calculateServices(
                    nearby,
                    timeInfo.period
                );


            const nightlife =
                calculateNightlife(
                    nearby,
                    timeInfo.period
                );


            const efficiency =
                calculateEfficiency(
                    route.distance,
                    minDistance,
                    maxDistance
                );


            const environment =
                calculateEnvironment(
                    nearby
                );


            /*
               Crime is deliberately separated from the score
               unless verified route-level government data is
               actually loaded.

               This prevents fake numbers.
            */

            const crime =
                null;


            const score =
                Math.round(

                    lighting *
                        weights.lighting +

                    activity *
                        weights.publicActivity +

                    services *
                        weights.publicServices +

                    nightlife *
                        weights.nightlife +

                    efficiency *
                        weights.efficiency +

                    environment *
                        weights.roadEnvironment

                );


            return {

                ...route,

                score:
                    clamp(
                        score,
                        0,
                        100
                    ),

                period:
                    timeInfo.period,

                analysisTime:
                    timestamp,

                time:
                    formatCurrentTime(
                        timestamp
                    ),

                weights,

                crime,

                indicators: {

                    lighting,

                    activity,

                    services,

                    nightlife,

                    efficiency,

                    environment

                },

                nearby

            };

        }
    );

}


/* =========================================================
   TIME WEIGHTS
========================================================= */

function getTimeWeights(
    period
) {

    /*
       The weights sum to 1.00.
    */


    if (
        period ===
        "day"
    ) {

        return {

            lighting:
                0.16,

            publicActivity:
                0.21,

            publicServices:
                0.17,

            nightlife:
                0.04,

            efficiency:
                0.20,

            roadEnvironment:
                0.22

        };

    }


    if (
        period ===
        "evening"
    ) {

        return {

            lighting:
                0.25,

            publicActivity:
                0.18,

            publicServices:
                0.20,

            nightlife:
                0.07,

            efficiency:
                0.14,

            roadEnvironment:
                0.16

        };

    }


    return {

        lighting:
            0.30,

        publicActivity:
            0.15,

        publicServices:
            0.25,

        nightlife:
            0.10,

        efficiency:
            0.08,

        roadEnvironment:
            0.12

    };

}


/* =========================================================
   NEARBY FEATURES
========================================================= */

function getNearbyFeatures(
    route,
    features
) {

    const result = {

        lighting: [],

        police: [],

        hospital: [],

        clinic: [],

        fire: [],

        pharmacy: [],

        activity: [],

        nightlife: [],

        crossing: []

    };


    const coordinates =
        route.geometry?.coordinates ||
        [];


    const sampled =
        sampleCoordinates(
            coordinates,
            180
        );


    features.forEach(
        feature => {

            let nearest =
                Infinity;


            for (
                const coordinate
                of sampled
            ) {

                const distance =
                    haversineDistance(
                        coordinate[1],
                        coordinate[0],
                        feature.lat,
                        feature.lon
                    );


                nearest =
                    Math.min(
                        nearest,
                        distance
                    );


                if (
                    nearest <=
                    90
                ) {

                    break;

                }

            }


            if (
                nearest <=
                90
            ) {

                if (
                    result[
                        feature.type
                    ]
                ) {

                    result[
                        feature.type
                    ].push(
                        {
                            ...feature,
                            distance:
                                nearest
                        }
                    );

                }

            }

        }
    );


    return result;

}


/* =========================================================
   SAMPLE ROUTE
========================================================= */

function sampleCoordinates(
    coordinates,
    maxPoints
) {

    if (
        coordinates.length <=
        maxPoints
    ) {

        return coordinates;

    }


    const result = [];


    const step =
        (
            coordinates.length - 1
        ) /
        (
            maxPoints - 1
        );


    for (
        let i = 0;
        i < maxPoints;
        i++
    ) {

        result.push(
            coordinates[
                Math.round(
                    i * step
                )
            ]
        );

    }


    return result;

}


/* =========================================================
   LIGHTING SCORE
========================================================= */

function calculateLighting(
    nearby,
    period
) {

    const count =
        nearby.lighting.length;


    let base =
        38;

    let multiplier =
        3.5;


    if (
        period ===
        "evening"
    ) {

        base =
            35;

        multiplier =
            4;

    }


    if (
        period ===
        "night"
    ) {

        base =
            30;

        multiplier =
            5;

    }


    return clamp(
        base +
            count *
            multiplier,
        0,
        100
    );

}


/* =========================================================
   ACTIVITY
========================================================= */

function calculateActivity(
    nearby,
    period
) {

    const count =
        nearby.activity.length;


    let base =
        35;

    let multiplier =
        2.2;


    if (
        period ===
        "night"
    ) {

        base =
            30;

        multiplier =
            1.6;

    }


    return clamp(
        base +
            count *
            multiplier,
        0,
        100
    );

}


/* =========================================================
   SERVICES
========================================================= */

function calculateServices(
    nearby,
    period
) {

    const count =

        nearby.police.length +

        nearby.hospital.length +

        nearby.clinic.length +

        nearby.fire.length +

        nearby.pharmacy.length;


    let base =
        30;

    let multiplier =
        10;


    if (
        period ===
        "night"
    ) {

        base =
            25;

        multiplier =
            12;

    }


    return clamp(
        base +
            count *
            multiplier,
        0,
        100
    );

}


/* =========================================================
   NIGHTLIFE
========================================================= */

function calculateNightlife(
    nearby,
    period
) {

    const count =
        nearby.nightlife.length;


    /*
       This is a contextual indicator,
       not a claim that nightlife itself is unsafe.
    */


    if (
        period ===
        "day"
    ) {

        return 85;

    }


    if (
        period ===
        "evening"
    ) {

        if (
            count === 0
        ) return 82;

        if (
            count <= 2
        ) return 78;

        if (
            count <= 5
        ) return 70;

        if (
            count <= 10
        ) return 62;

        return 55;

    }


    if (
        count === 0
    ) return 88;

    if (
        count <= 2
    ) return 80;

    if (
        count <= 5
    ) return 70;

    if (
        count <= 10
    ) return 58;

    return 45;

}


/* =========================================================
   ROAD ENVIRONMENT
========================================================= */

function calculateEnvironment(
    nearby
) {

    const crossings =
        nearby.crossing.length;


    return clamp(
        58 +
            crossings *
            4,
        0,
        100
    );

}


/* =========================================================
   ROUTE EFFICIENCY
========================================================= */

function calculateEfficiency(
    distance,
    minDistance,
    maxDistance
) {

    if (
        maxDistance ===
        minDistance
    ) {

        return 100;

    }


    const normalized =
        (
            maxDistance -
            distance
        ) /
        (
            maxDistance -
            minDistance
        );


    return clamp(
        60 +
            normalized *
            40,
        0,
        100
    );

}


/* =========================================================
   RANK
========================================================= */

function rankRoutes() {

    const preference =
        document.querySelector(
            'input[name="preference"]:checked'
        )?.value ||
        "safest";


    if (
        preference ===
        "safest"
    ) {

        analyzedRoutes.sort(
            (
                a,
                b
            ) => {

                if (
                    b.score !==
                    a.score
                ) {

                    return (
                        b.score -
                        a.score
                    );

                }


                return (
                    a.duration -
                    b.duration
                );

            }
        );

    }


    else if (
        preference ===
        "fastest"
    ) {

        analyzedRoutes.sort(
            (
                a,
                b
            ) => {

                if (
                    a.duration !==
                    b.duration
                ) {

                    return (
                        a.duration -
                        b.duration
                    );

                }


                return (
                    b.score -
                    a.score
                );

            }
        );

    }


    else {

        analyzedRoutes.sort(
            (
                a,
                b
            ) => {

                const av =
                    a.score *
                    .70 +

                    a.indicators.efficiency *
                    .30;


                const bv =
                    b.score *
                    .70 +

                    b.indicators.efficiency *
                    .30;


                return (
                    bv -
                    av
                );

            }
        );

    }


    analyzedRoutes =
        analyzedRoutes.map(
            (
                route,
                index
            ) => {

                return {

                    ...route,

                    rank:
                        index + 1

                };

            }
        );

}


/* =========================================================
   ROUTE CARDS
========================================================= */

function renderRouteCards() {

    routeResults.innerHTML =
        "";


    routeCount.textContent =
        analyzedRoutes.length;


    analyzedRoutes.forEach(
        (
            route,
            index
        ) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "route-card" +

                (
                    index === 0
                        ? " rank-one"
                        : ""
                ) +

                (
                    index === selectedRouteIndex
                        ? " selected"
                        : ""
                );


            const rankIcon =
                getRankIcon(
                    index
                );


            card.innerHTML = `

                <div class="rank-badge">
                    ${rankIcon}
                </div>


                <div>

                    <div class="route-title-row">

                        <span class="route-title">
                            Route ${index + 1}
                        </span>

                        ${
                            index === 0
                                ? `
                                    <span class="route-tag">
                                        HIGHEST SAFETY INDICATOR
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <div class="route-meta">

                        <span>
                            📏
                            ${formatDistance(
                                route.distance
                            )}
                        </span>

                        <span>
                            ⏱️
                            ${formatDuration(
                                route.duration
                            )}
                        </span>

                        <span>
                            ${getTimeIcon(
                                route.period
                            )}
                            ${capitalize(
                                route.period
                            )}
                        </span>

                        <span>
                            🕐
                            ${route.time}
                        </span>

                    </div>

                </div>


                <div class="score-area">

                    <div class="score-top">

                        <span class="score-number">
                            ${route.score}
                        </span>

                        <span class="score-out-of">
                            /100
                        </span>

                    </div>


                    <div class="score-label">
                        Time-aware safety indicator
                    </div>


                    <div class="score-bar">

                        <div
                            class="score-fill"
                            style="width:${route.score}%"
                        ></div>

                    </div>


                    ${
                        index === 0
                            ? `
                                <div class="top-route-label">
                                    🏆 Highest score
                                </div>
                              `
                            : ""
                    }

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    selectRoute(
                        index
                    )
            );


            routeResults.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   SELECT ROUTE
========================================================= */

function selectRoute(
    index
) {

    selectedRouteIndex =
        index;


    renderRouteCards();

    drawMap();

    renderBreakdown();

}


/* =========================================================
   RANK ICON
========================================================= */

function getRankIcon(
    index
) {

    if (
        index === 0
    ) return "🥇";

    if (
        index === 1
    ) return "🥈";

    if (
        index === 2
    ) return "🥉";

    return `#${index + 1}`;

}


/* =========================================================
   BREAKDOWN
========================================================= */

function renderBreakdown() {

    const route =
        analyzedRoutes[
            selectedRouteIndex
        ];


    if (!route) {
        return;
    }


    mainScore.textContent =
        route.score;


    mainScoreRing.style.setProperty(
        "--score-angle",
        `${route.score * 3.6}deg`
    );


    mainScoreLabel.textContent =
        `${capitalize(
            route.period
        )} safety indicator`;


    dashboardTimeText.textContent =
        `Score calculated for ${route.time} · ${route.period.toUpperCase()}`;


    const items = [

        {
            icon:
                "💡",

            title:
                "Lighting",

            value:
                route.indicators.lighting,

            description:
                `${route.nearby.lighting.length} mapped street-light features nearby`

        },


        {
            icon:
                "👥",

            title:
                "Public activity",

            value:
                route.indicators.activity,

            description:
                `${route.nearby.activity.length} mapped activity features nearby`

        },


        {
            icon:
                "🚑",

            title:
                "Public services",

            value:
                route.indicators.services,

            description:
                `${countServices(route)} mapped assistance facilities nearby`

        },


        {
            icon:
                "🌃",

            title:
                "Nightlife context",

            value:
                route.indicators.nightlife,

            description:
                `${route.nearby.nightlife.length} mapped bars/pubs nearby`

        },


        {
            icon:
                "🚸",

            title:
                "Road environment",

            value:
                route.indicators.environment,

            description:
                `${route.nearby.crossing.length} mapped pedestrian crossings`

        },


        {
            icon:
                "⏱️",

            title:
                "Route efficiency",

            value:
                route.indicators.efficiency,

            description:
                `${formatDuration(route.duration)} estimated travel time`

        },


        {
            icon:
                "🚨",

            title:
                "Government crime",

            value:
                null,

            description:
                "Historical NCRB/state data source; no live route-level incident feed connected"

        },


        {
            icon:
                "⚠️",

            title:
                "Live accidents",

            value:
                null,

            description:
                "No verified live accident feed connected"

        }

    ];


    safetyBreakdown.innerHTML =
        items.map(
            item => {

                if (
                    item.value ===
                    null
                ) {

                    return `

                        <div class="safety-item">

                            <div class="safety-item-icon">
                                ${item.icon}
                            </div>

                            <h4>
                                ${item.title}
                            </h4>

                            <div class="safety-value unknown-value">
                                NOT LIVE
                            </div>

                            <div class="safety-description">
                                ${item.description}
                            </div>

                        </div>

                    `;

                }


                return `

                    <div class="safety-item">

                        <div class="safety-item-icon">
                            ${item.icon}
                        </div>

                        <h4>
                            ${item.title}
                        </h4>

                        <div class="safety-value">
                            ${Math.round(
                                item.value
                            )}
                        </div>

                        <div class="safety-description">
                            ${item.description}
                        </div>

                        <div class="mini-bar">

                            <span
                                style="width:${item.value}%"
                            ></span>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   CRIME SECTION
========================================================= */

function renderCrimeData() {

    const route =
        analyzedRoutes[
            selectedRouteIndex
        ];


    crimeDataCard.innerHTML = `

        <strong>
            📊 Government crime intelligence
        </strong>

        <span>
            The current frontend does not invent a crime score.
            Official NCRB/OGD information can be historical and
            annual rather than a live road-level incident feed.
            The sources below are therefore presented as verified
            government references rather than falsely labelled
            real-time route data.
        </span>

        <span>
            Current route:
            ${route
                ? `Route ${route.rank}`
                : "Not selected"}
            ·
            Analysis time:
            ${route
                ? route.time
                : "--"}
        </span>

    `;

}


/* =========================================================
   DATA STATUS
========================================================= */

function renderDataStatus(
    safetyData
) {

    const available =
        safetyData.available;


    dataStatus.innerHTML = `

        <div class="data-status-item">

            <strong>
                🗺️ Route calculation
            </strong>

            <span class="status-live">
                Fresh routing API request
            </span>

        </div>


        <div class="data-status-item">

            <strong>
                📍 Current location
            </strong>

            <span class="status-live">
                Browser GPS when permitted
            </span>

        </div>


        <div class="data-status-item">

            <strong>
                🕐 Time
            </strong>

            <span class="status-live">
                Current browser time
            </span>

        </div>


        <div class="data-status-item">

            <strong>
                💡 Lighting / services
            </strong>

            <span class="status-live">
                ${
                    available
                        ? "Fresh OpenStreetMap query"
                        : "Query unavailable"
                }
            </span>

        </div>


        <div class="data-status-item">

            <strong>
                🛡️ Government crime
            </strong>

            <span class="status-historical">
                Historical/annual source
            </span>

        </div>


        <div class="data-status-item">

            <strong>
                ⚠️ Live accidents
            </strong>

            <span class="status-historical">
                No verified live feed
            </span>

        </div>

    `;

}


/* =========================================================
   RESULTS TIME UI
========================================================= */

function updateResultsTimeUI() {

    if (!analysisTime) {
        return;
    }


    const info =
        getTimeInfo(
            analysisTime
        );


    resultsTimeIcon.textContent =
        info.icon;


    resultsTimeTitle.textContent =
        `${info.title} · ${formatCurrentTime(
            analysisTime
        )}`;


    resultsTimeText.textContent =
        "The score weights were calculated using this exact analysis time.";


    dashboardTimeText.textContent =
        `Score calculated for ${formatCurrentTime(
            analysisTime
        )} · ${info.badge}`;

}


/* =========================================================
   MAP
========================================================= */

function drawMap() {

    if (!map) {
        return;
    }


    clearMap();


    const bounds =
        L.latLngBounds([]);


    if (currentStart) {

        startMarker =
            L.marker(
                [
                    currentStart.lat,
                    currentStart.lon
                ]
            )
            .addTo(
                map
            )
            .bindPopup(
                `
                    <strong>
                        Start
                    </strong>
                    <br>
                    ${escapeHTML(
                        currentStart.name ||
                        "Starting location"
                    )}
                `
            );


        bounds.extend(
            [
                currentStart.lat,
                currentStart.lon
            ]
        );

    }


    if (currentDestination) {

        destinationMarker =
            L.marker(
                [
                    currentDestination.lat,
                    currentDestination.lon
                ]
            )
            .addTo(
                map
            )
            .bindPopup(
                `
                    <strong>
                        Destination
                    </strong>
                    <br>
                    ${escapeHTML(
                        currentDestination.name ||
                        "Destination"
                    )}
                `
            );


        bounds.extend(
            [
                currentDestination.lat,
                currentDestination.lon
            ]
        );

    }


    analyzedRoutes.forEach(
        (
            route,
            index
        ) => {

            const latLngs =
                route.geometry.coordinates.map(
                    point => [
                        point[1],
                        point[0]
                    ]
                );


            const selected =
                index ===
                selectedRouteIndex;


            const line =
                L.polyline(
                    latLngs,
                    {

                        color:
                            selected
                                ? "#df8241"
                                : "#9c7abe",

                        weight:
                            selected
                                ? 8
                                : 5,

                        opacity:
                            selected
                                ? .95
                                : .45,

                        dashArray:
                            selected
                                ? null
                                : "10 9",

                        lineCap:
                            "round",

                        lineJoin:
                            "round"

                    }
                );


            line.addTo(
                map
            );


            line.bindTooltip(
                `
                    <strong>
                        Route ${index + 1}
                    </strong>
                    <br>
                    Safety:
                    ${route.score}/100
                    <br>
                    ${formatDistance(
                        route.distance
                    )}
                    ·
                    ${formatDuration(
                        route.duration
                    )}
                `,
                {
                    sticky:
                        true
                }
            );


            line.on(
                "click",
                () =>
                    selectRoute(
                        index
                    )
            );


            routeLayers.push(
                line
            );


            latLngs.forEach(
                point =>
                    bounds.extend(
                        point
                    )
            );

        }
    );


    const selectedRoute =
        analyzedRoutes[
            selectedRouteIndex
        ];


    if (selectedRoute) {

        addFeatureMarkers(
            selectedRoute.nearby
        );

    }


    if (
        bounds.isValid()
    ) {

        map.fitBounds(
            bounds,
            {
                padding:
                    [45,45]
            }
        );

    }


    mapStatus.textContent =
        `${analyzedRoutes.length} genuine route${
            analyzedRoutes.length === 1
                ? ""
                : "s"
        } analyzed`;

}


/* =========================================================
   FEATURE MARKERS
========================================================= */

function addFeatureMarkers(
    nearby
) {

    const groups = [

        {
            list:
                nearby.lighting,

            color:
                "#f0ae3e",

            icon:
                "💡",

            label:
                "Lighting"

        },


        {
            list:
                [
                    ...nearby.police,
                    ...nearby.hospital,
                    ...nearby.clinic,
                    ...nearby.fire,
                    ...nearby.pharmacy
                ],

            color:
                "#e65f5a",

            icon:
                "🚑",

            label:
                "Public service"

        },


        {
            list:
                nearby.activity,

            color:
                "#62a9b0",

            icon:
                "👥",

            label:
                "Public activity"

        },


        {
            list:
                nearby.nightlife,

            color:
                "#c07cba",

            icon:
                "🌃",

            label:
                "Nightlife"

        }

    ];


    groups.forEach(
        group => {

            group.list
                .slice(
                    0,
                    80
                )
                .forEach(
                    feature => {

                        const marker =
                            L.circleMarker(
                                [
                                    feature.lat,
                                    feature.lon
                                ],
                                {

                                    radius:
                                        5,

                                    color:
                                        group.color,

                                    fillColor:
                                        group.color,

                                    fillOpacity:
                                        .78,

                                    weight:
                                        2

                                }
                            );


                        marker.addTo(
                            map
                        );


                        marker.bindPopup(
                            `
                                <strong>
                                    ${escapeHTML(
                                        group.icon +
                                        " " +
                                        feature.name
                                    )}
                                </strong>
                                <br>
                                ${group.label}
                            `
                        );


                        featureMarkers.push(
                            marker
                        );

                    }
                );

        }
    );

}


/* =========================================================
   CLEAR MAP
========================================================= */

function clearMap() {

    if (!map) {
        return;
    }


    if (startMarker) {

        map.removeLayer(
            startMarker
        );

        startMarker =
            null;

    }


    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

        destinationMarker =
            null;

    }


    routeLayers.forEach(
        layer =>
            map.removeLayer(
                layer
            )
    );


    routeLayers =
        [];


    featureMarkers.forEach(
        marker =>
            map.removeLayer(
                marker
            )
    );


    featureMarkers =
        [];

}


/* =========================================================
   SERVICES COUNT
========================================================= */

function countServices(
    route
) {

    return (

        route.nearby.police.length +

        route.nearby.hospital.length +

        route.nearby.clinic.length +

        route.nearby.fire.length +

        route.nearby.pharmacy.length

    );

}


/* =========================================================
   TIME ICON
========================================================= */

function getTimeIcon(
    period
) {

    if (
        period ===
        "day"
    ) return "☀️";

    if (
        period ===
        "evening"
    ) return "🌆";

    return "🌙";

}


/* =========================================================
   DISTANCE
========================================================= */

function formatDistance(
    meters
) {

    if (
        meters <
        1000
    ) {

        return `${Math.round(
            meters
        )} m`;

    }


    return `${(
        meters / 1000
    ).toFixed(1)} km`;

}


/* =========================================================
   DURATION
========================================================= */

function formatDuration(
    seconds
) {

    const minutes =
        Math.round(
            seconds / 60
        );


    if (
        minutes <
        60
    ) {

        return `${minutes} min`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    const remaining =
        minutes %
        60;


    return `${hours}h ${remaining}m`;

}


/* =========================================================
   HAVERSINE
========================================================= */

function haversineDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371000;


    const radians =
        value =>
            value *
            Math.PI /
            180;


    const dLat =
        radians(
            lat2 -
            lat1
        );


    const dLon =
        radians(
            lon2 -
            lon1
        );


    const a =

        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            radians(lat1)
        ) *

        Math.cos(
            radians(lat2)
        ) *

        Math.sin(
            dLon / 2
        ) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return (
        earthRadius *
        c
    );

}


/* =========================================================
   INDIA CHECK
========================================================= */

function isInsideIndia(
    lat,
    lon
) {

    return (

        lat >=
            INDIA_BOUNDS.minLat &&

        lat <=
            INDIA_BOUNDS.maxLat &&

        lon >=
            INDIA_BOUNDS.minLon &&

        lon <=
            INDIA_BOUNDS.maxLon

    );

}


/* =========================================================
   CLAMP
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(
    value
) {

    if (!value) {
        return "";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    show,
    message =
        "Analyzing routes..."
) {

    if (show) {

        loadingText.textContent =
            message;

        loadingOverlay.classList.remove(
            "hidden"
        );

    }

    else {

        loadingOverlay.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   SOS
========================================================= */

function closeSOS() {

    sosModal.classList.add(
        "hidden"
    );

    shareStatus.textContent =
        "";

}


/* =========================================================
   SHARE LOCATION
========================================================= */

function shareLocation() {

    if (
        !navigator.geolocation
    ) {

        shareStatus.textContent =
            "Geolocation is not supported.";

        return;

    }


    shareStatus.textContent =
        "Getting your current location...";


    navigator.geolocation.getCurrentPosition(

        async position => {

            const lat =
                position.coords.latitude;

            const lon =
                position.coords.longitude;


            if (
                !isInsideIndia(
                    lat,
                    lon
                )
            ) {

                shareStatus.textContent =
                    "Location sharing is currently limited to India.";

                return;

            }


            const url =
                `https://www.google.com/maps?q=${lat},${lon}`;


            if (
                navigator.share
            ) {

                try {

                    await navigator.share(
                        {

                            title:
                                "My SafeRoute location",

                            text:
                                "My current location",

                            url

                        }
                    );


                    shareStatus.textContent =
                        "Location sharing opened.";

                }

                catch {

                    shareStatus.textContent =
                        "Sharing cancelled.";

                }

            }

            else if (
                navigator.clipboard
            ) {

                try {

                    await navigator.clipboard.writeText(
                        url
                    );


                    shareStatus.textContent =
                        "Location link copied to clipboard.";

                }

                catch {

                    shareStatus.innerHTML =
                        `
                            Location:
                            <a
                                href="${url}"
                                target="_blank"
                                rel="noopener"
                            >
                                Open map
                            </a>
                        `;

                }

            }

            else {

                shareStatus.innerHTML =
                    `
                        Location:
                        <a
                            href="${url}"
                            target="_blank"
                            rel="noopener"
                        >
                            Open map
                        </a>
                    `;

            }

        },


        () => {

            shareStatus.textContent =
                "Unable to access your current location.";

        },


        {

            enableHighAccuracy:
                true,

            timeout:
                15000,

            maximumAge:
                10000

        }

    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value || ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}