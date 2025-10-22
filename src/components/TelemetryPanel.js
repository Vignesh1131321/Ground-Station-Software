import React from 'react';
import './TelemetryPanel.css';

const TelemetryPanel = ({ satelliteData, telemetryData, isConnected }) => {
  if (!satelliteData) {
    return (
      <div className="telemetry-panel loading">
        <h3>🛰️ Ground Station Control</h3>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Establishing satellite link...</p>
        </div>
      </div>
    );
  }

  const currentTelemetry = {
    battery: telemetryData.battery[telemetryData.battery.length - 1] || 0,
    temperature: telemetryData.temperature[telemetryData.temperature.length - 1] || 0,
    signalStrength: telemetryData.signalStrength[telemetryData.signalStrength.length - 1] || 0
  };

  const getBatteryStatus = (battery) => {
    if (battery > 80) return 'good';
    if (battery > 60) return 'warning';
    return 'critical';
  };

  const getSignalStatus = (signal) => {
    if (signal > 80) return 'good';
    if (signal > 60) return 'warning';
    return 'critical';
  };

  return (
    <div className="telemetry-panel">
      <div className="panel-header">
        <h3>🛰️ Ground Station Control</h3>
        <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </div>
      </div>

      <div className="telemetry-section">
        <h4>📍 Position Data</h4>
        <div className="data-grid">
          <div className="data-item">
            <label>Latitude:</label>
            <span>{satelliteData.latitude?.toFixed(4)}°</span>
          </div>
          <div className="data-item">
            <label>Longitude:</label>
            <span>{satelliteData.longitude?.toFixed(4)}°</span>
          </div>
          <div className="data-item">
            <label>Altitude:</label>
            <span>{satelliteData.altitude?.toFixed(2)} km</span>
          </div>
        </div>
      </div>

      <div className="telemetry-section">
        <h4>⚡ System Status</h4>
        <div className="data-grid">
          <div className="data-item">
            <label>Battery:</label>
            <span className={`status-${getBatteryStatus(currentTelemetry.battery)}`}>
              <div className={`status-dot status-${getBatteryStatus(currentTelemetry.battery)}`}></div>
              {currentTelemetry.battery?.toFixed(1)}%
            </span>
          </div>
          <div className="data-item">
            <label>Temperature:</label>
            <span>{currentTelemetry.temperature?.toFixed(1)}°C</span>
          </div>
          <div className="data-item">
            <label>Signal:</label>
            <span className={`status-${getSignalStatus(currentTelemetry.signalStrength)}`}>
              <div className={`status-dot status-${getSignalStatus(currentTelemetry.signalStrength)}`}></div>
              {currentTelemetry.signalStrength?.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="telemetry-section">
        <h4>🕐 Last Update</h4>
        <div className="timestamp">
          {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
