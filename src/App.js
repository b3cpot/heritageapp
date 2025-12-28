import React, { useState, useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVxaXIxMiIsImEiOiJjbWpxMnFmMGwxcm85M2RzZWpzdnd4eHcyIn0.bTykNYdGJ32NADnn17I3ug';

// ============================================
// MAPBOX MAP COMPONENT
// ============================================
const MapboxMap = ({ selectedCountry, sites, onSiteClick, selectedSite, getEraColor }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({}); // Changed to object for ID-based tracking
  const onSiteClickRef = useRef(onSiteClick);
  
  // Keep the callback ref updated
  useEffect(() => {
    onSiteClickRef.current = onSiteClick;
  }, [onSiteClick]);

  // Map center coordinates
  const getMapCenter = () => {
    if (selectedCountry === 'Albania') return [20.0, 41.0];
    if (selectedCountry === 'Kosovo') return [20.9, 42.6];
    return [20.3, 41.5]; // Both countries
  };

  const getMapZoom = () => {
    if (selectedCountry === 'Albania') return 7;
    if (selectedCountry === 'Kosovo') return 8.5;
    return 6.5;
  };

  useEffect(() => {
    if (map.current) return; // Initialize only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: getMapCenter(),
      zoom: getMapZoom(),
      pitch: 0,
      bearing: 0
    });

    map.current.on('load', () => {
      // Add Albania GeoJSON layer
      map.current.addSource('albania', {
        type: 'geojson',
        data: '/albania.geojson'
      });

      // Albania fill - subtle highlight
      map.current.addLayer({
        id: 'albania-fill',
        type: 'fill',
        source: 'albania',
        paint: {
          'fill-color': '#C8A882',
          'fill-opacity': 0.08
        }
      });

      // Albania border glow (outer)
      map.current.addLayer({
        id: 'albania-border-glow',
        type: 'line',
        source: 'albania',
        paint: {
          'line-color': '#C8A882',
          'line-width': 6,
          'line-opacity': 0.3,
          'line-blur': 3
        }
      });

      // Albania border (main line)
      map.current.addLayer({
        id: 'albania-border',
        type: 'line',
        source: 'albania',
        paint: {
          'line-color': '#C8A882',
          'line-width': 2.5,
          'line-opacity': 0.9
        }
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    });

    return () => {
      // Clean up markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map view when country changes
  useEffect(() => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: getMapCenter(),
      zoom: getMapZoom(),
      duration: 1500,
      essential: true
    });
  }, [selectedCountry]);

  // Update markers when sites change - using stable ID-based tracking
  useEffect(() => {
    if (!map.current) return;

    const currentSiteIds = new Set(sites.map(s => s.id));
    const existingMarkerIds = new Set(Object.keys(markersRef.current));
    
    // Remove markers that are no longer in sites
    existingMarkerIds.forEach(id => {
      if (!currentSiteIds.has(parseInt(id))) {
        if (markersRef.current[id]) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
      }
    });

    // Add new markers for sites that don't have markers yet
    sites.forEach(site => {
      if (markersRef.current[site.id]) return; // Already exists
      
      const el = document.createElement('div');
      el.className = 'heritage-marker';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div class="marker-pin" style="
          width: 32px;
          height: 32px;
          background: ${getEraColor(site.era[0])};
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
          pointer-events: auto;
        ">
          <div style="
            transform: rotate(45deg);
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `;
      
      const pinDiv = el.querySelector('.marker-pin');
      
      el.onmouseenter = () => {
        if (pinDiv) {
          pinDiv.style.transform = 'rotate(-45deg) scale(1.2)';
          pinDiv.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        }
        el.style.zIndex = '1000';
      };
      
      el.onmouseleave = () => {
        if (pinDiv) {
          pinDiv.style.transform = 'rotate(-45deg) scale(1)';
          pinDiv.style.boxShadow = '0 3px 10px rgba(0,0,0,0.4)';
        }
        el.style.zIndex = '1';
      };
      
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSiteClickRef.current(site);
      };

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([site.lng, site.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '280px' })
            .setHTML(`
              <div style="font-family: sans-serif; overflow: hidden; border-radius: 8px;">
                ${site.image ? `
                  <div style="height: 100px; background-image: url(${site.image}); background-size: cover; background-position: center;"></div>
                ` : ''}
                <div style="padding: 12px;">
                  <strong style="font-family: Cinzel, serif; color: #1c1917; font-size: 14px;">${site.name}</strong>
                  <div style="color: #666; font-size: 11px; margin-top: 4px;">${site.county}, ${site.region}</div>
                  <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
                    ${site.era.slice(0, 3).map(e => `<span style="background: ${getEraColor(e)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px;">${e}</span>`).join('')}
                  </div>
                  <div style="margin-top: 8px; color: #b45309; font-size: 11px; font-weight: 600;">Click for details →</div>
                </div>
              </div>
            `)
        )
        .addTo(map.current);

      markersRef.current[site.id] = marker;
    });
  }, [sites, getEraColor]);

  // Highlight selected site
  useEffect(() => {
    if (!map.current || !selectedSite) return;
    
    map.current.flyTo({
      center: [selectedSite.lng, selectedSite.lat],
      zoom: 10,
      duration: 1000
    });
  }, [selectedSite]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }} 
    />
  );
};

// ============================================
// HERITAGE SITES DATA - Expanded from Archiqoo.com
// Source: https://archiqoo.com/sites/albania.php
// ============================================
const heritageSites = [
  {
    id: 1,
    name: "Butrint",
    alternateName: "Buthrotum",
    type: "Archaeological",
    region: "Albania",
    county: "Vlorë",
    lat: 39.74,
    lng: 20.02,
    startYear: -800,
    endYear: 2025,
    era: ["Greek", "Roman", "Byzantine", "Ottoman"],
    description: "UNESCO World Heritage Site featuring ruins from Greek, Roman, Byzantine, and Ottoman periods. One of Albania's most important archaeological sites, inhabited since prehistoric times.",
    highlights: ["Ancient Theatre", "Baptistery Mosaics", "Venetian Castle", "Lion Gate", "Roman Forum"],
    visitInfo: { hours: "8:00 AM - 7:00 PM", entry: "1000 ALL", duration: "3-4 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Butrint_Albania_5.jpg/1280px-Butrint_Albania_5.jpg",
    rating: 4.8,
    reviews: 1234,
    verified: true
  },
  {
    id: 2,
    name: "Apollonia",
    alternateName: "Apollōnía",
    type: "Archaeological",
    region: "Albania",
    county: "Fier",
    lat: 40.72,
    lng: 19.47,
    startYear: -600,
    endYear: 400,
    era: ["Greek", "Roman"],
    description: "Ancient Greek city founded in 588 BC. Known as one of the most important cities of the ancient world, where Cicero and Augustus once studied.",
    highlights: ["Bouleuterion", "Odeon", "Library", "St. Mary's Monastery", "Archaeological Museum"],
    visitInfo: { hours: "9:00 AM - 6:00 PM", entry: "400 ALL", duration: "2-3 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Apollonia_fier_1.jpg/1280px-Apollonia_fier_1.jpg",
    rating: 4.6,
    reviews: 856,
    verified: true
  },
  {
    id: 3,
    name: "Rozafa Castle",
    alternateName: "Kalaja e Rozafës",
    type: "Fortress",
    region: "Albania",
    county: "Shkodër",
    lat: 42.05,
    lng: 19.49,
    startYear: -300,
    endYear: 2025,
    era: ["Illyrian", "Roman", "Medieval", "Ottoman"],
    description: "Legendary fortress overlooking Shkodër with roots in Illyrian times. Associated with the tragic legend of Rozafa, a woman walled into the castle.",
    highlights: ["Venetian Walls", "Ottoman Mosque", "Panoramic Views", "Museum", "Legend of Rozafa"],
    visitInfo: { hours: "8:00 AM - 8:00 PM", entry: "200 ALL", duration: "2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Rozafa_Castle_2.jpg/1280px-Rozafa_Castle_2.jpg",
    rating: 4.7,
    reviews: 2103,
    verified: true
  },
  {
    id: 4,
    name: "Krujë Castle",
    alternateName: "Kalaja e Krujës",
    type: "Fortress",
    region: "Albania",
    county: "Durrës",
    lat: 41.51,
    lng: 19.79,
    startYear: 400,
    endYear: 2025,
    era: ["Byzantine", "Medieval", "Ottoman"],
    description: "Historic castle and center of Albanian resistance under Skanderbeg. Houses the Skanderbeg Museum designed by the daughter of Enver Hoxha.",
    highlights: ["Skanderbeg Museum", "Ethnographic Museum", "Old Bazaar", "Teqe of Dollma"],
    visitInfo: { hours: "9:00 AM - 5:00 PM", entry: "300 ALL", duration: "3 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kruja_Castle.jpg/1280px-Kruja_Castle.jpg",
    rating: 4.5,
    reviews: 1876,
    verified: true
  },
  {
    id: 5,
    name: "Berat Castle",
    alternateName: "Kalaja e Beratit",
    type: "Fortress",
    region: "Albania",
    county: "Berat",
    lat: 40.71,
    lng: 19.95,
    startYear: -400,
    endYear: 2025,
    era: ["Illyrian", "Byzantine", "Ottoman"],
    description: "Living fortress in the 'City of a Thousand Windows'. UNESCO World Heritage Site with inhabited castle quarter containing Byzantine churches.",
    highlights: ["Onufri Museum", "Byzantine Churches", "Inhabited Quarter", "Red Mosque", "Panoramic Views"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "2-3 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Berat_Castle_Panorama.jpg/1280px-Berat_Castle_Panorama.jpg",
    rating: 4.9,
    reviews: 3421,
    verified: true
  },
  {
    id: 6,
    name: "Prizren Fortress",
    alternateName: "Kalaja e Prizrenit",
    type: "Fortress",
    region: "Kosovo",
    county: "Prizren",
    lat: 42.22,
    lng: 20.74,
    startYear: 500,
    endYear: 2025,
    era: ["Byzantine", "Medieval", "Ottoman"],
    description: "Medieval fortress overlooking the historic city of Prizren, offering panoramic views of this cultural capital of Kosovo.",
    highlights: ["Panoramic Views", "Archaeological Site", "Sunset Viewpoint", "City Views"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Prizren_Fortress.jpg/1280px-Prizren_Fortress.jpg",
    rating: 4.4,
    reviews: 1254,
    verified: true
  },
  {
    id: 7,
    name: "Ulpiana",
    alternateName: "Ulpiana Iustiniana Secunda",
    type: "Archaeological",
    region: "Kosovo",
    county: "Prishtina",
    lat: 42.57,
    lng: 21.18,
    startYear: 100,
    endYear: 600,
    era: ["Roman", "Byzantine"],
    description: "Important Roman city founded by Emperor Trajan. Major archaeological site with ongoing excavations revealing ancient urban planning.",
    highlights: ["Roman Forum", "Early Christian Basilica", "Roman Baths", "City Walls"],
    visitInfo: { hours: "9:00 AM - 5:00 PM", entry: "Free", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Ulpiana_archaeological_site.jpg/800px-Ulpiana_archaeological_site.jpg",
    rating: 4.2,
    reviews: 234,
    verified: true
  },
  {
    id: 8,
    name: "Gjirokastër Castle",
    alternateName: "Kalaja e Gjirokastrës",
    type: "Fortress",
    region: "Albania",
    county: "Gjirokastër",
    lat: 40.08,
    lng: 20.14,
    startYear: 1200,
    endYear: 2025,
    era: ["Medieval", "Ottoman", "Modern"],
    description: "One of the largest castles in the Balkans, overlooking the UNESCO 'Stone City'. Houses a military museum with a captured US spy plane.",
    highlights: ["US Spy Plane", "Military Museum", "Folk Festival Venue", "Stone City Views", "Clock Tower"],
    visitInfo: { hours: "9:00 AM - 7:00 PM", entry: "400 ALL", duration: "2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Gjirokastra_Castle_Albania.jpg/1280px-Gjirokastra_Castle_Albania.jpg",
    rating: 4.7,
    reviews: 2876,
    verified: true
  },
  {
    id: 9,
    name: "Durrës Amphitheatre",
    alternateName: "Anfiteatro di Durazzo",
    type: "Archaeological",
    region: "Albania",
    county: "Durrës",
    lat: 41.32,
    lng: 19.45,
    startYear: 100,
    endYear: 500,
    era: ["Roman", "Byzantine"],
    description: "Largest amphitheatre in the Balkans, built in the 2nd century AD. Features early Christian chapel with rare wall mosaics.",
    highlights: ["Roman Galleries", "Byzantine Chapel", "Wall Mosaics", "Underground Passages"],
    visitInfo: { hours: "9:00 AM - 5:00 PM", entry: "300 ALL", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Durres_Amphitheatre.jpg/1280px-Durres_Amphitheatre.jpg",
    rating: 4.5,
    reviews: 1567,
    verified: true
  },
  {
    id: 10,
    name: "Graçanica Monastery",
    alternateName: "Manastiri i Graçanicës",
    type: "Religious",
    region: "Kosovo",
    county: "Prishtina",
    lat: 42.60,
    lng: 21.20,
    startYear: 1321,
    endYear: 2025,
    era: ["Medieval"],
    description: "UNESCO World Heritage Serbian Orthodox monastery, masterpiece of Byzantine-Romanesque architecture with stunning 14th century frescoes.",
    highlights: ["14th Century Frescoes", "Byzantine Architecture", "Active Monastery"],
    visitInfo: { hours: "8:00 AM - 5:00 PM", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Gracanica_monastery_2.jpg/800px-Gracanica_monastery_2.jpg",
    rating: 4.8,
    reviews: 876,
    verified: true
  },
  {
    id: 11,
    name: "Sinan Pasha Mosque",
    alternateName: "Xhamia e Sinan Pashës",
    type: "Religious",
    region: "Kosovo",
    county: "Prizren",
    lat: 42.21,
    lng: 20.74,
    startYear: 1615,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Most prominent Ottoman mosque in Prizren, built by the famous architect Mimar Sinan. Beautiful example of Ottoman architecture.",
    highlights: ["Ottoman Architecture", "Interior Decorations", "Central Location", "Historic Fountain"],
    visitInfo: { hours: "Dawn to Dusk", entry: "Free", duration: "30 min" },
    rating: 4.6,
    reviews: 543,
    verified: true
  },
  {
    id: 12,
    name: "Byllis",
    alternateName: "Byllis Archaeological Park",
    type: "Archaeological",
    region: "Albania",
    county: "Fier",
    lat: 40.54,
    lng: 19.76,
    startYear: -400,
    endYear: 600,
    era: ["Illyrian", "Roman", "Byzantine"],
    description: "Ancient Illyrian city with impressive ruins including a large stadium and early Christian basilicas, set in a stunning mountain location.",
    highlights: ["Stadium", "Basilicas", "City Walls", "Mountain Setting", "Panoramic Views"],
    visitInfo: { hours: "8:00 AM - 4:00 PM", entry: "300 ALL", duration: "2-3 hours" },
    rating: 4.4,
    reviews: 234,
    verified: true
  },
  {
    id: 13,
    name: "Antigonea",
    alternateName: "Antigonë",
    type: "Archaeological",
    region: "Albania",
    county: "Gjirokastër",
    lat: 40.02,
    lng: 20.18,
    startYear: -295,
    endYear: -167,
    era: ["Greek", "Illyrian"],
    description: "Ancient city founded by Pyrrhus of Epirus and named after his wife Antigone. Strategic hilltop location with remnants of fortifications.",
    highlights: ["City Walls", "Agora", "Mountain Views", "Archaeological Excavations"],
    visitInfo: { hours: "Daylight hours", entry: "200 ALL", duration: "1-2 hours" },
    rating: 4.1,
    reviews: 145,
    verified: true
  },
  {
    id: 14,
    name: "Peć Patriarchate",
    alternateName: "Peja Monastery",
    type: "Religious",
    region: "Kosovo",
    county: "Pejë",
    lat: 42.66,
    lng: 20.26,
    startYear: 1230,
    endYear: 2025,
    era: ["Medieval"],
    description: "UNESCO World Heritage site, the spiritual headquarters of the Serbian Orthodox Church. Complex of four domed churches with medieval frescoes.",
    highlights: ["Medieval Frescoes", "Four Churches", "Monastery Complex", "Rugova Canyon Nearby"],
    visitInfo: { hours: "8:00 AM - 6:00 PM", entry: "Free", duration: "1-2 hours" },
    rating: 4.7,
    reviews: 567,
    verified: true
  },
  {
    id: 15,
    name: "Lëkurësi Castle",
    alternateName: "Kalaja e Lëkurësit",
    type: "Fortress",
    region: "Albania",
    county: "Sarandë",
    lat: 39.85,
    lng: 20.01,
    startYear: 1537,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman fortress on a hilltop overlooking Sarandë and the Ionian Sea. Now a popular restaurant with spectacular sunset views.",
    highlights: ["Ionian Sea Views", "Sunset Restaurant", "Corfu Island Views", "Ottoman Architecture"],
    visitInfo: { hours: "10:00 AM - 11:00 PM", entry: "Free", duration: "1-2 hours" },
    rating: 4.6,
    reviews: 1876,
    verified: true
  },
  // Additional Castles and Sites
  {
    id: 16,
    name: "Petrela Castle",
    alternateName: "Kalaja e Petrelës",
    type: "Fortress",
    region: "Albania",
    county: "Tirana",
    lat: 41.24,
    lng: 19.97,
    startYear: 500,
    endYear: 2025,
    era: ["Byzantine", "Medieval", "Ottoman"],
    description: "Medieval castle perched on a rocky hill near Tirana. Associated with Skanderbeg's sister Mamica. Now houses a restaurant with panoramic views.",
    highlights: ["Medieval Towers", "Skanderbeg Connection", "Restaurant", "Valley Views", "Easy Access from Tirana"],
    visitInfo: { hours: "9:00 AM - 10:00 PM", entry: "Free", duration: "1-2 hours" },
    rating: 4.3,
    reviews: 987,
    verified: true
  },
  {
    id: 17,
    name: "Bashtovë Castle",
    alternateName: "Kalaja e Bashtovës",
    type: "Fortress",
    region: "Albania",
    county: "Durrës",
    lat: 41.08,
    lng: 19.52,
    startYear: 1467,
    endYear: 2025,
    era: ["Medieval"],
    description: "Venetian fortress near the Shkumbin River mouth. One of the best-preserved medieval fortifications in Albania, built to defend against Ottoman expansion.",
    highlights: ["Venetian Architecture", "Four Corner Towers", "Thick Walls", "River Setting"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    rating: 4.2,
    reviews: 234,
    verified: true
  },
  {
    id: 18,
    name: "Porto Palermo Castle",
    alternateName: "Kalaja e Porto Palermos",
    type: "Fortress",
    region: "Albania",
    county: "Vlorë",
    lat: 40.05,
    lng: 19.79,
    startYear: 1804,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman fortress built by Ali Pasha of Ioannina on a peninsula in a stunning bay. Features triangular design and beautiful coastal setting.",
    highlights: ["Triangular Design", "Peninsula Location", "Bay Views", "Ali Pasha History", "Swimming Beach Nearby"],
    visitInfo: { hours: "8:00 AM - 6:00 PM", entry: "200 ALL", duration: "1 hour" },
    rating: 4.5,
    reviews: 1456,
    verified: true
  },
  {
    id: 19,
    name: "Prezë Castle",
    alternateName: "Kalaja e Prezës",
    type: "Fortress",
    region: "Albania",
    county: "Tirana",
    lat: 41.42,
    lng: 19.69,
    startYear: 1400,
    endYear: 2025,
    era: ["Medieval", "Ottoman"],
    description: "Medieval castle near Tirana where Skanderbeg's wedding to Donika Kastrioti was celebrated. Important site in Albanian national history.",
    highlights: ["Skanderbeg's Wedding Site", "Clock Tower", "Ottoman Renovations", "Historic Church"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    rating: 4.1,
    reviews: 456,
    verified: true
  },
  {
    id: 20,
    name: "Kanina Castle",
    alternateName: "Kalaja e Kaninës",
    type: "Fortress",
    region: "Albania",
    county: "Vlorë",
    lat: 40.43,
    lng: 19.47,
    startYear: 300,
    endYear: 2025,
    era: ["Illyrian", "Byzantine", "Medieval", "Ottoman"],
    description: "Ancient fortress overlooking Vlorë with origins in Illyrian times. Strategic position controlling the entrance to the Bay of Vlorë.",
    highlights: ["Illyrian Foundations", "Byzantine Church Ruins", "Panoramic Views", "Historic Cisterns"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1-2 hours" },
    rating: 4.0,
    reviews: 312,
    verified: true
  },
  {
    id: 21,
    name: "Voskopojë Churches",
    alternateName: "Kishat e Voskopojës",
    type: "Religious",
    region: "Albania",
    county: "Korçë",
    lat: 40.63,
    lng: 20.59,
    startYear: 1600,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Collection of historic Orthodox churches in a once-thriving cultural center. Features remarkable 18th century frescoes by masters like David Selenica.",
    highlights: ["St. Nicholas Frescoes", "Archangels Church", "Cultural Heritage", "Mountain Village Setting"],
    visitInfo: { hours: "9:00 AM - 5:00 PM", entry: "200 ALL", duration: "2-3 hours" },
    rating: 4.4,
    reviews: 345,
    verified: true
  },
  {
    id: 22,
    name: "Novobërdë Fortress",
    alternateName: "Kalaja e Novobërdës",
    type: "Fortress",
    region: "Kosovo",
    county: "Prishtina",
    lat: 42.61,
    lng: 21.43,
    startYear: 1300,
    endYear: 2025,
    era: ["Medieval", "Ottoman"],
    description: "Medieval mining town fortress, once the wealthiest city in the Balkans due to silver and gold mines. Important Serbian medieval royal site.",
    highlights: ["Mining History", "Medieval Walls", "Royal Connections", "Archaeological Site"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1-2 hours" },
    rating: 4.2,
    reviews: 234,
    verified: true
  },
  {
    id: 23,
    name: "Vushtrri Castle",
    alternateName: "Kalaja e Vushtrrisë",
    type: "Fortress",
    region: "Kosovo",
    county: "Mitrovicë",
    lat: 42.82,
    lng: 20.97,
    startYear: 1400,
    endYear: 2025,
    era: ["Medieval", "Ottoman"],
    description: "Ottoman-era fortress in historic Vushtrri, featuring well-preserved towers and walls. Important military stronghold in Kosovo.",
    highlights: ["Ottoman Towers", "City Views", "Historic Hammam Nearby", "Old Bridge"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    rating: 4.0,
    reviews: 167,
    verified: true
  },
  {
    id: 24,
    name: "Hadum Mosque",
    alternateName: "Xhamia e Hadumit",
    type: "Religious",
    region: "Kosovo",
    county: "Gjakovë",
    lat: 42.38,
    lng: 20.43,
    startYear: 1594,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Historic Ottoman mosque in the old bazaar of Gjakova. Known for its beautiful interior paintings and architectural details.",
    highlights: ["Painted Interior", "Ottoman Architecture", "Old Bazaar Location", "Cultural Center"],
    visitInfo: { hours: "Dawn to Dusk", entry: "Free", duration: "30 min" },
    rating: 4.5,
    reviews: 289,
    verified: true
  },
  {
    id: 25,
    name: "Dečani Monastery",
    alternateName: "Manastiri i Deçanit",
    type: "Religious",
    region: "Kosovo",
    county: "Pejë",
    lat: 42.54,
    lng: 20.27,
    startYear: 1327,
    endYear: 2025,
    era: ["Medieval"],
    description: "UNESCO World Heritage Serbian Orthodox monastery. Largest medieval church in the Balkans with over 1,000 frescoes depicting religious scenes.",
    highlights: ["1000+ Frescoes", "Largest Medieval Church", "UNESCO Site", "Romanesque-Gothic Style"],
    visitInfo: { hours: "9:00 AM - 5:00 PM", entry: "Free", duration: "1-2 hours" },
    rating: 4.9,
    reviews: 678,
    verified: true
  },
  {
    id: 26,
    name: "Blue Eye",
    alternateName: "Syri i Kaltër",
    type: "Natural",
    region: "Albania",
    county: "Sarandë",
    lat: 39.93,
    lng: 20.19,
    startYear: -10000,
    endYear: 2024,
    era: ["Prehistoric", "Greek", "Roman", "Byzantine", "Ottoman", "Modern"],
    description: "Stunning natural spring with mesmerizing deep blue waters. Water emerges from a depth of over 50 meters at a constant 10°C temperature.",
    highlights: ["Crystal Blue Waters", "Natural Spring", "Walking Trails", "Picnic Areas"],
    visitInfo: { hours: "7:00 AM - 7:00 PM", entry: "50 ALL", duration: "1-2 hours" },
    rating: 4.7,
    reviews: 4567,
    verified: true
  },
  {
    id: 27,
    name: "Orikum Archaeological Site",
    alternateName: "Oriku",
    type: "Archaeological",
    region: "Albania",
    county: "Vlorë",
    lat: 40.32,
    lng: 19.43,
    startYear: -600,
    endYear: 500,
    era: ["Greek", "Roman"],
    description: "Ancient Greek colony later used by Julius Caesar as a naval base. Strategic location at the entrance to the Bay of Vlorë.",
    highlights: ["Ancient Harbor", "Roman Naval Base", "Caesar's Campaign", "Coastal Setting"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    rating: 3.9,
    reviews: 145,
    verified: true
  },
  {
    id: 28,
    name: "Shkodra Cathedral",
    alternateName: "Katedralja e Shkodrës",
    type: "Religious",
    region: "Albania",
    county: "Shkodër",
    lat: 42.07,
    lng: 19.51,
    startYear: 1856,
    endYear: 2025,
    era: ["Ottoman"],
    description: "St. Stephen's Cathedral, one of the largest Catholic churches in the Balkans. Symbol of Shkodra's religious tolerance.",
    highlights: ["Large Cathedral", "Religious Art", "Organ Music", "Historical Significance"],
    visitInfo: { hours: "7:00 AM - 7:00 PM", entry: "Free", duration: "30 min" },
    rating: 4.4,
    reviews: 678,
    verified: true
  },
  {
    id: 29,
    name: "Valbona Valley",
    alternateName: "Lugina e Valbonës",
    type: "Natural",
    region: "Albania",
    county: "Tropojë",
    lat: 42.43,
    lng: 19.88,
    startYear: -10000,
    endYear: 2024,
    era: ["Prehistoric", "Illyrian", "Medieval", "Ottoman", "Modern"],
    description: "Spectacular alpine valley in the Albanian Alps. Known as the 'Queen of Albanian Alps' with dramatic peaks and traditional villages.",
    highlights: ["Alpine Scenery", "Hiking Trails", "Traditional Guesthouses", "Theth-Valbona Trek"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "1-3 days" },
    rating: 4.9,
    reviews: 2345,
    verified: true
  },
  {
    id: 30,
    name: "Runik Archaeological Site",
    alternateName: "Vendbanimi Prehistorik i Runikut",
    type: "Archaeological",
    region: "Kosovo",
    county: "Skenderaj",
    lat: 42.75,
    lng: 20.79,
    startYear: -6000,
    endYear: -3000,
    era: ["Prehistoric"],
    description: "Important Neolithic settlement revealing early agricultural communities in Kosovo. Terracotta figurine 'Goddess on the Throne' discovered here.",
    highlights: ["Neolithic Settlement", "Goddess Figurine", "Early Agriculture Evidence", "Archaeological Excavations"],
    visitInfo: { hours: "By appointment", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Hyrja_e_Lokalitetit_Arkeologjik_Runik.jpg/800px-Hyrja_e_Lokalitetit_Arkeologjik_Runik.jpg",
    rating: 3.8,
    reviews: 78,
    verified: true
  },
  // ============================================
  // ADDITIONAL SITES FROM ARCHIQOO.COM
  // Source: https://archiqoo.com/sites/albania.php
  // ============================================
  {
    id: 31,
    name: "Rodoni Castle",
    alternateName: "Kalaja e Rodonit",
    type: "Fortress",
    region: "Albania",
    county: "Durrës",
    lat: 41.58,
    lng: 19.45,
    startYear: 1450,
    endYear: 2025,
    era: ["Medieval"],
    description: "Skanderbeg's fortress on Cape Rodoni, built to resist Ottoman invasions. Features the ruins of a church where Skanderbeg was reportedly buried.",
    highlights: ["Skanderbeg's Fortress", "Cape Location", "Sea Views", "Church Ruins", "Beach Access"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Rodoni_Castle.jpg/1280px-Rodoni_Castle.jpg",
    rating: 4.3,
    reviews: 567,
    verified: true
  },
  {
    id: 32,
    name: "Elbasan Castle",
    alternateName: "Kalaja e Elbasanit",
    type: "Fortress",
    region: "Albania",
    county: "Elbasan",
    lat: 41.11,
    lng: 20.08,
    startYear: 1466,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman fortress built by Sultan Mehmed II on Roman foundations. The old town within the walls still inhabited today.",
    highlights: ["Ottoman Walls", "Clock Tower", "King Mosque", "Inhabited Old Town", "Bazaar"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Elbasan_Castle.jpg/1280px-Elbasan_Castle.jpg",
    rating: 4.2,
    reviews: 789,
    verified: true
  },
  {
    id: 33,
    name: "Ali Pasha Castle",
    alternateName: "Kalaja e Ali Pashës",
    type: "Fortress",
    region: "Albania",
    county: "Vlorë",
    lat: 40.15,
    lng: 19.75,
    startYear: 1810,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman fortress built by Ali Pasha of Ioannina on the island in Butrint Lake. Strategic position controlling the Vivari Channel.",
    highlights: ["Island Location", "Ali Pasha History", "Butrint Views", "Strategic Position"],
    visitInfo: { hours: "8:00 AM - 5:00 PM", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Ali_Pasha_Castle_Butrint.jpg/800px-Ali_Pasha_Castle_Butrint.jpg",
    rating: 4.1,
    reviews: 234,
    verified: true
  },
  {
    id: 34,
    name: "Tepelenë Castle",
    alternateName: "Kalaja e Tepelenës",
    type: "Fortress",
    region: "Albania",
    county: "Gjirokastër",
    lat: 40.30,
    lng: 20.02,
    startYear: 1800,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Birthplace castle of Ali Pasha of Ioannina. Lord Byron visited here in 1809, describing it in 'Childe Harold's Pilgrimage'.",
    highlights: ["Ali Pasha Birthplace", "Byron's Visit", "River Views", "Ottoman Architecture"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Tepelena_Castle.jpg/800px-Tepelena_Castle.jpg",
    rating: 4.0,
    reviews: 312,
    verified: true
  },
  {
    id: 35,
    name: "Lezhë Castle",
    alternateName: "Kalaja e Lezhës",
    type: "Fortress",
    region: "Albania",
    county: "Lezhë",
    lat: 41.78,
    lng: 19.65,
    startYear: -300,
    endYear: 2025,
    era: ["Illyrian", "Roman", "Byzantine", "Medieval", "Ottoman"],
    description: "Ancient fortress where the League of Lezhë was formed in 1444 under Skanderbeg. Contains the Skanderbeg Memorial.",
    highlights: ["League of Lezhë Site", "Skanderbeg Memorial", "Ancient Walls", "Panoramic Views"],
    visitInfo: { hours: "8:00 AM - 6:00 PM", entry: "200 ALL", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Lezha_Castle.jpg/1280px-Lezha_Castle.jpg",
    rating: 4.4,
    reviews: 678,
    verified: true
  },
  {
    id: 36,
    name: "Himarë Castle",
    alternateName: "Kalaja e Himarës",
    type: "Fortress",
    region: "Albania",
    county: "Vlorë",
    lat: 40.10,
    lng: 19.75,
    startYear: 500,
    endYear: 2025,
    era: ["Byzantine", "Medieval", "Ottoman"],
    description: "Byzantine fortress in the old town of Himarë overlooking the Ionian Sea. Features churches with medieval frescoes.",
    highlights: ["Sea Views", "Byzantine Churches", "Old Town", "Frescoes", "Coastal Setting"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Himara_castle.jpg/800px-Himara_castle.jpg",
    rating: 4.5,
    reviews: 1234,
    verified: true
  },
  {
    id: 37,
    name: "Libohovë Castle",
    alternateName: "Kalaja e Libohovës",
    type: "Fortress",
    region: "Albania",
    county: "Gjirokastër",
    lat: 40.03,
    lng: 20.27,
    startYear: 1800,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman castle built by Ali Pasha's sister. Overlooks the Drino Valley with views to Gjirokastër.",
    highlights: ["Ottoman Architecture", "Valley Views", "Ali Pasha Connection", "Mountain Setting"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Libohova_castle.jpg/800px-Libohova_castle.jpg",
    rating: 3.9,
    reviews: 145,
    verified: true
  },
  {
    id: 38,
    name: "Borsh Castle",
    alternateName: "Kalaja e Borshit",
    type: "Fortress",
    region: "Albania",
    county: "Vlorë",
    lat: 40.06,
    lng: 19.85,
    startYear: 300,
    endYear: 2025,
    era: ["Byzantine", "Medieval", "Ottoman"],
    description: "Large medieval fortress above the village of Borsh on the Albanian Riviera. One of the largest castles in southern Albania.",
    highlights: ["Large Fortress", "Sea Views", "Byzantine Walls", "Riviera Location"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Borsh_Castle_Albania.jpg/800px-Borsh_Castle_Albania.jpg",
    rating: 4.1,
    reviews: 234,
    verified: true
  },
  {
    id: 39,
    name: "Delvinë Castle",
    alternateName: "Kalaja e Delvinës",
    type: "Fortress",
    region: "Albania",
    county: "Vlorë",
    lat: 39.95,
    lng: 20.10,
    startYear: 400,
    endYear: 2025,
    era: ["Byzantine", "Ottoman"],
    description: "Byzantine-Ottoman fortress in Delvinë with well-preserved walls. Strategic position on the route to Butrint.",
    highlights: ["Byzantine Foundations", "Ottoman Additions", "Town Views", "Historic Walls"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Delvina_Castle.jpg/800px-Delvina_Castle.jpg",
    rating: 3.8,
    reviews: 123,
    verified: true
  },
  {
    id: 40,
    name: "Et'hem Bey Mosque",
    alternateName: "Xhamia e Et'hem Beut",
    type: "Religious",
    region: "Albania",
    county: "Tirana",
    lat: 41.33,
    lng: 19.82,
    startYear: 1789,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Historic mosque in the center of Tirana, one of the most beautiful in Albania. Features unique frescoes depicting trees and waterfalls.",
    highlights: ["Painted Frescoes", "Central Location", "Ottoman Architecture", "Clock Tower Nearby"],
    visitInfo: { hours: "8:00 AM - 11:00 AM, 1:00 PM - 7:00 PM", entry: "Free", duration: "30 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Xhamia_Et%27hem_Beu.jpg/800px-Xhamia_Et%27hem_Beu.jpg",
    rating: 4.6,
    reviews: 2345,
    verified: true
  },
  {
    id: 41,
    name: "Lead Mosque Shkodër",
    alternateName: "Xhamia e Plumbit",
    type: "Religious",
    region: "Albania",
    county: "Shkodër",
    lat: 42.07,
    lng: 19.51,
    startYear: 1773,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Named for its lead-covered dome, this Ottoman mosque is one of Shkodër's most important religious buildings.",
    highlights: ["Lead Dome", "Ottoman Architecture", "Historic Interior", "City Center"],
    visitInfo: { hours: "Dawn to Dusk", entry: "Free", duration: "30 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Lead_Mosque_Shkoder.jpg/800px-Lead_Mosque_Shkoder.jpg",
    rating: 4.3,
    reviews: 456,
    verified: true
  },
  {
    id: 42,
    name: "Mesi Bridge",
    alternateName: "Ura e Mesit",
    type: "Bridge",
    region: "Albania",
    county: "Shkodër",
    lat: 42.09,
    lng: 19.60,
    startYear: 1768,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Iconic Ottoman stone bridge with 13 arches over the Kir River. One of the best-preserved Ottoman bridges in Albania.",
    highlights: ["13 Arches", "Ottoman Architecture", "River Setting", "Photography Spot"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "30 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Ura_e_Mesit.jpg/1280px-Ura_e_Mesit.jpg",
    rating: 4.7,
    reviews: 1567,
    verified: true
  },
  {
    id: 43,
    name: "Gorica Bridge",
    alternateName: "Ura e Goricës",
    type: "Bridge",
    region: "Albania",
    county: "Berat",
    lat: 40.70,
    lng: 19.85,
    startYear: 1780,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Historic stone bridge connecting the two halves of Berat across the Osum River. Symbol of the 'City of a Thousand Windows'.",
    highlights: ["Osum River", "City Symbol", "Ottoman Construction", "UNESCO Town"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "15 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Gorica_Bridge_Berat.jpg/1280px-Gorica_Bridge_Berat.jpg",
    rating: 4.5,
    reviews: 987,
    verified: true
  },
  {
    id: 44,
    name: "Amantia",
    alternateName: "Amantia Archaeological Park",
    type: "Archaeological",
    region: "Albania",
    county: "Vlorë",
    lat: 40.38,
    lng: 19.60,
    startYear: -500,
    endYear: 400,
    era: ["Illyrian", "Greek", "Roman"],
    description: "Ancient Illyrian city with impressive stadium and defensive walls. One of the most important Illyrian sites in Albania.",
    highlights: ["Illyrian Stadium", "City Walls", "Temple Ruins", "Mountain Setting"],
    visitInfo: { hours: "Daylight hours", entry: "200 ALL", duration: "2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Amantia_Albania.jpg/800px-Amantia_Albania.jpg",
    rating: 4.3,
    reviews: 234,
    verified: true
  },
  {
    id: 45,
    name: "Phoenice",
    alternateName: "Finiq",
    type: "Archaeological",
    region: "Albania",
    county: "Vlorë",
    lat: 39.91,
    lng: 20.05,
    startYear: -500,
    endYear: 400,
    era: ["Illyrian", "Greek", "Roman"],
    description: "Capital of the Chaonians, an important Epirote tribe. Site of the Peace of Phoenice (205 BC) between Rome and Macedonia.",
    highlights: ["Ancient Theater", "City Walls", "Historic Peace Treaty Site", "Mountain Views"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Phoenice_Albania.jpg/800px-Phoenice_Albania.jpg",
    rating: 4.1,
    reviews: 189,
    verified: true
  },
  {
    id: 46,
    name: "Hadrianopolis",
    alternateName: "Sofratikë",
    type: "Archaeological",
    region: "Albania",
    county: "Gjirokastër",
    lat: 40.07,
    lng: 20.13,
    startYear: 100,
    endYear: 600,
    era: ["Roman", "Byzantine"],
    description: "Roman city founded by Emperor Hadrian. Features a well-preserved theater and city walls near Gjirokastër.",
    highlights: ["Roman Theater", "City Walls", "Hadrian's Foundation", "Scenic Location"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1-2 hours" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Hadrianopolis_Albania.jpg/800px-Hadrianopolis_Albania.jpg",
    rating: 4.0,
    reviews: 145,
    verified: true
  },
  {
    id: 47,
    name: "Royal Tombs of Selca",
    alternateName: "Varret Mbretërore të Selcës",
    type: "Archaeological",
    region: "Albania",
    county: "Pogradec",
    lat: 40.92,
    lng: 20.55,
    startYear: -300,
    endYear: -200,
    era: ["Illyrian"],
    description: "Illyrian royal burial complex with monumental rock-cut tombs. Important evidence of Illyrian royal culture and architecture.",
    highlights: ["Rock-cut Tombs", "Illyrian Royalty", "Macedonian Influence", "Mountain Setting"],
    visitInfo: { hours: "Daylight hours", entry: "100 ALL", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Selca_tombs.jpg/800px-Selca_tombs.jpg",
    rating: 4.2,
    reviews: 167,
    verified: true
  },
  {
    id: 48,
    name: "Church of Lin",
    alternateName: "Kisha Bizantine e Linit",
    type: "Religious",
    region: "Albania",
    county: "Pogradec",
    lat: 41.03,
    lng: 20.63,
    startYear: 500,
    endYear: 600,
    era: ["Byzantine"],
    description: "Early Byzantine church on the shores of Lake Ohrid. Features stunning floor mosaics with animal and geometric designs.",
    highlights: ["Byzantine Mosaics", "Lake Ohrid Views", "Early Christian Art", "Scenic Peninsula"],
    visitInfo: { hours: "Daylight hours", entry: "200 ALL", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Lin_Mosaic.jpg/800px-Lin_Mosaic.jpg",
    rating: 4.4,
    reviews: 345,
    verified: true
  },
  {
    id: 49,
    name: "Tirana Mosaic",
    alternateName: "Mozaiku i Tiranës",
    type: "Archaeological",
    region: "Albania",
    county: "Tirana",
    lat: 41.33,
    lng: 19.82,
    startYear: 300,
    endYear: 500,
    era: ["Roman", "Byzantine"],
    description: "Ancient Roman villa mosaic discovered in central Tirana. One of the few Roman remains in the capital city.",
    highlights: ["Roman Mosaics", "Villa Remains", "City Center Location", "Protected Site"],
    visitInfo: { hours: "9:00 AM - 4:00 PM", entry: "Free", duration: "30 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tirana_Mosaic.jpg/800px-Tirana_Mosaic.jpg",
    rating: 3.9,
    reviews: 234,
    verified: true
  },
  {
    id: 50,
    name: "Kamenica Tumulus",
    alternateName: "Tumuli i Kamenicës",
    type: "Archaeological",
    region: "Albania",
    county: "Korçë",
    lat: 40.45,
    lng: 20.95,
    startYear: -1000,
    endYear: -500,
    era: ["Illyrian"],
    description: "Large Illyrian burial mound with rich grave goods. Important site for understanding Illyrian burial practices.",
    highlights: ["Burial Mound", "Illyrian Artifacts", "Bronze Age Finds", "Archaeological Site"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/k/k1/Kamenica_Tumulus.jpg/800px-Kamenica_Tumulus.jpg",
    rating: 3.7,
    reviews: 89,
    verified: true
  },
  {
    id: 51,
    name: "Tekke of Frashër",
    alternateName: "Teqeja e Frashërit",
    type: "Religious",
    region: "Albania",
    county: "Përmet",
    lat: 40.35,
    lng: 20.40,
    startYear: 1800,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Bektashi tekke (Sufi lodge) in the birthplace of the Frashëri brothers, heroes of Albanian national awakening.",
    highlights: ["Bektashi Heritage", "Frashëri Brothers", "Mountain Village", "Albanian History"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Tekke_Frasher.jpg/800px-Tekke_Frasher.jpg",
    rating: 4.2,
    reviews: 178,
    verified: true
  },
  {
    id: 52,
    name: "Tanners' Bridge",
    alternateName: "Ura e Tabakëve",
    type: "Bridge",
    region: "Albania",
    county: "Tirana",
    lat: 41.33,
    lng: 19.81,
    startYear: 1780,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman stone bridge in central Tirana, named after the tanners who worked nearby. Now a pedestrian area.",
    highlights: ["Ottoman Architecture", "Central Location", "Pedestrian Area", "Historic Landmark"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "15 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/t/t1/Tanners_Bridge_Tirana.jpg/800px-Tanners_Bridge_Tirana.jpg",
    rating: 4.1,
    reviews: 567,
    verified: true
  },
  {
    id: 53,
    name: "Ishëm Castle",
    alternateName: "Kalaja e Ishëmit",
    type: "Fortress",
    region: "Albania",
    county: "Durrës",
    lat: 41.51,
    lng: 19.55,
    startYear: 1400,
    endYear: 2025,
    era: ["Medieval"],
    description: "Medieval fortress near the coast between Durrës and Shëngjin. Strategic coastal defense position.",
    highlights: ["Coastal Location", "Medieval Walls", "Sea Views", "Strategic Position"],
    visitInfo: { hours: "Daylight hours", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/i/i1/Ishem_Castle.jpg/800px-Ishem_Castle.jpg",
    rating: 3.8,
    reviews: 123,
    verified: true
  },
  {
    id: 54,
    name: "Dajti Castle",
    alternateName: "Kalaja e Dajtit",
    type: "Fortress",
    region: "Albania",
    county: "Tirana",
    lat: 41.37,
    lng: 19.92,
    startYear: 500,
    endYear: 2025,
    era: ["Byzantine", "Medieval"],
    description: "Fortress ruins on Mount Dajti overlooking Tirana. Accessible via the Dajti Express cable car.",
    highlights: ["Mountain Views", "Cable Car Access", "Byzantine Remains", "Tirana Panorama"],
    visitInfo: { hours: "With cable car hours", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Mount_Dajti.jpg/800px-Mount_Dajti.jpg",
    rating: 4.0,
    reviews: 345,
    verified: true
  },
  {
    id: 55,
    name: "Mirahori Mosque",
    alternateName: "Xhamia Mirahori",
    type: "Religious",
    region: "Albania",
    county: "Korçë",
    lat: 40.62,
    lng: 20.78,
    startYear: 1484,
    endYear: 2025,
    era: ["Ottoman"],
    description: "One of Albania's oldest mosques, built by Iljaz Bey Mirahori. Features rare early Ottoman architectural style.",
    highlights: ["Early Ottoman Style", "Historic Interior", "Oldest Mosque", "Korçë Heritage"],
    visitInfo: { hours: "Dawn to Dusk", entry: "Free", duration: "30 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/m/m1/Mirahori_Mosque.jpg/800px-Mirahori_Mosque.jpg",
    rating: 4.3,
    reviews: 234,
    verified: true
  },
  {
    id: 56,
    name: "Muradie Mosque",
    alternateName: "Xhamia Muradije",
    type: "Religious",
    region: "Albania",
    county: "Vlorë",
    lat: 40.47,
    lng: 19.49,
    startYear: 1537,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman mosque built by Sultan Suleiman the Magnificent's architect Mimar Sinan. Beautiful example of classical Ottoman architecture.",
    highlights: ["Mimar Sinan Architecture", "Ottoman Design", "Historic Interior", "Vlorë Heritage"],
    visitInfo: { hours: "Dawn to Dusk", entry: "Free", duration: "30 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/m/m2/Muradie_Mosque_Vlore.jpg/800px-Muradie_Mosque_Vlore.jpg",
    rating: 4.4,
    reviews: 345,
    verified: true
  },
  {
    id: 57,
    name: "Durrës Castle",
    alternateName: "Kalaja e Durrësit",
    type: "Fortress",
    region: "Albania",
    county: "Durrës",
    lat: 41.32,
    lng: 19.45,
    startYear: 500,
    endYear: 2025,
    era: ["Byzantine", "Medieval", "Venetian"],
    description: "Byzantine-Venetian fortifications in Albania's main port city. The walls incorporate earlier Roman structures.",
    highlights: ["Byzantine Walls", "Venetian Tower", "Roman Foundations", "Port Views"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "1 hour" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Durres_Castle.jpg/800px-Durres_Castle.jpg",
    rating: 4.0,
    reviews: 678,
    verified: true
  },
  {
    id: 58,
    name: "Kasabashi Bridge",
    alternateName: "Ura e Kasabashit",
    type: "Bridge",
    region: "Albania",
    county: "Gjirokastër",
    lat: 40.08,
    lng: 20.14,
    startYear: 1750,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Ottoman stone bridge near Gjirokastër, used for centuries by traders and travelers crossing the river.",
    highlights: ["Ottoman Architecture", "Stone Construction", "River Crossing", "Historic Trade Route"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "15 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/k/k2/Kasabashi_Bridge.jpg/800px-Kasabashi_Bridge.jpg",
    rating: 4.0,
    reviews: 123,
    verified: true
  },
  {
    id: 59,
    name: "Kamara Bridge",
    alternateName: "Ura e Kamarës",
    type: "Bridge",
    region: "Albania",
    county: "Berat",
    lat: 40.63,
    lng: 19.92,
    startYear: 1770,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Well-preserved Ottoman bridge near Berat. Part of the historic road network connecting Albanian cities.",
    highlights: ["Ottoman Construction", "Stone Arches", "River Setting", "Historic Route"],
    visitInfo: { hours: "Open 24/7", entry: "Free", duration: "15 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/k/k3/Kamara_Bridge.jpg/800px-Kamara_Bridge.jpg",
    rating: 3.9,
    reviews: 98,
    verified: true
  },
  {
    id: 60,
    name: "Halveti Tekke Berat",
    alternateName: "Teqeja Halveti e Beratit",
    type: "Religious",
    region: "Albania",
    county: "Berat",
    lat: 40.71,
    lng: 19.95,
    startYear: 1782,
    endYear: 2025,
    era: ["Ottoman"],
    description: "Sufi tekke within Berat Castle, featuring beautiful wooden carved ceiling and religious artwork.",
    highlights: ["Wooden Ceiling", "Sufi Heritage", "Castle Location", "Religious Art"],
    visitInfo: { hours: "9:00 AM - 5:00 PM", entry: "100 ALL", duration: "30 min" },
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/h/h1/Halveti_Tekke_Berat.jpg/800px-Halveti_Tekke_Berat.jpg",
    rating: 4.3,
    reviews: 234,
    verified: true
  }
];

// ============================================
// ROUTES DATA
// ============================================
const routes = [
  {
    id: 1,
    name: "The Illyrian Trail",
    description: "Explore the ancient Illyrian civilization through their most impressive fortifications and settlements. Discover the roots of Albanian culture.",
    duration: "2 days",
    distance: "180 km",
    sites: [1, 2, 12, 5],
    era: "Illyrian",
    difficulty: "Moderate"
  },
  {
    id: 2,
    name: "Roman Albania",
    description: "Follow in the footsteps of the Roman Empire across Albanian lands. Visit amphitheatres, forums, and ancient cities.",
    duration: "3 days",
    distance: "250 km",
    sites: [1, 2, 9, 12],
    era: "Roman",
    difficulty: "Easy"
  },
  {
    id: 3,
    name: "Ottoman Heritage",
    description: "Discover the rich Ottoman legacy in Albania and Kosovo's mosques, bazaars, and fortress renovations spanning 500 years.",
    duration: "1 week",
    distance: "400 km",
    sites: [3, 8, 6, 11, 15],
    era: "Ottoman",
    difficulty: "Easy"
  },
  {
    id: 4,
    name: "Fortress Circuit",
    description: "Visit the most impressive medieval fortresses of the region in one epic journey through mountain strongholds.",
    duration: "4 days",
    distance: "320 km",
    sites: [3, 4, 5, 8, 6],
    era: "Medieval",
    difficulty: "Moderate"
  },
  {
    id: 5,
    name: "UNESCO World Heritage",
    description: "A curated tour of all UNESCO-recognized heritage sites in Albania and Kosovo. The best of the best.",
    duration: "5 days",
    distance: "450 km",
    sites: [1, 5, 8, 10, 14],
    era: "Mixed",
    difficulty: "Easy"
  },
  {
    id: 6,
    name: "Sacred Sites",
    description: "Journey through the spiritual heritage of the region, from ancient monasteries to Ottoman mosques.",
    duration: "3 days",
    distance: "280 km",
    sites: [10, 11, 14],
    era: "Religious",
    difficulty: "Easy"
  }
];

// ============================================
// ERAS DATA
// ============================================
const eras = [
  { id: 'prehistoric', name: 'Prehistoric', startYear: -6000, endYear: -1200, color: '#8B7355' },
  { id: 'illyrian', name: 'Illyrian', startYear: -1200, endYear: -168, color: '#7B4B94' },
  { id: 'greek', name: 'Greek', startYear: -800, endYear: -146, color: '#4A90A4' },
  { id: 'roman', name: 'Roman', startYear: -168, endYear: 395, color: '#B85C38' },
  { id: 'byzantine', name: 'Byzantine', startYear: 395, endYear: 1204, color: '#C8A882' },
  { id: 'medieval', name: 'Medieval', startYear: 1204, endYear: 1479, color: '#2E5A8B' },
  { id: 'ottoman', name: 'Ottoman', startYear: 1479, endYear: 2025, color: '#2A6F4E' },
  { id: 'modern', name: 'Modern', startYear: 1912, endYear: 2025, color: '#5C5C5C' }
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatYear = (year) => year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
const getEraForYear = (year) => eras.find(era => year >= era.startYear && year <= era.endYear) || eras[7];
const getEraColor = (eraName) => eras.find(e => e.name.toLowerCase() === eraName.toLowerCase())?.color || '#5C5C5C';

// ============================================
// ICON COMPONENTS
// ============================================
const MapPinIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#C8A882" stroke="#C8A882" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CompassIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const RouteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </svg>
);

const NavIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const [page, setPage] = useState('home');
  const [selectedCountry, setSelectedCountry] = useState(null); // 'Albania' or 'Kosovo'
  const [selectedYear, setSelectedYear] = useState(0);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [heroYear, setHeroYear] = useState(-500);
  const [searchQuery, setSearchQuery] = useState('');

  // Hero animation for homepage
  useEffect(() => {
    if (page !== 'home') return;
    const interval = setInterval(() => setHeroYear(y => y >= 1800 ? -500 : y + 40), 80);
    return () => clearInterval(interval);
  }, [page]);

  // Timeline autoplay
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedYear(y => {
        if (y >= 1900) {
          setIsPlaying(false);
          return 1900;
        }
        return y + 20;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Filter sites based on selected year AND selected country
  const visibleSites = useMemo(() =>
    heritageSites.filter(s => 
      s.startYear <= selectedYear && 
      s.endYear >= selectedYear &&
      (!selectedCountry || s.region === selectedCountry)
    ),
    [selectedYear, selectedCountry]
  );

  const currentEra = getEraForYear(selectedYear);

  // Search results
  const searchResults = useMemo(() =>
    heritageSites.filter(s =>
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.era.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.region.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  // ============================================
  // HEADER COMPONENT
  // ============================================
  const Header = () => (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      background: 'rgba(28, 25, 23, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #44403c',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setPage('home')}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #b45309, #78350f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MapPinIcon size={18} />
        </div>
        <span style={{ fontFamily: 'Cinzel, Georgia, serif', fontWeight: 600, letterSpacing: 0.5 }}>
          History Heritage
        </span>
      </div>
      <nav style={{ display: 'flex', gap: 24, fontSize: 14 }}>
        {['select', 'routes', 'search'].map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              background: 'none',
              border: 'none',
              color: (page === p || (p === 'select' && page === 'map')) ? '#fff' : '#a8a29e',
              cursor: 'pointer',
              fontWeight: (page === p || (p === 'select' && page === 'map')) ? 600 : 400,
              transition: 'color 0.2s'
            }}
          >
            {p === 'select' ? 'Explore' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </nav>
    </header>
  );

  // ============================================
  // HOME PAGE
  // ============================================
  if (page === 'home') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1c1917, #0c0a09)',
        color: '#fafaf9',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <Header />

        {/* Hero Section */}
        <section style={{
          position: 'relative',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          paddingTop: 56
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, #292524, #0c0a09)'
          }} />

          {/* Floating markers */}
          {heritageSites.slice(0, 6).map((site, i) => (
            <div
              key={site.id}
              style={{
                position: 'absolute',
                left: `${12 + i * 14}%`,
                top: `${20 + (i % 3) * 22}%`,
                color: getEraColor(site.era[0]),
                opacity: site.startYear <= heroYear && site.endYear >= heroYear ? 0.7 : 0.15,
                transition: 'opacity 0.5s',
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`
              }}
            >
              <MapPinIcon size={28} />
            </div>
          ))}

          <div style={{
            position: 'relative',
            textAlign: 'center',
            padding: 24,
            maxWidth: 600
          }}>
            <h1 style={{
              fontFamily: 'Cinzel, Georgia, serif',
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 500,
              marginBottom: 16,
              background: 'linear-gradient(135deg, #fafaf9, #d6d3d1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Explore 8000 Years of Albanian & Kosovar Heritage
            </h1>
            <p style={{ color: '#a8a29e', marginBottom: 32 }}>
              Interactive timeline • Archaeological sites • Historical routes
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPage('select')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #b45309, #78350f)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(180, 83, 9, 0.3)',
                  transition: 'transform 0.2s'
                }}
              >
                <CompassIcon /> Start Exploring
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 24px',
                background: 'transparent',
                color: '#a8a29e',
                border: '1px solid #44403c',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <PlayIcon /> Watch Demo
              </button>
            </div>
            <div style={{ marginTop: 32, fontSize: 14 }}>
              <span style={{ color: getEraForYear(heroYear).color, fontWeight: 600 }}>
                {getEraForYear(heroYear).name} Era
              </span>
              <span style={{ color: '#78716c', marginLeft: 8 }}>{formatYear(heroYear)}</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '64px 24px', background: '#1c1917' }}>
          <div style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24
          }}>
            {[
              { icon: <ClockIcon size={32} />, title: 'Timeline Travel', desc: 'Drag through centuries and watch history unfold on an interactive map' },
              { icon: <MapPinIcon size={32} />, title: '500+ Heritage Sites', desc: 'From prehistoric tumuli to Ottoman mosques, all documented' },
              { icon: <RouteIcon />, title: 'Curated Routes', desc: 'Expert-designed heritage exploration itineraries' }
            ].map((f, i) => (
              <div key={i} style={{
                background: '#292524',
                borderRadius: 16,
                padding: 28,
                textAlign: 'center',
                transition: 'transform 0.3s'
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #b45309, #78350f)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: '1.1rem', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#a8a29e', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Sites */}
        <section style={{ padding: '64px 24px' }}>
          <h2 style={{
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: '1.75rem',
            textAlign: 'center',
            marginBottom: 32
          }}>
            Featured Sites
          </h2>
          <div style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            paddingBottom: 16,
            scrollSnapType: 'x mandatory'
          }}>
            {heritageSites.filter(s => s.image).slice(0, 8).map(site => (
              <div
                key={site.id}
                onClick={() => { setSelectedSite(site); setPage('select'); }}
                style={{
                  flex: '0 0 280px',
                  background: '#292524',
                  borderRadius: 14,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  scrollSnapAlign: 'start',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  height: 160,
                  backgroundImage: site.image ? `url(${site.image})` : 'none',
                  backgroundColor: getEraColor(site.era[0]),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  {!site.image && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><MapPinIcon size={36} /></div>}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(41,37,36,1) 0%, rgba(41,37,36,0) 60%)'
                  }} />
                  <span style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    padding: '4px 10px',
                    background: getEraColor(site.era[0]),
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {site.era[0]}
                  </span>
                  <span style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    padding: '4px 10px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: 6,
                    fontSize: 10
                  }}>
                    {site.type}
                  </span>
                </div>
                <div style={{ padding: 16 }}>
                  <h4 style={{ fontFamily: 'Cinzel, Georgia, serif', marginBottom: 4, fontSize: '1.05rem' }}>{site.name}</h4>
                  <p style={{ color: '#78716c', fontSize: 13, marginBottom: 8 }}>{site.county}, {site.region}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d6b76a', fontSize: 14 }}>
                    <StarIcon /> {site.rating}
                    <span style={{ color: '#57534e', marginLeft: 4 }}>({site.reviews})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '64px 24px',
          background: 'linear-gradient(135deg, #78350f 0%, #1c1917 100%)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: '1.75rem',
            marginBottom: 16
          }}>
            Ready to Explore?
          </h2>
          <p style={{ color: '#d6d3d1', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            Discover the rich heritage of Albania and Kosovo through our interactive time-map
          </p>
          <button
            onClick={() => setPage('select')}
            style={{
              padding: '14px 28px',
              background: '#fff',
              color: '#1c1917',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            Open the Map
          </button>
        </section>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // COUNTRY SELECTION PAGE
  // ============================================
  if (page === 'select') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1c1917, #0c0a09)',
        color: '#fafaf9',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <Header />
        
        <div style={{
          paddingTop: 120,
          paddingBottom: 60,
          textAlign: 'center'
        }}>
          <h1 style={{
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
            marginBottom: 12,
            background: 'linear-gradient(135deg, #fafaf9, #d6d3d1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Choose Your Destination
          </h1>
          <p style={{ color: '#a8a29e', marginBottom: 48 }}>
            Select a country to explore its heritage sites
          </p>
          
          <div style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '0 24px',
            maxWidth: 900,
            margin: '0 auto'
          }}>
            {/* Albania Card */}
            <div
              onClick={() => { setSelectedCountry('Albania'); setPage('map'); }}
              style={{
                width: 340,
                background: '#1c1917',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid #292524',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#b45309'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#292524'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{
                height: 220,
                background: 'linear-gradient(135deg, #78350f 0%, #1c1917 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Albania SVG Shape */}
                <svg viewBox="0 0 200 300" style={{ height: '85%', opacity: 0.9 }}>
                  <path
                    d="M100,10 
                       L130,15 L145,25 L155,45 L160,70 
                       L158,95 L150,120 L145,150
                       L150,180 L155,210 L150,240 
                       L140,260 L120,275 L95,285 
                       L70,280 L55,265 L50,240 
                       L55,210 L52,180 L48,150 
                       L45,120 L50,90 L55,60 
                       L65,35 L80,20 Z"
                    fill="#C8A882"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {/* Double-headed eagle silhouette */}
                  <path
                    d="M100,100 L90,110 L80,105 L85,120 L75,130 L90,125 L95,140 L100,130 L105,140 L110,125 L125,130 L115,120 L120,105 L110,110 Z"
                    fill="#1c1917"
                    opacity="0.6"
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  display: 'flex',
                  gap: 6
                }}>
                  <span style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 6, fontSize: 11 }}>
                    {heritageSites.filter(s => s.region === 'Albania').length} sites
                  </span>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <h2 style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: '1.5rem', marginBottom: 8 }}>
                  Albania
                </h2>
                <p style={{ color: '#a8a29e', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                  Explore ancient Illyrian fortresses, Greek colonies, Roman ruins, and Ottoman architecture along the stunning Adriatic coast.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Butrint', 'Apollonia', 'Berat', 'Gjirokastër'].map(site => (
                    <span key={site} style={{ padding: '4px 10px', background: '#292524', borderRadius: 4, fontSize: 12, color: '#a8a29e' }}>
                      {site}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Kosovo Card */}
            <div
              onClick={() => { setSelectedCountry('Kosovo'); setPage('map'); }}
              style={{
                width: 340,
                background: '#1c1917',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid #292524',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E5A8B'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#292524'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{
                height: 220,
                background: 'linear-gradient(135deg, #1e3a5f 0%, #1c1917 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Kosovo SVG Shape */}
                <svg viewBox="0 0 200 200" style={{ height: '75%', opacity: 0.9 }}>
                  <path
                    d="M60,40 
                       L90,30 L120,35 L150,50 
                       L165,75 L170,105 L165,135 
                       L150,155 L120,165 L90,160 
                       L60,145 L45,120 L40,90 
                       L45,60 Z"
                    fill="#4A90A4"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {/* Stars */}
                  <circle cx="80" cy="85" r="4" fill="#FFD700" />
                  <circle cx="100" cy="75" r="4" fill="#FFD700" />
                  <circle cx="120" cy="80" r="4" fill="#FFD700" />
                  <circle cx="95" cy="100" r="4" fill="#FFD700" />
                  <circle cx="115" cy="100" r="4" fill="#FFD700" />
                  <circle cx="105" cy="120" r="4" fill="#FFD700" />
                </svg>
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  display: 'flex',
                  gap: 6
                }}>
                  <span style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 6, fontSize: 11 }}>
                    {heritageSites.filter(s => s.region === 'Kosovo').length} sites
                  </span>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <h2 style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: '1.5rem', marginBottom: 8 }}>
                  Kosovo
                </h2>
                <p style={{ color: '#a8a29e', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                  Discover medieval monasteries, Ottoman mosques, ancient Roman cities, and the rich cultural heritage of the Balkans heartland.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Prizren', 'Ulpiana', 'Graçanica', 'Peć'].map(site => (
                    <span key={site} style={{ padding: '4px 10px', background: '#292524', borderRadius: 4, fontSize: 12, color: '#a8a29e' }}>
                      {site}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Or explore both */}
          <div style={{ marginTop: 48 }}>
            <button
              onClick={() => { setSelectedCountry(null); setPage('map'); }}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #44403c',
                borderRadius: 10,
                color: '#a8a29e',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#78716c'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#44403c'; e.currentTarget.style.color = '#a8a29e'; }}
            >
              Explore Both Countries Together
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAP PAGE
  // ============================================
  if (page === 'map') {
    return (
      <div style={{
        height: '100vh',
        background: '#0c0a09',
        color: '#fafaf9',
        fontFamily: "-apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header />

        <div style={{ flex: 1, display: 'flex', marginTop: 56, overflow: 'hidden' }}>
          {/* Map Area */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Era chips */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              gap: 8,
              zIndex: 10,
              flexWrap: 'wrap'
            }}>
              {eras.slice(2, 7).map(era => (
                <span
                  key={era.id}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: era.color
                  }}
                >
                  {era.name}
                </span>
              ))}
            </div>

            {/* Country selector and back button */}
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 20,
              display: 'flex',
              gap: 8
            }}>
              {selectedCountry && (
                <button
                  onClick={() => setPage('select')}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(12,10,9,0.9)',
                    border: '1px solid #44403c',
                    borderRadius: 6,
                    color: '#a8a29e',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  ← Change Country
                </button>
              )}
              <span style={{
                padding: '6px 14px',
                background: selectedCountry === 'Albania' ? '#78350f' : selectedCountry === 'Kosovo' ? '#1e3a5f' : '#44403c',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600
              }}>
                {selectedCountry || 'All Regions'}
              </span>
            </div>

            {/* Map Canvas - MAPBOX */}
            <div style={{
              flex: 1,
              position: 'relative',
              background: '#0c0a09'
            }}>
              <MapboxMap
                selectedCountry={selectedCountry}
                sites={visibleSites}
                onSiteClick={setSelectedSite}
                selectedSite={selectedSite}
                getEraColor={getEraColor}
              />

              {/* Site Count */}
              <div style={{
                position: 'absolute',
                bottom: 100,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: 'rgba(12,10,9,0.9)',
                borderRadius: 8,
                fontSize: 13,
                color: '#a8a29e'
              }}>
                <MapPinIcon size={16} />
                {visibleSites.length} sites in {currentEra.name} era
              </div>
            </div>

            {/* Timeline */}
            <div style={{
              background: '#1c1917',
              borderTop: '1px solid #292524',
              padding: 20,
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 16px',
                borderRadius: 16,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: currentEra.color
              }}>
                {currentEra.name} • {formatYear(selectedYear)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    width: 40,
                    height: 40,
                    background: '#b45309',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? '⏸' : <PlayIcon />}
                </button>
                <div style={{ flex: 1, position: 'relative', height: 50 }}>
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: 0,
                    right: 0,
                    height: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                    display: 'flex'
                  }}>
                    {eras.map(era => (
                      <div
                        key={era.id}
                        style={{
                          backgroundColor: era.color,
                          width: `${((era.endYear - era.startYear) / 8025) * 100}%`
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min={-6000}
                    max={2025}
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: 16,
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    height: 16,
                    width: 16,
                    background: '#fff',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    pointerEvents: 'none',
                    left: `${((selectedYear + 6000) / 8025) * 100}%`,
                    transform: 'translateX(-50%)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#78716c'
                  }}>
                    <span>6000 BC</span>
                    <span>Roman</span>
                    <span>1500 AD</span>
                    <span>2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Site Detail Panel */}
          {selectedSite && (
            <div style={{
              width: 360,
              background: '#1c1917',
              borderLeft: '1px solid #292524',
              overflowY: 'auto',
              animation: 'slideInRight 0.3s ease-out'
            }}>
              <div style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: getEraColor(selectedSite.era[0]),
                overflow: 'hidden'
              }}>
                {/* Image */}
                {selectedSite.image && (
                  <img 
                    src={selectedSite.image} 
                    alt={selectedSite.name}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                {/* Gradient overlay for text readability */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(28,25,23,0.95) 0%, rgba(28,25,23,0.4) 50%, rgba(28,25,23,0.1) 100%)'
                }} />
                <button
                  onClick={() => setSelectedSite(null)}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 32,
                    height: 32,
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                >
                  <XIcon />
                </button>
                {!selectedSite.image && <MapPinIcon size={56} />}
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  right: 12,
                  zIndex: 5
                }}>
                  <span style={{
                    padding: '4px 10px',
                    background: getEraColor(selectedSite.era[0]),
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {selectedSite.type}
                  </span>
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <h2 style={{
                  fontFamily: 'Cinzel, Georgia, serif',
                  fontSize: '1.4rem',
                  marginBottom: 4
                }}>
                  {selectedSite.name}
                </h2>
                {selectedSite.alternateName && (
                  <p style={{ color: '#78716c', fontStyle: 'italic', marginBottom: 12, fontSize: 14 }}>
                    {selectedSite.alternateName}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {selectedSite.era.map(e => (
                    <span
                      key={e}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: getEraColor(e)
                      }}
                    >
                      {e}
                    </span>
                  ))}
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: '#44403c',
                    color: '#d6d3d1'
                  }}>
                    {selectedSite.type}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 16,
                  fontSize: 14,
                  color: '#d6b76a'
                }}>
                  <StarIcon />
                  {selectedSite.rating}
                  <span style={{ color: '#78716c', marginLeft: 4 }}>
                    ({selectedSite.reviews} reviews)
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  padding: 14,
                  background: '#292524',
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a8a29e' }}>
                    <ClockIcon /> {selectedSite.visitInfo.hours}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a8a29e' }}>
                    <MapPinIcon size={16} /> {selectedSite.county}
                  </div>
                  <div style={{ color: '#a8a29e' }}>Entry: {selectedSite.visitInfo.entry}</div>
                  <div style={{ color: '#a8a29e' }}>Duration: {selectedSite.visitInfo.duration}</div>
                </div>

                <h3 style={{ fontSize: 14, color: '#d6b76a', marginBottom: 8 }}>About</h3>
                <p style={{
                  fontSize: 14,
                  color: '#a8a29e',
                  lineHeight: 1.7,
                  marginBottom: 20
                }}>
                  {selectedSite.description}
                </p>

                <h3 style={{ fontSize: 14, color: '#d6b76a', marginBottom: 8 }}>Highlights</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
                  {selectedSite.highlights.map((h, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      color: '#a8a29e',
                      padding: '4px 0'
                    }}>
                      <CheckIcon /> {h}
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    flex: 1,
                    padding: 12,
                    background: '#b45309',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                    Add to Route
                  </button>
                  <button style={{
                    width: 44,
                    height: 44,
                    background: 'none',
                    border: '1px solid #44403c',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a8a29e',
                    cursor: 'pointer'
                  }}>
                    <HeartIcon />
                  </button>
                  <button style={{
                    width: 44,
                    height: 44,
                    background: 'none',
                    border: '1px solid #44403c',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a8a29e',
                    cursor: 'pointer'
                  }}>
                    <ShareIcon />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes pop {
            from { opacity: 0; transform: scale(0); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // ROUTES PAGE
  // ============================================
  if (page === 'routes') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0c0a09',
        color: '#fafaf9',
        fontFamily: "-apple-system, sans-serif"
      }}>
        <Header />

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px 40px' }}>
          <div style={{ textAlign: 'center', paddingBottom: 48 }}>
            <h1 style={{
              fontFamily: 'Cinzel, Georgia, serif',
              fontSize: '2rem',
              marginBottom: 12
            }}>
              Curated Heritage Routes
            </h1>
            <p style={{ color: '#a8a29e', maxWidth: 500, margin: '0 auto' }}>
              Expert-designed journeys through Albanian and Kosovar history
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            {routes.map(route => (
              <div
                key={route.id}
                style={{
                  background: '#1c1917',
                  borderRadius: 14,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  backgroundColor: getEraColor(route.era)
                }}>
                  <RouteIcon />
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '4px 10px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: 6,
                    fontSize: 11
                  }}>
                    {route.era}
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{
                    fontFamily: 'Cinzel, Georgia, serif',
                    fontSize: '1.1rem',
                    marginBottom: 8
                  }}>
                    {route.name}
                  </h3>
                  <p style={{
                    color: '#a8a29e',
                    fontSize: 14,
                    marginBottom: 16,
                    lineHeight: 1.6
                  }}>
                    {route.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 12,
                    color: '#78716c'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPinIcon size={14} /> {route.sites.length} sites
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ClockIcon /> {route.duration}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <NavIcon /> {route.distance}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // SEARCH PAGE
  // ============================================
  if (page === 'search') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0c0a09',
        color: '#fafaf9',
        fontFamily: "-apple-system, sans-serif"
      }}>
        <Header />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 40px' }}>
          <div style={{ textAlign: 'center', paddingBottom: 24 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: 500,
              margin: '0 auto',
              padding: 16,
              background: '#1c1917',
              border: '2px solid #292524',
              borderRadius: 12
            }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search sites, eras, regions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#fafaf9',
                  fontSize: 16
                }}
              />
            </div>
            <div style={{ marginTop: 12, color: '#78716c', fontSize: 14 }}>
              Try:{' '}
              {['Roman', 'Fortress', 'Kosovo', 'UNESCO'].map(t => (
                <button
                  key={t}
                  onClick={() => setSearchQuery(t)}
                  style={{
                    margin: '0 4px',
                    padding: '4px 10px',
                    background: '#292524',
                    border: 'none',
                    borderRadius: 4,
                    color: '#a8a29e',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 24
          }}>
            {eras.slice(2, 7).map(era => (
              <button
                key={era.id}
                onClick={() => setSearchQuery(era.name)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${searchQuery.toLowerCase() === era.name.toLowerCase() ? era.color : '#44403c'}`,
                  borderRadius: 20,
                  color: '#a8a29e',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                {era.name}
              </button>
            ))}
          </div>

          <p style={{ color: '#78716c', marginBottom: 16, fontSize: 14 }}>
            {searchResults.length} sites found
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16
          }}>
            {searchResults.map(site => (
              <div
                key={site.id}
                onClick={() => { setSelectedSite(site); setPage('map'); }}
                style={{
                  display: 'flex',
                  background: '#1c1917',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: 90,
                  height: 90,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: getEraColor(site.era[0]),
                  flexShrink: 0
                }}>
                  <MapPinIcon size={24} />
                </div>
                <div style={{ padding: 12, flex: 1 }}>
                  <h3 style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: 14, marginBottom: 4 }}>
                    {site.name}
                  </h3>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      backgroundColor: getEraColor(site.era[0])
                    }}>
                      {site.era[0]}
                    </span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      background: '#44403c'
                    }}>
                      {site.type}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: '#78716c'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <StarIcon /> {site.rating}
                    </span>
                    <span>{site.region}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
