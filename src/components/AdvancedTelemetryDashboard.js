import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './AdvancedTelemetryDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdvancedTelemetryDashboard = ({ satelliteData, isConnected }) => {
  const [telemetryData, setTelemetryData] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [alerts, setAlerts] = useState([]);
  const updateIntervalRef = useRef(null);

  // Real-time data buffers for streaming charts [web:135]
  const [realTimeBuffers, setRealTimeBuffers] = useState({
    power: { labels: [], datasets: [{ data: [] }] },
    thermal: { labels: [], datasets: [{ data: [] }] },
    attitude: { labels: [], datasets: [{ data: [] }] },
    communication: { labels: [], datasets: [{ data: [] }] }
  });

  useEffect(() => {
    if (isConnected) {
      fetchTelemetryData();
      fetchHistoricalData();
      
      // Set up real-time updates [web:137]
      updateIntervalRef.current = setInterval(() => {
        fetchTelemetryData();
      }, 2000); // Update every 2 seconds for real-time feel
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isConnected, selectedTimeRange]);

  const fetchTelemetryData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/satellite/ISS/telemetry');
      const newTelemetry = response.data;
      
      setTelemetryData(newTelemetry);
      updateRealTimeCharts(newTelemetry);
      checkAlerts(newTelemetry);
      
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const hours = selectedTimeRange === '1h' ? 1 : selectedTimeRange === '6h' ? 6 : 24;
      const response = await axios.get(
        `http://localhost:5000/api/satellite/ISS/telemetry/historical?hours=${hours}`
      );
      
      const data = response.data;
      setHistoricalData(processHistoricalData(data));
      
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const processHistoricalData = (data) => {
    const labels = data.map(point => new Date(point.timestamp).toLocaleTimeString());
    
    return {
      power: {
        labels,
        datasets: [
          {
            label: 'Battery Voltage (V)',
            data: data.map(point => point.battery_voltage),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Solar Voltage (V)',
            data: data.map(point => point.solar_voltage),
            borderColor: 'rgb(255, 206, 84)',
            backgroundColor: 'rgba(255, 206, 84, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      thermal: {
        labels,
        datasets: [
          {
            label: 'Internal Temp (°C)',
            data: data.map(point => point.temperature_internal),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'External Temp (°C)',
            data: data.map(point => point.temperature_external),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      attitude: {
        labels,
        datasets: [
          {
            label: 'Roll (°)',
            data: data.map(point => point.attitude_x),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.2
          },
          {
            label: 'Pitch (°)',
            data: data.map(point => point.attitude_y),
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.2
          },
          {
            label: 'Yaw (°)',
            data: data.map(point => point.attitude_z),
            borderColor: 'rgb(255, 206, 84)',
            tension: 0.2
          }
        ]
      },
      systems: {
        labels: ['CPU', 'Memory', 'Disk'],
        datasets: [{
          data: [
            data[data.length - 1]?.cpu_usage || 0,
            data[data.length - 1]?.memory_usage || 0,
            data[data.length - 1]?.disk_usage || 0
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 84, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 84, 1)'
          ],
          borderWidth: 2
        }]
      }
    };
  };

  const updateRealTimeCharts = (newTelemetry) => {
    const now = new Date().toLocaleTimeString();
    const maxPoints = 50; // Keep last 50 data points for smooth streaming
    
    setRealTimeBuffers(prev => {
      const updated = { ...prev };
      
      // Update power chart
      updated.power.labels.push(now);
      updated.power.datasets[0].data.push(newTelemetry.battery_voltage);
      
      // Keep only recent data points [web:135]
      if (updated.power.labels.length > maxPoints) {
        updated.power.labels.shift();
        updated.power.datasets[0].data.shift();
      }
      
      return updated;
    });
  };

  const checkAlerts = (telemetry) => {
    const newAlerts = [];
    const now = new Date();
    
    // Battery voltage alert
    if (telemetry.battery_voltage < 25.0) {
      newAlerts.push({
        id: `battery_${now.getTime()}`,
        type: 'critical',
        message: `Battery voltage critically low: ${telemetry.battery_voltage.toFixed(2)}V`,
        timestamp: now.toLocaleTimeString()
      });
    }
    
    // Temperature alert
    if (telemetry.temperature_internal > 40 || telemetry.temperature_internal < -10) {
      newAlerts.push({
        id: `temp_${now.getTime()}`,
        type: 'warning',
        message: `Internal temperature out of range: ${telemetry.temperature_internal.toFixed(1)}°C`,
        timestamp: now.toLocaleTimeString()
      });
    }
    
    // CPU usage alert
    if (telemetry.cpu_usage > 90) {
      newAlerts.push({
        id: `cpu_${now.getTime()}`,
        type: 'warning',
        message: `High CPU usage: ${telemetry.cpu_usage.toFixed(1)}%`,
        timestamp: now.toLocaleTimeString()
      });
    }
    
    // System health alert
    if (telemetry.system_health < 70) {
      newAlerts.push({
        id: `health_${now.getTime()}`,
        type: 'warning',
        message: `System health degraded: ${telemetry.system_health.toFixed(1)}%`,
        timestamp: now.toLocaleTimeString()
      });
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 10)]); // Keep last 10 alerts
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#00ff88',
          font: { family: 'Consolas', size: 11 }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#00ff88', maxTicksLimit: 10 },
        grid: { color: 'rgba(0, 255, 136, 0.1)' }
      },
      y: {
        ticks: { color: '#00ff88' },
        grid: { color: 'rgba(0, 255, 136, 0.1)' }
      }
    },
    elements: { point: { radius: 2 } },
    animation: { duration: 750 } // Smooth animations [web:135]
  };

  if (!telemetryData || !isConnected) {
    return (
      <div className="telemetry-dashboard loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <h3>🛰️ Initializing Telemetry Systems...</h3>
          <p>Establishing connection to satellite telemetry stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-telemetry-dashboard">
      {/* Header with System Status */}
      <div className="telemetry-header">
        <div className="header-left">
          <h2>🛰️ ISS Telemetry Dashboard</h2>
          <div className="system-status">
            <div className={`health-indicator ${getHealthStatus(telemetryData.system_health)}`}>
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ width: `${telemetryData.system_health}%` }}
                ></div>
              </div>
              <span>System Health: {telemetryData.system_health.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value)}
            >
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="24h">24 Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="alerts-panel">
          <h4>🚨 Active Alerts</h4>
          <div className="alerts-list">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <span className="alert-time">{alert.timestamp}</span>
                <span className="alert-message">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="charts-grid">
        {/* Power System Chart */}
        <div className="chart-container">
          <h3>⚡ Power System</h3>
          <div className="chart-wrapper">
            <Line data={historicalData.power || { labels: [], datasets: [] }} options={chartOptions} />
          </div>
          <div className="current-values">
            <div className="value-item">
              <span>Battery:</span>
              <span className={getBatteryStatus(telemetryData.battery_voltage)}>
                {telemetryData.battery_voltage.toFixed(2)}V
              </span>
            </div>
            <div className="value-item">
              <span>Solar:</span>
              <span>{telemetryData.solar_voltage.toFixed(2)}V</span>
            </div>
            <div className="value-item">
              <span>Power Balance:</span>
              <span className={telemetryData.power_balance > 0 ? 'positive' : 'negative'}>
                {telemetryData.power_balance.toFixed(1)}W
              </span>
            </div>
          </div>
        </div>

        {/* Thermal System Chart */}
        <div className="chart-container">
          <h3>🌡️ Thermal System</h3>
          <div className="chart-wrapper">
            <Line data={historicalData.thermal || { labels: [], datasets: [] }} options={chartOptions} />
          </div>
          <div className="current-values">
            <div className="value-item">
              <span>Internal:</span>
              <span className={getTempStatus(telemetryData.temperature_internal)}>
                {telemetryData.temperature_internal.toFixed(1)}°C
              </span>
            </div>
            <div className="value-item">
              <span>External:</span>
              <span>{telemetryData.temperature_external.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* Attitude Control Chart */}
        <div className="chart-container">
          <h3>🎯 Attitude Control</h3>
          <div className="chart-wrapper">
            <Line data={historicalData.attitude || { labels: [], datasets: [] }} options={chartOptions} />
          </div>
          <div className="current-values">
            <div className="value-item">
              <span>Roll:</span>
              <span>{telemetryData.attitude_x.toFixed(2)}°</span>
            </div>
            <div className="value-item">
              <span>Pitch:</span>
              <span>{telemetryData.attitude_y.toFixed(2)}°</span>
            </div>
            <div className="value-item">
              <span>Yaw:</span>
              <span>{telemetryData.attitude_z.toFixed(2)}°</span>
            </div>
          </div>
        </div>

        {/* System Resources Chart */}
        <div className="chart-container">
          <h3>💻 System Resources</h3>
          <div className="chart-wrapper">
            <Doughnut 
              data={historicalData.systems || { labels: [], datasets: [] }} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { position: 'bottom', labels: { color: '#00ff88' } }
                }
              }} 
            />
          </div>
          <div className="current-values">
            <div className="value-item">
              <span>CPU:</span>
              <span className={getUsageStatus(telemetryData.cpu_usage)}>
                {telemetryData.cpu_usage.toFixed(1)}%
              </span>
            </div>
            <div className="value-item">
              <span>Memory:</span>
              <span className={getUsageStatus(telemetryData.memory_usage)}>
                {telemetryData.memory_usage.toFixed(1)}%
              </span>
            </div>
            <div className="value-item">
              <span>Disk:</span>
              <span>{telemetryData.disk_usage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Telemetry Info */}
      <div className="additional-info">
        <div className="info-section">
          <h4>📡 Communication</h4>
          <p>Signal: {telemetryData.signal_strength.toFixed(1)} dBm</p>
          <p>Data Rate: {telemetryData.data_rate.toFixed(2)} Mbps</p>
        </div>
        
        <div className="info-section">
          <h4>🚀 Propulsion</h4>
          <p>Fuel: {telemetryData.thruster_fuel.toFixed(1)}%</p>
          <p>RW Speed: {telemetryData.reaction_wheel_speed.toFixed(0)} RPM</p>
        </div>
        
        <div className="info-section">
          <h4>📊 Data Quality</h4>
          <p>Last Update: {new Date().toLocaleTimeString()}</p>
          <p>Update Rate: 0.5 Hz</p>
        </div>
      </div>
    </div>
  );
};

// Helper functions for status indicators
const getHealthStatus = (health) => {
  if (health > 90) return 'excellent';
  if (health > 75) return 'good';
  if (health > 50) return 'warning';
  return 'critical';
};

const getBatteryStatus = (voltage) => {
  if (voltage > 27) return 'good';
  if (voltage > 25) return 'warning';
  return 'critical';
};

const getTempStatus = (temp) => {
  if (temp >= -5 && temp <= 35) return 'good';
  return 'warning';
};

const getUsageStatus = (usage) => {
  if (usage < 70) return 'good';
  if (usage < 85) return 'warning';
  return 'critical';
};

export default AdvancedTelemetryDashboard;
