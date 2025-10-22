import React, { useState, useEffect } from 'react';
import { Satellite, Radio, Activity, Zap, ThermometerSun, AlertTriangle, Globe } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const GroundStationDashboard = () => {
  const [satelliteGroups, setSatelliteGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('space_stations');
  const [selectedSatellite, setSelectedSatellite] = useState('ISS (ZARYA)');
  const [telemetryData, setTelemetryData] = useState(null);
  const [satellitePosition, setSatellitePosition] = useState(null);
  const [orbitPath, setOrbitPath] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [cesiumLoaded, setCesiumLoaded] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [viewMode, setViewMode] = useState('2d');

  const cesiumContainerRef = React.useRef(null);
  const viewerRef = React.useRef(null);
  const satelliteEntityRef = React.useRef(null);

  // Check if Cesium is loaded
  useEffect(() => {
    if (window.Cesium) {
      setCesiumLoaded(true);
    } else {
      console.warn('Cesium not loaded. Running in 2D mode.');
      // Try to load Cesium dynamically
      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Cesium.js';
      script.async = true;
      script.onload = () => {
        setCesiumLoaded(true);
        if (viewMode === '3d') {
          initializeCesium();
        }
      };
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Widgets/widgets.css';
      
      document.head.appendChild(link);
      document.body.appendChild(script);
    }
  }, []);

  // Initialize Cesium when switching to 3D mode
  useEffect(() => {
    if (viewMode === '3d' && cesiumLoaded && !viewerRef.current) {
      initializeCesium();
    }
    
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [viewMode, cesiumLoaded]);

  useEffect(() => {
    fetchSatelliteGroups();
  }, []);

  useEffect(() => {
    if (selectedSatellite) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSatellite]);

  const initializeCesium = async () => {
    if (!cesiumContainerRef.current || !window.Cesium) return;

    try {
      window.Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5N2UyMjcwOS00MDY1LTQxYjEtYjZjMy00YTU0ZTg1YmJjMGIiLCJpZCI6ODAzMDYsImlhdCI6MTY0Mjc0ODI2MX0.dkwAL1CcljUV7NA7fDbhXXnmyZQU_c-G5zRx8PtEcxE';

      viewerRef.current = new window.Cesium.Viewer(cesiumContainerRef.current, {
        animation: false,
        timeline: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        infoBox: true,
        selectionIndicator: true,
        shadows: false,
        shouldAnimate: true
      });

      viewerRef.current.scene.globe.enableLighting = true;
      viewerRef.current.camera.setView({
        destination: window.Cesium.Cartesian3.fromDegrees(0, 0, 20000000)
      });

      // Update visualization if data already exists
      if (satellitePosition && orbitPath.length > 0) {
        updateSatelliteVisualization(satellitePosition, orbitPath);
      }
    } catch (error) {
      console.error('Error initializing Cesium:', error);
    }
  };

  const fetchSatelliteGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/satellites/groups`);
      const data = await response.json();
      setSatelliteGroups(data.groups || {});
    } catch (error) {
      console.error('Error fetching satellite groups:', error);
    }
  };

  const fetchData = async () => {
    try {
      const posResponse = await fetch(`${API_BASE}/satellite/${encodeURIComponent(selectedSatellite)}/position`);
      const posData = await posResponse.json();
      setSatellitePosition(posData);

      const telResponse = await fetch(`${API_BASE}/satellite/${encodeURIComponent(selectedSatellite)}/telemetry`);
      const telData = await telResponse.json();
      setTelemetryData(telData);

      const orbitResponse = await fetch(`${API_BASE}/satellite/${encodeURIComponent(selectedSatellite)}/orbit`);
      const orbitData = await orbitResponse.json();
      setOrbitPath(orbitData);

      setIsConnected(true);
      checkAlerts(telData);
      
      if (viewMode === '3d' && viewerRef.current && posData.latitude && posData.longitude) {
        updateSatelliteVisualization(posData, orbitData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsConnected(false);
    }
  };

  const updateSatelliteVisualization = (position, orbit) => {
    if (!viewerRef.current || !window.Cesium) return;

    viewerRef.current.entities.removeAll();

    const satellitePos = window.Cesium.Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.altitude * 1000
    );

    satelliteEntityRef.current = viewerRef.current.entities.add({
      name: position.name,
      position: satellitePos,
      point: {
        pixelSize: 10,
        color: window.Cesium.Color.CYAN,
        outlineColor: window.Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: position.name,
        font: '14pt Arial',
        pixelOffset: new window.Cesium.Cartesian2(0, -20),
        fillColor: window.Cesium.Color.WHITE,
        outlineColor: window.Cesium.Color.BLACK,
        outlineWidth: 2,
        style: window.Cesium.LabelStyle.FILL_AND_OUTLINE
      }
    });

    if (orbit && orbit.length > 0) {
      const positions = orbit.map(point => 
        window.Cesium.Cartesian3.fromDegrees(
          point.longitude,
          point.latitude,
          point.altitude * 1000
        )
      );

      viewerRef.current.entities.add({
        name: 'Orbit Path',
        polyline: {
          positions: positions,
          width: 2,
          material: window.Cesium.Color.CYAN.withAlpha(0.6)
        }
      });
    }

    const groundStation = window.Cesium.Cartesian3.fromDegrees(77.5946, 12.9716, 0);
    viewerRef.current.entities.add({
      name: 'Ground Station',
      position: groundStation,
      point: {
        pixelSize: 12,
        color: window.Cesium.Color.YELLOW,
        outlineColor: window.Cesium.Color.BLACK,
        outlineWidth: 2
      },
      label: {
        text: '🏢 Ground Station',
        font: '12pt Arial',
        pixelOffset: new window.Cesium.Cartesian2(0, -20),
        fillColor: window.Cesium.Color.YELLOW,
        style: window.Cesium.LabelStyle.FILL
      }
    });

    viewerRef.current.entities.add({
      name: 'Link',
      polyline: {
        positions: [satellitePos, groundStation],
        width: 2,
        material: new window.Cesium.PolylineDashMaterialProperty({
          color: window.Cesium.Color.YELLOW.withAlpha(0.5),
          dashLength: 16
        })
      }
    });

    viewerRef.current.zoomTo(satelliteEntityRef.current);
  };

  const checkAlerts = (data) => {
    const newAlerts = [];
    if (data.battery_voltage < 25) {
      newAlerts.push({ type: 'critical', msg: `Low battery: ${data.battery_voltage.toFixed(1)}V` });
    }
    if (data.cpu_usage > 85) {
      newAlerts.push({ type: 'warning', msg: `High CPU: ${data.cpu_usage.toFixed(0)}%` });
    }
    if (data.temperature_internal > 35 || data.temperature_internal < -5) {
      newAlerts.push({ type: 'warning', msg: `Temperature: ${data.temperature_internal.toFixed(1)}°C` });
    }
    setAlerts(newAlerts);
  };

  const handleGroupChange = async (groupKey) => {
    setSelectedGroup(groupKey);
    try {
      const response = await fetch(`${API_BASE}/satellites/groups?group=${groupKey}`);
      const data = await response.json();
      if (data.satellites && data.satellites.length > 0) {
        setSelectedSatellite(data.satellites[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', fontFamily: 'monospace', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <div style={{ width: '350px', background: 'rgba(30, 41, 59, 0.95)', borderRight: '1px solid #22d3ee', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(34, 211, 238, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Satellite size={32} color="#22d3ee" />
            <h1 style={{ margin: 0, fontSize: '20px', color: '#22d3ee' }}>Ground Station</h1>
          </div>
          <div style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: isConnected ? '#22c55e' : '#ef4444', color: isConnected ? '#000' : '#fff', textAlign: 'center' }}>
            {isConnected ? '● LIVE' : '● OFFLINE'}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(34, 211, 238, 0.3)' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>View Mode</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('2d')}
              style={{ flex: 1, padding: '8px', background: viewMode === '2d' ? '#22d3ee' : 'rgba(34, 211, 238, 0.2)', border: '1px solid #22d3ee', color: viewMode === '2d' ? '#000' : '#22d3ee', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              📊 2D Map
            </button>
            <button
              onClick={() => setViewMode('3d')}
              style={{ flex: 1, padding: '8px', background: viewMode === '3d' ? '#22d3ee' : 'rgba(34, 211, 238, 0.2)', border: '1px solid #22d3ee', color: viewMode === '3d' ? '#000' : '#22d3ee', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              🌍 3D Globe
            </button>
          </div>
          {viewMode === '3d' && !cesiumLoaded && (
            <p style={{ fontSize: '10px', color: '#eab308', marginTop: '8px' }}>⚠️ Loading Cesium library...</p>
          )}
        </div>

        {alerts.length > 0 && (
          <div style={{ margin: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#f87171' }}>
              <AlertTriangle size={16} />
              <strong>Alerts</strong>
            </div>
            {alerts.map((alert, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#fca5a5', marginLeft: '24px' }}>{alert.msg}</div>
            ))}
          </div>
        )}

        <div style={{ padding: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Group</label>
          <select 
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            style={{ width: '100%', background: '#334155', border: '1px solid #22d3ee', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '14px' }}
          >
            {Object.entries(satelliteGroups).map(([key, group]) => (
              <option key={key} value={key}>{group.name} ({group.count})</option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginTop: '12px', marginBottom: '8px' }}>Satellite</label>
          <select 
            value={selectedSatellite}
            onChange={(e) => setSelectedSatellite(e.target.value)}
            style={{ width: '100%', background: '#334155', border: '1px solid #22d3ee', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '14px' }}
          >
            {satelliteGroups[selectedGroup]?.satellites?.map(sat => (
              <option key={sat} value={sat}>{sat}</option>
            ))}
          </select>
        </div>

        {satellitePosition && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(34, 211, 238, 0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#22d3ee' }}>📍 Position</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Latitude:</span>
                <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{satellitePosition.latitude?.toFixed(4)}°</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Longitude:</span>
                <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{satellitePosition.longitude?.toFixed(4)}°</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Altitude:</span>
                <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{satellitePosition.altitude?.toFixed(2)} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Velocity:</span>
                <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{satellitePosition.velocity?.toFixed(2)} km/s</span>
              </div>
            </div>
          </div>
        )}

        {telemetryData && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(34, 211, 238, 0.3)', flex: 1 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#22d3ee' }}>⚡ Telemetry</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <TelemetryCard
                icon={<Zap size={20} />}
                title="Battery"
                value={`${telemetryData.battery_voltage?.toFixed(1)}V`}
                subtitle={`${telemetryData.battery_current?.toFixed(2)}A`}
                status={telemetryData.battery_voltage > 27 ? 'good' : 'warning'}
              />
              <TelemetryCard
                icon={<ThermometerSun size={20} />}
                title="Temperature"
                value={`${telemetryData.temperature_internal?.toFixed(1)}°C`}
                subtitle="Internal"
                status={telemetryData.temperature_internal > -5 && telemetryData.temperature_internal < 35 ? 'good' : 'warning'}
              />
              <TelemetryCard
                icon={<Activity size={20} />}
                title="CPU"
                value={`${telemetryData.cpu_usage?.toFixed(0)}%`}
                subtitle={`Mem: ${telemetryData.memory_usage?.toFixed(0)}%`}
                status={telemetryData.cpu_usage < 80 ? 'good' : 'warning'}
              />
              <TelemetryCard
                icon={<Radio size={20} />}
                title="Signal"
                value={`${telemetryData.signal_strength?.toFixed(0)} dBm`}
                subtitle={`${telemetryData.data_rate?.toFixed(1)} Mbps`}
                status="good"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {viewMode === '3d' ? (
          <>
            <div 
              ref={cesiumContainerRef}
              style={{ width: '100%', height: '100%', display: cesiumLoaded ? 'block' : 'none' }}
            />
            
            {!cesiumLoaded && (
              <div style={{ textAlign: 'center', color: '#22d3ee' }}>
                <Globe size={64} style={{ margin: '0 auto 20px', animation: 'spin 2s linear infinite' }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>Loading 3D Earth Viewer...</p>
                <p style={{ fontSize: '12px', opacity: 0.7 }}>Fetching Cesium library</p>
              </div>
            )}

            {cesiumLoaded && satelliteEntityRef.current && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(30, 41, 59, 0.95)', border: '1px solid #22d3ee', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#22d3ee' }}>📹 Camera</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => viewerRef.current?.zoomTo(satelliteEntityRef.current)}
                    style={{ background: 'rgba(34, 211, 238, 0.2)', border: '1px solid #22d3ee', color: '#22d3ee', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🎯 Track Satellite
                  </button>
                  <button
                    onClick={() => viewerRef.current?.camera.setView({ destination: window.Cesium.Cartesian3.fromDegrees(0, 0, 20000000) })}
                    style={{ background: 'rgba(34, 211, 238, 0.2)', border: '1px solid #22d3ee', color: '#22d3ee', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🌍 Global View
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <MapView satellitePosition={satellitePosition} orbitPath={orbitPath} />
        )}

        {satellitePosition && (
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(30, 41, 59, 0.95)', border: '1px solid #22d3ee', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#22d3ee', maxWidth: '300px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>🛰️ {satellitePosition.name}</div>
            <div>Last Update: {new Date().toLocaleTimeString()}</div>
            <div>System Health: {telemetryData?.system_health?.toFixed(0)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

const MapView = ({ satellitePosition, orbitPath }) => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current || !satellitePosition) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 180; i += 30) {
      const y = (i / 180) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 360; i += 30) {
      const x = (i / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw orbit path
    if (orbitPath && orbitPath.length > 0) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      orbitPath.forEach((point, i) => {
        const x = ((point.longitude + 180) / 360) * width;
        const y = ((90 - point.latitude) / 180) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw satellite
    const satX = ((satellitePosition.longitude + 180) / 360) * width;
    const satY = ((90 - satellitePosition.latitude) / 180) * height;
    
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(satX, satY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw ground station
    const gsLon = 77.5946;
    const gsLat = 12.9716;
    const gsX = ((gsLon + 180) / 360) * width;
    const gsY = ((90 - gsLat) / 180) * height;
    
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(gsX, gsY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw connection line
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(satX, satY);
    ctx.lineTo(gsX, gsY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = '#22d3ee';
    ctx.font = '12px monospace';
    ctx.fillText('🛰️', satX + 12, satY - 12);
    
    ctx.fillStyle = '#eab308';
    ctx.fillText('🏢', gsX + 10, gsY - 10);

  }, [satellitePosition, orbitPath]);

  return (
    <canvas 
      ref={canvasRef} 
      width={1200} 
      height={600}
      style={{ maxWidth: '100%', maxHeight: '100%', border: '1px solid #22d3ee', borderRadius: '8px' }}
    />
  );
};

const TelemetryCard = ({ icon, title, value, subtitle, status }) => {
  const statusColors = {
    good: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e' },
    warning: { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', text: '#eab308' },
    critical: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' }
  };

  const colors = statusColors[status];

  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ color: colors.text }}>{icon}</div>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{title}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{subtitle}</div>
    </div>
  );
};

export default GroundStationDashboard;