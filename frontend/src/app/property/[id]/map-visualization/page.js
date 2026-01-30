'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiClient from '@/services/api';

// --- CSS Imports (Crucial for Map Rendering) ---
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// --- Helper Component: Counting Animation for Green Points ---
const CountUpAnimation = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

const MapVisualizationPage = () => {
  const router = useRouter();
  const { id } = useParams();
  
  // Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null); // Track map instance to prevent duplicates
  const drawnItemsRef = useRef(null);  // Track drawn shapes

  // State
  const [property, setProperty] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // 1. Fetch Property Data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const response = await apiClient.getProperty(id);
        setProperty(response.data);
        
        // If analysis already exists, load it immediately
        if (response.data.satelliteVerification?.status === 'verified') {
          setAnalysisResult({
            summary: {
              green_points_year: response.data.satelliteVerification.greenPointsYear || 0,
              carbon_credits_year: response.data.satelliteVerification.carbonCreditsYear || 0,
              total_area_ha: response.data.satelliteVerification.totalAreaHa || 0,
            },
            meta: response.data.satelliteVerification.meta || { image_date: '-' },
            breakdown: response.data.satelliteVerification.breakdown || [],
            images: response.data.satelliteVerification.images || {}
          });
          setShowPanel(true);
        }
      } catch (err) {
        setPageError(err.message || 'Failed to load property');
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || pageLoading || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet-draw');

        // Setup Map
        const map = L.map(mapContainerRef.current, {
          tap: false,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true
        }).setView([28.6139, 77.2090], 13);

        mapInstanceRef.current = map;

        // --- SATELLITE LAYER (Esri World Imagery) ---
        // Replacing Google Maps to prevent "checkerboard" loading issues
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Esri',
          maxZoom: 19
        }).addTo(map);
        
        // Optional: Labels (Road names, city names)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }).addTo(map);

        // Feature Group for Drawn Items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;

        // Draw Controls
        const drawControl = new L.Control.Draw({
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: {
                color: '#ff0000',
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

        // Event Listeners
        map.on(L.Draw.Event.CREATED, (e) => {
          const layer = e.layer;
          setupLayer(layer);
          const geojson = layer.toGeoJSON();
          const coords = geojson.geometry.coordinates[0];
          runAnalysis(coords);
        });

        // If property has existing boundary, draw it
        if (property?.boundaryCoordinates?.length > 0) {
          const latLngs = property.boundaryCoordinates.map(c => [c.lat, c.lng]);
          const polygon = L.polygon(latLngs, { color: '#ff0000', weight: 4, fillOpacity: 0.1 });
          setupLayer(polygon);
        }

      } catch (err) {
        console.error('Map init error:', err);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pageLoading, property]);

  // --- Logic Helpers ---

  const setupLayer = (layer) => {
    if (!drawnItemsRef.current || !mapInstanceRef.current) return;
    
    drawnItemsRef.current.clearLayers();
    drawnItemsRef.current.addLayer(layer);
    
    // Smooth Fly-to Animation for UX
    mapInstanceRef.current.fitBounds(layer.getBounds(), {
      padding: [100, 100],
      maxZoom: 20,
      animate: true,
      duration: 1.5
    });
  };

  const runAnalysis = async (coords) => {
    setIsAnalyzing(true);
    setShowPanel(true);
    setAnalysisResult(null); // Clear previous results

    try {
      // Direct call to your backend satellite endpoint
      const result = await apiClient.verifyPropertyWithSatellite(id, coords);
      
      if (result.success && result.data?.analysisResult) {
        setAnalysisResult(result.data.analysisResult);
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
    } catch (err) {
      alert(`Analysis Error: ${err.message}`);
      setShowPanel(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualPaste = () => {
    try {
      const coords = JSON.parse(manualInput);
      if (!Array.isArray(coords)) throw new Error('Invalid format');
      
      // Leaflet uses [Lat, Lng], GeoJSON uses [Lng, Lat]. 
      const leafletCoords = coords.map(p => [p[1], p[0]]);
      
      // We must use the 'L' instance from the map if possible, 
      // but since we are outside useEffect, we use global window.L or re-import.
      // Easiest is to rely on the loaded map instance to add layer.
      if (typeof window !== 'undefined' && window.L && mapInstanceRef.current) {
         const L = window.L; // Leaflet attaches to window
         const layer = L.polygon(leafletCoords, { color: '#ff0000', weight: 4 });
         setupLayer(layer);
         runAnalysis(coords);
      } else {
         // Fallback if window.L isn't ready (unlikely if map is loaded)
         alert("Map not ready yet");
      }
    } catch (e) {
      alert("Invalid JSON. Use format: [[lon,lat], [lon,lat]...]");
    }
  };

  const handleReset = () => {
    if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
    setShowPanel(false);
    setAnalysisResult(null);
  };

  // --- Rendering ---

  if (pageLoading) return <div style={styles.center}><div style={styles.loader}></div></div>;
  if (pageError) return <div style={styles.center}><h3>Error: {pageError}</h3><button onClick={() => router.back()}>Go Back</button></div>;

  return (
    <div style={styles.container}>
      {/* 1. Map Container */}
      <div ref={mapContainerRef} style={styles.map} />

      {/* 2. Manual Input (For Testing/Admin) */}
      <div style={styles.manualInput}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📍 Manual Coordinates</h4>
        <textarea
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Paste [[lon,lat],...] here..."
          style={styles.textarea}
        />
        <button onClick={handleManualPaste} style={styles.button}>Go to Location</button>
      </div>

      {/* 3. Results Panel */}
      {showPanel && (
        <div style={styles.panel}>
          
          {/* Header */}
          <h2 style={styles.heading}>
            {isAnalyzing ? "Analyzing Satellite Data..." : "Analysis Complete"}
          </h2>

          {/* Loading State */}
          {isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={styles.loader}></div>
              <p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '10px' }}>Scanning historical vegetation data...</p>
            </div>
          )}

          {/* Results State */}
          {!isAnalyzing && analysisResult && (
            <div className="animate-fade-in">
              {/* Hero: Green Points */}
              <div style={styles.heroCard}>
                <div style={styles.heroValue}>
                  <CountUpAnimation end={analysisResult.summary.green_points_year} />
                </div>
                <div style={styles.heroLabel}>Green Points / Year</div>
              </div>

              {/* Grid Stats */}
              <div style={styles.grid}>
                <div style={styles.miniStat}>
                  <div style={styles.miniValue}>{analysisResult.summary.carbon_credits_year}</div>
                  <div style={styles.miniLabel}>Credits (Tons)</div>
                </div>
                <div style={styles.miniStat}>
                  <div style={styles.miniValue}>{analysisResult.summary.total_area_ha}</div>
                  <div style={styles.miniLabel}>Hectares</div>
                </div>
              </div>

              {/* Breakdown Bars */}
              <h4 style={styles.subHeading}>Land Composition</h4>
              <div style={{ marginBottom: '20px' }}>
                {analysisResult.breakdown.map((item, idx) => {
                  let color = '#ccc';
                  if (item.type.includes('Tree')) color = '#2ecc71';   // Green
                  if (item.type.includes('Garden')) color = '#f1c40f'; // Yellow
                  if (item.type.includes('Built')) color = '#95a5a6';  // Grey
                  
                  return (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '2px' }}>
                        <span>{item.type}</span>
                        <strong>{item.percent}%</strong>
                      </div>
                      <div style={{ height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.percent}%`, background: color, height: '100%' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Satellite Images */}
              <h4 style={styles.subHeading}>Satellite Analysis</h4>
              <div style={styles.imageRow}>
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={`data:image/png;base64,${analysisResult.images.satellite}`} 
                    onClick={() => window.open(`data:image/png;base64,${analysisResult.images.satellite}`)}
                    style={styles.thumbnail} 
                    alt="Satellite"
                  />
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>True Color</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={`data:image/png;base64,${analysisResult.images.analysis}`} 
                    onClick={() => window.open(`data:image/png;base64,${analysisResult.images.analysis}`)}
                    style={styles.thumbnail} 
                    alt="AI Mask"
                  />
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>AI Mask</div>
                </div>
              </div>

              <div style={{ marginTop: '15px', fontSize: '11px', color: '#999', textAlign: 'center' }}>
                Imagery Date: {analysisResult.meta.image_date}
              </div>

              <button onClick={handleReset} style={styles.secondaryButton}>
                Clear Analysis
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// --- Inline Styles (Clean & Modern) ---
const styles = {
  container: { position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: '"Segoe UI", sans-serif' },
  map: { height: '100%', width: '100%', zIndex: 1 },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' },
  
  // Floating Panel
  panel: {
    position: 'absolute', top: '20px', right: '20px', width: '340px',
    background: 'rgba(255, 255, 255, 0.95)', padding: '24px', borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000,
    backdropFilter: 'blur(10px)', maxHeight: '90vh', overflowY: 'auto'
  },
  
  // Manual Input
  manualInput: {
    position: 'absolute', bottom: '20px', left: '20px', width: '300px',
    background: 'white', padding: '16px', borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000
  },
  
  // Text Styles
  heading: { margin: '0 0 20px 0', color: '#2c3e50', fontSize: '20px', fontWeight: '600' },
  subHeading: { margin: '0 0 10px 0', fontSize: '14px', color: '#34495e', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  // Hero Card
  heroCard: {
    background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    padding: '20px', borderRadius: '12px', marginBottom: '20px',
    textAlign: 'center', color: '#1e4620', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  },
  heroValue: { fontSize: '36px', fontWeight: '800', lineHeight: '1' },
  heroLabel: { fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px', opacity: 0.8 },
  
  // Grid
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' },
  miniStat: { background: '#f8f9fa', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e9ecef' },
  miniValue: { fontWeight: '700', fontSize: '20px', color: '#2c3e50' },
  miniLabel: { fontSize: '11px', color: '#7f8c8d' },
  
  // Images
  imageRow: { display: 'flex', gap: '12px', justifyContent: 'center' },
  thumbnail: {
    width: '130px', height: '130px', objectFit: 'cover', borderRadius: '8px',
    border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer',
    transition: 'transform 0.2s'
  },

  // Inputs & Buttons
  textarea: {
    width: '100%', height: '60px', marginBottom: '10px',
    border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px',
    fontFamily: 'monospace', fontSize: '12px', resize: 'none'
  },
  button: {
    width: '100%', padding: '10px', background: '#27ae60', color: 'white',
    border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer',
    transition: 'background 0.2s'
  },
  secondaryButton: {
    width: '100%', padding: '12px', marginTop: '20px', background: '#ecf0f1',
    color: '#7f8c8d', border: 'none', borderRadius: '8px', fontWeight: '600',
    cursor: 'pointer'
  },
  loader: {
    border: '3px solid #f3f3f3', borderTop: '3px solid #27ae60',
    borderRadius: '50%', width: '30px', height: '30px',
    animation: 'spin 1s linear infinite', margin: '0 auto'
  }
};

export default MapVisualizationPage;