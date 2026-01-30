'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import apiClient from '@/services/api';

const SatelliteVerificationPage = () => {
  const router = useRouter();
  const { id } = useParams(); // Get property ID from URL params
  const mapContainerRef = useRef(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load property data and current user on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get property details
        const propertyResponse = await apiClient.getProperty(id);
        setProperty(propertyResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load property');
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Initialize the map and functionality when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && mapContainerRef.current && !window.leafletMapInitialized) {
      // Dynamically load Leaflet and Leaflet Draw
      const loadLibraries = async () => {
        try {
          // Load Leaflet and Leaflet Draw
          const L = (await import('leaflet')).default;
          await import('leaflet-draw');

          // Initialize the map exactly like in landowner2.html
          const map = L.map(mapContainerRef.current, {
            // Suppress touch event warnings
            tap: false,
            // Other options to prevent scroll conflicts
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true
          }).setView([28.6139, 77.2090], 13);

          // Mark that the map has been initialized to prevent multiple initializations
          window.leafletMapInitialized = true;

          L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
            maxZoom: 22, // Allow deep zoom for micro-plots
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
          }).addTo(map);

          // Add Drawing Layer
          const drawnItems = new L.FeatureGroup();
          map.addLayer(drawnItems);

          const drawControl = new L.Control.Draw({
            draw: {
              polygon: {
                allowIntersection: false,
                showArea: true,
                shapeOptions: {
                  color: '#ff0000', // RED BOUNDARY
                  weight: 4,
                  opacity: 1,
                  fillOpacity: 0.1
                }
              },
              marker: false, circle: false, circlemarker: false,
              polyline: false, rectangle: true
            },
            edit: { featureGroup: drawnItems }
          });
          map.addControl(drawControl);

          // EVENT: Shape Drawn
          map.on(L.Draw.Event.CREATED, function (e) {
            const layer = e.layer;
            setupLayer(layer);

            // Extract Coordinates for API
            const geojson = layer.toGeoJSON();
            const coords = geojson.geometry.coordinates[0];
            runAnalysis(coords);
          });

          // Helper to handle layer zoom & style
          const setupLayer = (layer) => {
            drawnItems.clearLayers();
            drawnItems.addLayer(layer);

            // SMART ZOOM: Fly to the bounds of the drawn shape
            map.fitBounds(layer.getBounds(), {
              padding: [100, 100], // Keep some space around it
              maxZoom: 20,
              animate: true,
              duration: 1.5
            });
          };

          // EVENT: Manual Paste
          const parseAndRun = () => {
            try {
              const input = document.getElementById('coordsInput').value;
              const coords = JSON.parse(input);

              // Create polygon from coords
              // Note: Leaflet expects [Lat, Lon], but GeoJSON/API uses [Lon, Lat]
              // We need to flip them for Leaflet display
              const leafletCoords = coords.map(p => [p[1], p[0]]);

              const poly = L.polygon(leafletCoords, {
                color: '#ff0000', weight: 4, fillOpacity: 0.1
              });

              setupLayer(poly); // Auto-Zoom happens here
              runAnalysis(coords); // Run API

            } catch(e) {
              alert("Invalid JSON format. Use [[lon,lat], [lon,lat]...]");
            }
          };

          // API Logic - using the same approach as landowner2.html but routing through backend
          const runAnalysis = async (coords) => {
            // UI State: Loading
            document.getElementById('panel').style.display = 'block';
            document.getElementById('loader').style.display = 'block';
            document.getElementById('resultsContent').style.display = 'none';
            document.getElementById('statusTitle').innerText = "Analyzing Satellite Data...";

            try {
              // Use the backend API to call the satellite service (integrating with DB)
              const result = await apiClient.verifyPropertyWithSatellite(id, coords);

              if(result.success) {
                displayResults(result.data.analysisResult);
              } else {
                alert("Error: " + (result.message || "Unknown error"));
                resetMap();
                return;
              }

            } catch (err) {
              alert("Connection Failed: " + (err.message || "Unable to connect to satellite service"));
              console.error(err);
              document.getElementById('panel').style.display = 'none';
            }
          };

          const displayResults = (data) => {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('resultsContent').style.display = 'block';
            document.getElementById('statusTitle').innerText = "Analysis Complete";

            // Populate Stats
            animateValue("greenPoints", 0, data.summary.green_points_year, 1500);
            document.getElementById('carbonCredits').innerText = data.summary.carbon_credits_year;
            document.getElementById('area').innerText = data.summary.total_area_ha;
            document.getElementById('imgDate').innerText = data.meta.image_date;

            // Populate Images - using the exact same approach as landowner2.html
            if (data.images && data.images.satellite) {
              document.getElementById('satImage').src = "data:image/png;base64," + data.images.satellite;
            } else {
              console.warn("Satellite image not available in response");
            }

            if (data.images && data.images.analysis) {
              document.getElementById('anaImage').src = "data:image/png;base64," + data.images.analysis;
            } else {
              console.warn("Analysis image not available in response");
            }

            // Populate Breakdown - using the exact same approach as landowner2.html
            const list = document.getElementById('breakdownList');
            list.innerHTML = '';

            if (data.breakdown) {
              data.breakdown.forEach(item => {
                // Color coding - using the exact same approach as landowner2.html
                let color = '#ccc';
                if(item.type.includes("Tree")) color = '#2ecc71';
                if(item.type.includes("Garden")) color = '#f1c40f';
                if(item.type.includes("Built")) color = '#95a5a6';

                const div = document.createElement('div');
                div.style.marginBottom = "8px";
                div.innerHTML = `
                  <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:2px;">
                    <span>${item.type}</span>
                    <strong>${item.percent}%</strong>
                  </div>
                  <div style="height:6px; background:#eee; border-radius:3px; overflow:hidden;">
                    <div style="width:${item.percent}%; background:${color}; height:100%;"></div>
                  </div>
                `;
                list.appendChild(div);
              });
            } else {
              console.warn("Breakdown data not available in response");
            }
          };

          const animateValue = (id, start, end, duration) => {
            if (start === end) return;
            var range = end - start;
            var current = start;
            var increment = end > start ? Math.ceil(range / (duration / 10)) : 1;
            var stepTime = Math.abs(Math.floor(duration / range));
            var obj = document.getElementById(id);
            var timer = setInterval(function() {
              current += increment;
              if (current >= end) {
                current = end;
                clearInterval(timer);
              }
              obj.innerHTML = current.toLocaleString();
            }, 10);
          };

          const resetMap = () => {
            drawnItems.clearLayers();
            document.getElementById('panel').style.display = 'none';
          };

          // If property has boundary coordinates, draw them on the map
          if (property && property.boundaryCoordinates && property.boundaryCoordinates.length > 0) {
            // Convert from {lat, lng} to [lat, lng] format for Leaflet
            const leafletCoords = property.boundaryCoordinates.map(coord => [coord.lat, coord.lng]);

            const polygon = L.polygon(leafletCoords, {
              color: '#ff0000',
              weight: 4,
              fillOpacity: 0.1
            });

            setupLayer(polygon);
          }

          // Expose functions to global scope so they can be called from HTML
          window.parseAndRun = parseAndRun;
          window.resetMap = resetMap;

        } catch (err) {
          console.error('Error loading map libraries:', err);
          setError('Failed to load map libraries. Please refresh the page.');
        }
      };

      loadLibraries();
    }
  }, [property, id]); // Only run once when component mounts

  // Cleanup function to remove the map when component unmounts
  useEffect(() => {
    return () => {
      if (window.leafletMapInitialized && typeof window !== 'undefined') {
        delete window.leafletMapInitialized;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <p>Loading property...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="auth-container">
            <div className="auth-form">
              <h2>Error</h2>
              <p>{error}</p>
              <Link href="/dashboard" className="action-button primary">Back to Dashboard</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1 className="dashboard-title">{property?.title} - Satellite Verification</h1>
              <p className="dashboard-subtitle">Draw your property boundaries and analyze carbon potential</p>
            </div>

            <div className="dashboard-content">
              <div className="auth-form">
                {error && <div className="error-message">{error}</div>}

                {/* Map Container */}
                <div style={{ position: 'relative', height: '600px', width: '100%', marginBottom: '2rem' }}>
                  <div 
                    ref={mapContainerRef} 
                    id="map"
                    style={{ 
                      height: '100%', 
                      width: '100%', 
                      zIndex: 1,
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  ></div>

                  {/* Manual Input Panel */}
                  <div className="manual-input">
                    <h4 style={{ margin: '0 0 10px 0' }}>📍 Manual Coordinates</h4>
                    <textarea 
                      id="coordsInput" 
                      placeholder="Paste [[lon,lat],...] here..."
                      style={{
                        width: '100%', 
                        height: '60px', 
                        marginBottom: '10px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px', 
                        padding: '5px', 
                        fontFamily: 'monospace', 
                        fontSize: '12px', 
                        boxSizing: 'border-box'
                      }}
                    ></textarea>
                    <button 
                      onClick={() => window.parseAndRun && window.parseAndRun()}
                      style={{ 
                        padding: '8px', 
                        fontSize: '14px' 
                      }}
                    >
                      Go to Location
                    </button>
                  </div>

                  {/* Results Panel */}
                  <div className="floating-panel" id="panel" style={{ display: 'none' }}>
                    <h2 id="statusTitle">Analyzing...</h2>
                    <div id="loader" className="loader"></div>

                    <div id="resultsContent" style={{ display: 'none' }}>
                      <div className="stat-card">
                        <div className="stat-value" id="greenPoints">0</div>
                        <div className="stat-label">Green Points / Year</div>
                      </div>

                      <div className="grid-stats">
                        <div className="mini-stat">
                          <div className="mini-val" id="carbonCredits">0</div>
                          <div className="mini-lbl">Credits (Tons)</div>
                        </div>
                        <div className="mini-stat">
                          <div className="mini-val" id="area">0</div>
                          <div className="mini-lbl">Hectares</div>
                        </div>
                      </div>

                      <h4 style={{ marginBottom: '10px' }}>Land Composition</h4>
                      <div id="breakdownList" style={{ marginBottom: '20px' }}></div>

                      <h4 style={{ marginBottom: '10px' }}>Satellite Analysis</h4>
                      <div className="images-container">
                        <div>
                          <img id="satImage" className="res-image" onClick={() => {
                            const img = document.getElementById('satImage');
                            if (img) window.open(img.src);
                          }} />
                          <div style={{ fontSize: '10px', textAlign: 'center' }}>True Color</div>
                        </div>
                        <div>
                          <img id="anaImage" className="res-image" onClick={() => {
                            const img = document.getElementById('anaImage');
                            if (img) window.open(img.src);
                          }} />
                          <div style={{ fontSize: '10px', textAlign: 'center' }}>AI Mask</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '20px', fontSize: '11px', color: '#999', textAlign: 'center' }}>
                        Image Date: <span id="imgDate">-</span>
                      </div>

                      <button onClick={() => window.resetMap && window.resetMap()} style={{ marginTop: '15px', background: '#95a5a6' }}>Clear Map</button>
                    </div>
                  </div>
                </div>

                <div className="dashboard-actions">
                  <Link href={`/property/${id}`} className="action-button secondary">
                    Back to Property
                  </Link>
                  <Link href="/dashboard" className="action-button secondary">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style jsx global>{`
        body { margin: 0; font-family: 'Segoe UI', sans-serif; overflow: hidden; }

        #map {
          height: 100%;
          width: 100%;
          z-index: 1;
        }

        /* Floating Control Panel */
        .floating-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 340px;
          background: rgba(255, 255, 255, 0.95);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          z-index: 1000;
          backdrop-filter: blur(10px);
          max-height: 90vh;
          overflow-y: auto;
        }

        /* Manual Input Toggle */
        .manual-input {
          position: absolute;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          width: 300px;
        }

        h2 { margin: 0 0 15px 0; color: #2c3e50; font-size: 22px; }

        .stat-card {
          background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          color: #1e4620;
        }

        .stat-value { font-size: 32px; font-weight: 800; line-height: 1; }
        .stat-label { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; opacity: 0.8; }

        .grid-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .mini-stat { background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center; border: 1px solid #eee; }
        .mini-val { font-weight: bold; font-size: 18px; color: #2c3e50; }
        .mini-lbl { font-size: 11px; color: #7f8c8d; }

        .images-container { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; }
        .res-image { width: 140px; height: 140px; object-fit: cover; border-radius: 8px; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; }

        button {
          background: #27ae60; color: white; border: none;
          padding: 12px; border-radius: 8px; width: 100%;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        button:hover { background: #219150; transform: translateY(-1px); }

        textarea { width: 100%; height: 60px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; padding: 5px; font-family: monospace; font-size: 12px; box-sizing: border-box;}

        .loader {
          border: 3px solid #f3f3f3; border-top: 3px solid #27ae60;
          border-radius: 50%; width: 24px; height: 24px;
          animation: spin 1s linear infinite; margin: 20px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SatelliteVerificationPage;