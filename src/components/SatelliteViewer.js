import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './SatelliteViewer.css';

const SatelliteViewer = ({ satelliteData, isConnected, selectedSatellites, constellationMode }) => {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const satelliteEntityRef = useRef(null);
  const groundStationEntityRef = useRef(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [viewMode, setViewMode] = useState('global');
  const [showFeatures, setShowFeatures] = useState({
    orbit: true,
    groundTrack: true,
    coverage: false,
    groundStation: true,
    realTimeData: true
  });

  // Helper function to get random satellite colors
  const getRandomSatelliteColor = () => {
    const colors = [
      window.Cesium.Color.CYAN,
      window.Cesium.Color.YELLOW,
      window.Cesium.Color.LIME,
      window.Cesium.Color.ORANGE,
      window.Cesium.Color.PINK,
      window.Cesium.Color.LIGHTBLUE,
      window.Cesium.Color.LIGHTGREEN,
      window.Cesium.Color.GOLD,
      window.Cesium.Color.VIOLET,
      window.Cesium.Color.CORAL
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Helper function to get constellation-specific colors
  const getConstellationColor = (groupName) => {
    const colors = {
      'starlink': window.Cesium.Color.CYAN,
      'galileo': window.Cesium.Color.YELLOW,
      'gps': window.Cesium.Color.LIME,
      'glonass': window.Cesium.Color.RED,
      'space_stations': window.Cesium.Color.ORANGE,
      'weather': window.Cesium.Color.LIGHTBLUE,
      'active': window.Cesium.Color.WHITE
    };
    return colors[groupName] || window.Cesium.Color.LIGHTGRAY;
  };

  // Helper function to generate satellite icon based on type
  const getSatelliteIcon = (satelliteName) => {
    const name = satelliteName.toLowerCase();
    
    if (name.includes('starlink')) {
      return '🛰️';
    } else if (name.includes('iss') || name.includes('station')) {
      return '🏗️';
    } else if (name.includes('gps') || name.includes('galileo') || name.includes('glonass')) {
      return '🧭';
    } else if (name.includes('weather') || name.includes('noaa')) {
      return '🌤️';
    } else {
      return '📡';
    }
  };

  // Load multiple individual satellites
  const loadMultipleSatellites = async (satelliteNames) => {
    if (!viewerRef.current || !satelliteNames?.length) return;

    try {
      console.log(`Loading ${satelliteNames.length} satellites...`);
      
      // Clear existing satellites
      viewerRef.current.entities.removeAll();
      
      // Re-add ground station
      addGroundStation();
      
      // Load each satellite (limit to 10 for performance)
      const satellitesToLoad = satelliteNames.slice(0, 10);
      
      for (const satName of satellitesToLoad) {
        try {
          const response = await axios.get(`http://localhost:5000/api/satellite/${encodeURIComponent(satName)}/position`);
          const satData = response.data;
          
          if (satData && satData.latitude && satData.longitude) {
            // Add satellite entity
            const satelliteEntity = viewerRef.current.entities.add({
              name: satName,
              position: window.Cesium.Cartesian3.fromDegrees(
                satData.longitude,
                satData.latitude, 
                satData.altitude * 1000
              ),
              
              // Satellite point visualization
              point: {
                pixelSize: 8,
                color: getRandomSatelliteColor(),
                outlineColor: window.Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: window.Cesium.HeightReference.NONE
              },
              
              // Satellite label
              label: {
                text: `${getSatelliteIcon(satName)} ${satName.split(' ')[0]}`, // Short name with icon
                font: '10pt Arial',
                pixelOffset: new window.Cesium.Cartesian2(0, -30),
                fillColor: window.Cesium.Color.WHITE,
                outlineColor: window.Cesium.Color.BLACK,
                outlineWidth: 1,
                style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
                scale: 0.8
              },
              
              // Description for info box
              description: `
                <div style="font-family: Consolas, monospace; color: #00ff88;">
                  <h3>${satName}</h3>
                  <p><strong>Altitude:</strong> ${satData.altitude?.toFixed(2)} km</p>
                  <p><strong>Velocity:</strong> ${satData.velocity?.toFixed(2)} km/s</p>
                  <p><strong>Position:</strong> ${satData.latitude?.toFixed(4)}°, ${satData.longitude?.toFixed(4)}°</p>
                  <p><strong>Last Update:</strong> ${new Date(satData.timestamp).toLocaleString()}</p>
                </div>
              `
            });
            
            console.log(`✅ Loaded satellite: ${satName}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load satellite ${satName}:`, error);
        }
      }

      // Zoom to show all satellites
      if (viewerRef.current.entities.values.length > 1) {
        viewerRef.current.zoomTo(viewerRef.current.entities);
      }

    } catch (error) {
      console.error('Error loading multiple satellites:', error);
    }
  };

  // Load entire constellation
  const loadConstellation = async (groupName) => {
    if (!viewerRef.current || !groupName) return;

    try {
      console.log(`Loading ${groupName} constellation...`);
      
      const response = await axios.get(`http://localhost:5000/api/constellation/${groupName}?max=50`);
      const constellation = response.data;
      
      if (constellation && constellation.satellites) {
        // Clear existing entities
        viewerRef.current.entities.removeAll();
        
        // Re-add ground station
        addGroundStation();
        
        const constellationColor = getConstellationColor(groupName);
        let loadedCount = 0;
        
        // Add each satellite in the constellation
        constellation.satellites.forEach((sat, index) => {
          if (sat.latitude && sat.longitude) {
            viewerRef.current.entities.add({
              name: sat.name,
              position: window.Cesium.Cartesian3.fromDegrees(
                sat.longitude,
                sat.latitude,
                sat.altitude * 1000
              ),
              
              // Constellation point
              point: {
                pixelSize: 4,
                color: constellationColor.withAlpha(0.8),
                outlineColor: window.Cesium.Color.WHITE,
                outlineWidth: 1
              },
              
              // Smaller labels for constellation view
              label: {
                text: `${getSatelliteIcon(sat.name)} ${sat.norad_id || index}`,
                font: '8pt Arial',
                pixelOffset: new window.Cesium.Cartesian2(0, -20),
                fillColor: window.Cesium.Color.WHITE,
                style: window.Cesium.LabelStyle.FILL,
                scale: 0.6,
                show: loadedCount < 20 // Only show labels for first 20 satellites
              },
              
              // Description
              description: `
                <div style="font-family: Consolas, monospace; color: #00ff88;">
                  <h3>${sat.name}</h3>
                  <p><strong>NORAD ID:</strong> ${sat.norad_id}</p>
                  <p><strong>Altitude:</strong> ${sat.altitude?.toFixed(2)} km</p>
                  <p><strong>Velocity:</strong> ${sat.velocity?.toFixed(2)} km/s</p>
                  <p><strong>Group:</strong> ${constellation.group_name}</p>
                </div>
              `
            });
            loadedCount++;
          }
        });
        
        console.log(`✅ Loaded ${loadedCount} satellites from ${constellation.group_name}`);
        
        // Zoom to constellation
        if (viewerRef.current.entities.values.length > 1) {
          viewerRef.current.zoomTo(viewerRef.current.entities);
        }
        
        // Update camera for better constellation view
        setTimeout(() => {
          viewerRef.current.camera.setView({
            destination: window.Cesium.Cartesian3.fromDegrees(0, 0, 25000000)
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading constellation:', error);
    }
  };

  // Add ground station (keep existing implementation)
  const addGroundStation = () => {
    if (!showFeatures.groundStation || !viewerRef.current) return;
    
    const groundStationPosition = window.Cesium.Cartesian3.fromDegrees(77.5946, 12.9716, 920);
    
    groundStationEntityRef.current = viewerRef.current.entities.add({
      name: 'ISRO Ground Station - Bengaluru',
      position: groundStationPosition,
      
      cylinder: {
        length: 30.0,
        topRadius: 15.0,
        bottomRadius: 15.0,
        material: window.Cesium.Color.DARKGRAY.withAlpha(0.8),
        outline: true,
        outlineColor: window.Cesium.Color.WHITE
      },
      
      label: {
        text: '🏢 ISRO GS',
        font: '12pt Arial',
        pixelOffset: new window.Cesium.Cartesian2(0, -50),
        fillColor: window.Cesium.Color.YELLOW,
        outlineColor: window.Cesium.Color.BLACK,
        outlineWidth: 2,
        style: window.Cesium.LabelStyle.FILL_AND_OUTLINE
      }
    });
  };

  // Initialize Cesium viewer (keep existing implementation)
  useEffect(() => {
    if (!cesiumContainerRef.current || !window.Cesium) return;

    initializeAdvancedCesiumViewer();

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // Handle satellite selection changes
  useEffect(() => {
    if (isViewerReady && selectedSatellites && !constellationMode) {
      loadMultipleSatellites(selectedSatellites);
    }
  }, [selectedSatellites, isViewerReady]);

  // Handle constellation mode changes
  useEffect(() => {
    if (isViewerReady && constellationMode) {
      loadConstellation(constellationMode);
    }
  }, [constellationMode, isViewerReady]);

  // Keep all your existing initialization code here...
  const initializeAdvancedCesiumViewer = async () => {
    try {
      let terrainProvider;
      try {
        terrainProvider = await window.Cesium.createWorldTerrainAsync();
      } catch (terrainError) {
        console.warn('Using ellipsoid terrain:', terrainError);
        terrainProvider = new window.Cesium.EllipsoidTerrainProvider();
      }

      viewerRef.current = new window.Cesium.Viewer(cesiumContainerRef.current, {
        animation: true,
        baseLayerPicker: true,
        fullscreenButton: true,
        geocoder: true,
        homeButton: true,
        infoBox: true,
        sceneModePicker: true,
        selectionIndicator: true,
        timeline: true,
        navigationHelpButton: true,
        terrainProvider: terrainProvider,
        shadows: true,
        terrainShadows: window.Cesium.ShadowMode.RECEIVE_ONLY
      });

      // Enhanced graphics settings
      const scene = viewerRef.current.scene;
      scene.highDynamicRange = true;
      scene.postProcessStages.fxaa.enabled = true;
      scene.globe.enableLighting = true;
      scene.fog.enabled = true;
      scene.fog.density = 0.0002;

      // Set initial camera view
      viewerRef.current.camera.setView({
        destination: window.Cesium.Cartesian3.fromDegrees(0, 0, 15000000),
        orientation: {
          heading: 0,
          pitch: -window.Cesium.Math.PI_OVER_TWO,
          roll: 0
        }
      });

      setIsViewerReady(true);
      
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error);
    }
  };

  // Keep your existing camera mode and other functions...
  const setCameraMode = (mode) => {
    setViewMode(mode);
    const camera = viewerRef.current.camera;
    
    switch (mode) {
      case 'tracking':
        if (satelliteEntityRef.current) {
          viewerRef.current.trackedEntity = satelliteEntityRef.current;
        }
        break;
      case 'global':
      default:
        viewerRef.current.trackedEntity = undefined;
        camera.setView({
          destination: window.Cesium.Cartesian3.fromDegrees(0, 0, 15000000)
        });
        break;
    }
  };

  const toggleFeature = (feature) => {
    setShowFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  return (
    <div className="advanced-satellite-viewer">
      <div 
        ref={cesiumContainerRef} 
        style={{ 
          width: '100%', 
          height: '100vh'
        }}
      />
      
      {/* Keep your existing controls UI */}
      <div className="viewer-controls">
        <div className="control-group">
          <h4>📹 Camera Mode</h4>
          <div className="button-group">
            <button 
              className={viewMode === 'global' ? 'active' : ''}
              onClick={() => setCameraMode('global')}
            >
              🌍 Global
            </button>
            <button 
              className={viewMode === 'tracking' ? 'active' : ''}
              onClick={() => setCameraMode('tracking')}
            >
              🎯 Track
            </button>
          </div>
        </div>

        <div className="control-group">
          <h4>🎛️ Display Options</h4>
          <div className="toggle-group">
            <label>
              <input 
                type="checkbox" 
                checked={showFeatures.groundStation}
                onChange={() => toggleFeature('groundStation')}
              />
              🏢 Ground Station
            </label>
          </div>
        </div>

        {/* Satellite count info */}
        <div className="control-group">
          <h4>📊 Status</h4>
          <div className="status-info">
            {constellationMode ? (
              <p>Constellation: {constellationMode}</p>
            ) : (
              <p>Satellites: {selectedSatellites?.length || 0}</p>
            )}
            <p>Entities: {viewerRef.current?.entities?.values?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 LIVE TRACKING' : '🔴 OFFLINE'}
        </div>
      </div>

      {/* Loading Overlay */}
      {!isViewerReady && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>🚀 Initializing Advanced 3D Ground Station...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteViewer;
