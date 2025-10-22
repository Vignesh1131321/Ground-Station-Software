import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Satellite, Radio, Gauge, Zap, ThermometerSun, Activity, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    color: 'white',
    padding: '20px',
    fontFamily: 'monospace'
  },
  header: {
    marginBottom: '24px'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  statusConnected: {
    background: '#22c55e',
    color: '#000'
  },
  statusDisconnected: {
    background: '#ef4444',
    color: '#fff'
  },
  alertPanel: {
    background: 'rgba(153, 27, 27, 0.3)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px'
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  alertText: {
    fontSize: '14px',
    color: '#fca5a5',
    marginLeft: '28px'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  sidebar: {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    borderRadius: '12px',
    padding: '20px'
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '8px'
  },
  select: {
    width: '100%',
    background: '#334155',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: 'white',
    fontSize: '14px'
  },
  satelliteList: {
    maxHeight: '250px',
    overflowY: 'auto'
  },
  satelliteItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    background: 'rgba(51, 65, 85, 0.5)',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  satelliteName: {
    fontSize: '11px',
    color: '#d1d5db'
  },
  infoSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(34, 211, 238, 0.3)'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '12px'
  },
  mainContent: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  card: {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(10px)',
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px',
    transition: 'transform 0.3s'
  },
  cardGood: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
    background: 'rgba(34, 197, 94, 0.1)'
  },
  cardWarning: {
    borderColor: 'rgba(234, 179, 8, 0.5)',
    background: 'rgba(234, 179, 8, 0.1)'
  },
  cardCritical: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    background: 'rgba(239, 68, 68, 0.1)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  cardTitle: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  cardValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  cardSubtitle: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px'
  },
  chartCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    borderRadius: '12px',
    padding: '20px'
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: '16px'
  },
  emptyState: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    borderRadius: '12px',
    padding: '48px',
    textAlign: 'center'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
  },
  spinner: {
    width: '64px',
    height: '64px',
    border: '4px solid rgba(34, 211, 238, 0.3)',
    borderTop: '4px solid #22d3ee',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

const GroundStationDashboard = () => {
  const [satelliteGroups, setSatelliteGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('space_stations');
  const [selectedSatellites, setSelectedSatellites] = useState(['ISS (ZARYA)']);
  const [telemetryData, setTelemetryData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchSatelliteGroups();
    const interval = setInterval(() => {
      if (selectedSatellites.length > 0) {
        fetchTelemetryData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedSatellites]);

  const fetchSatelliteGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/satellites/groups`);
      const data = await response.json();
      setSatelliteGroups(data.groups || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching satellite groups:', error);
      setLoading(false);
    }
  };

  const fetchTelemetryData = async () => {
    try {
      const satName = selectedSatellites[0];
      const response = await fetch(`${API_BASE}/satellite/${encodeURIComponent(satName)}/telemetry`);
      const data = await response.json();
      
      setTelemetryData(data);
      setIsConnected(true);
      
      setHistoricalData(prev => {
        const newData = [...prev, {
          time: new Date(data.timestamp).toLocaleTimeString(),
          battery: data.battery_voltage,
          temp: data.temperature_internal,
          cpu: data.cpu_usage
        }];
        return newData.slice(-20);
      });

      checkAlerts(data);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
      setIsConnected(false);
    }
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
      newAlerts.push({ type: 'warning', msg: `Temperature alert: ${data.temperature_internal.toFixed(1)}°C` });
    }
    setAlerts(newAlerts);
  };

  const handleGroupChange = async (groupKey) => {
    setSelectedGroup(groupKey);
    try {
      const response = await fetch(`${API_BASE}/satellites/groups?group=${groupKey}`);
      const data = await response.json();
      if (data.satellites && data.satellites.length > 0) {
        setSelectedSatellites([data.satellites[0]]);
      }
    } catch (error) {
      console.error('Error fetching group satellites:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '16px', color: '#22d3ee', fontFamily: 'monospace' }}>
            Initializing Ground Station...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .satellite-item:hover {
          background: #475569 !important;
        }
      `}</style>

      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.headerTitle}>
            <Satellite size={32} color="#22d3ee" />
            <h1 style={styles.title}>Ground Station Control</h1>
          </div>
          <div style={{...styles.statusBadge, ...(isConnected ? styles.statusConnected : styles.statusDisconnected)}}>
            {isConnected ? '● LIVE' : '● OFFLINE'}
          </div>
        </div>

        {alerts.length > 0 && (
          <div style={styles.alertPanel}>
            <div style={styles.alertHeader}>
              <AlertTriangle size={20} color="#f87171" />
              <span style={{ fontWeight: 'bold', color: '#f87171' }}>Active Alerts</span>
            </div>
            {alerts.map((alert, i) => (
              <div key={i} style={styles.alertText}>{alert.msg}</div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.gridContainer}>
        <div style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>
            <Radio size={20} />
            Satellite Control
          </h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Group</label>
            <select 
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              style={styles.select}
            >
              {Object.entries(satelliteGroups).map(([key, group]) => (
                <option key={key} value={key}>
                  {group.name} ({group.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Satellites</label>
            <div style={styles.satelliteList}>
              {satelliteGroups[selectedGroup]?.satellites?.slice(0, 10).map(sat => (
                <label 
                  key={sat} 
                  className="satellite-item"
                  style={styles.satelliteItem}
                >
                  <input
                    type="checkbox"
                    checked={selectedSatellites.includes(sat)}
                    onChange={() => setSelectedSatellites([sat])}
                    style={{ accentColor: '#22d3ee' }}
                  />
                  <span style={styles.satelliteName}>{sat}</span>
                </label>
              ))}
            </div>
          </div>

          {telemetryData && (
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={{ color: '#9ca3af' }}>System Health:</span>
                <span style={{ fontWeight: 'bold', color: '#22d3ee' }}>
                  {telemetryData.system_health?.toFixed(0)}%
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={{ color: '#9ca3af' }}>Data Rate:</span>
                <span style={{ fontWeight: 'bold', color: '#22d3ee' }}>
                  {telemetryData.data_rate?.toFixed(2)} Mbps
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.mainContent}>
          {telemetryData && (
            <>
              <div style={styles.cardsGrid}>
                <TelemetryCard
                  icon={<Zap size={24} />}
                  title="Battery"
                  value={`${telemetryData.battery_voltage?.toFixed(1)}V`}
                  subtitle={`${telemetryData.battery_current?.toFixed(2)}A`}
                  status={telemetryData.battery_voltage > 27 ? 'good' : telemetryData.battery_voltage > 25 ? 'warning' : 'critical'}
                />
                <TelemetryCard
                  icon={<ThermometerSun size={24} />}
                  title="Temperature"
                  value={`${telemetryData.temperature_internal?.toFixed(1)}°C`}
                  subtitle="Internal"
                  status={telemetryData.temperature_internal > -5 && telemetryData.temperature_internal < 35 ? 'good' : 'warning'}
                />
                <TelemetryCard
                  icon={<Activity size={24} />}
                  title="CPU Usage"
                  value={`${telemetryData.cpu_usage?.toFixed(0)}%`}
                  subtitle={`Mem: ${telemetryData.memory_usage?.toFixed(0)}%`}
                  status={telemetryData.cpu_usage < 80 ? 'good' : 'warning'}
                />
                <TelemetryCard
                  icon={<Gauge size={24} />}
                  title="Signal"
                  value={`${telemetryData.signal_strength?.toFixed(0)} dBm`}
                  subtitle={`${telemetryData.data_rate?.toFixed(1)} Mbps`}
                  status="good"
                />
              </div>

              <div style={styles.chartsGrid}>
                <ChartCard title="Power System">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #22d3ee' }}
                        labelStyle={{ color: '#22d3ee' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="battery" stroke="#22d3ee" name="Battery (V)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Thermal System">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ef4444' }}
                        labelStyle={{ color: '#ef4444' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="temp" stroke="#ef4444" name="Temp (°C)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="System Resources">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={historicalData.slice(-5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #a855f7' }}
                        labelStyle={{ color: '#a855f7' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="cpu" fill="#a855f7" name="CPU %" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Attitude & Control">
                  <div style={{ padding: '16px' }}>
                    <AttitudeIndicator label="Roll" value={telemetryData.attitude_x} />
                    <AttitudeIndicator label="Pitch" value={telemetryData.attitude_y} />
                    <AttitudeIndicator label="Yaw" value={telemetryData.attitude_z} />
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                      <div style={styles.infoRow}>
                        <span>Reaction Wheel:</span>
                        <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>
                          {telemetryData.reaction_wheel_speed?.toFixed(0)} RPM
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span>Fuel Remaining:</span>
                        <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>
                          {telemetryData.thruster_fuel?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>
            </>
          )}

          {!telemetryData && (
            <div style={styles.emptyState}>
              <Satellite size={64} color="#22d3ee" style={{ opacity: 0.5, margin: '0 auto 16px' }} />
              <p style={{ color: '#9ca3af', fontSize: '18px', marginBottom: '8px' }}>No Telemetry Data</p>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Select a satellite to view real-time telemetry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TelemetryCard = ({ icon, title, value, subtitle, status }) => {
  const statusStyle = status === 'good' ? styles.cardGood : 
                      status === 'warning' ? styles.cardWarning : styles.cardCritical;
  
  const textColor = status === 'good' ? '#22c55e' : 
                    status === 'warning' ? '#eab308' : '#ef4444';

  return (
    <div style={{...styles.card, ...statusStyle}}>
      <div style={styles.cardHeader}>
        <div style={{ color: textColor }}>{icon}</div>
        <span style={styles.cardTitle}>{title}</span>
      </div>
      <div style={{...styles.cardValue, color: textColor}}>{value}</div>
      <div style={styles.cardSubtitle}>{subtitle}</div>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div style={styles.chartCard}>
    <h3 style={styles.chartTitle}>{title}</h3>
    {children}
  </div>
);

const AttitudeIndicator = ({ label, value }) => {
  const normalizedValue = Math.max(-10, Math.min(10, value || 0));
  const percentage = ((normalizedValue + 10) / 20) * 100;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af', width: '48px' }}>{label}</span>
      <div style={{ flex: 1, background: '#334155', borderRadius: '9999px', height: '8px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '2px', height: '12px', background: '#6b7280' }}></div>
        </div>
        <div 
          style={{ 
            background: '#22d3ee', 
            height: '100%', 
            borderRadius: '9999px',
            transition: 'width 0.3s',
            width: `${percentage}%`
          }}
        />
      </div>
      <span style={{ fontSize: '12px', color: '#22d3ee', fontFamily: 'monospace', width: '64px', textAlign: 'right' }}>
        {value?.toFixed(2)}°
      </span>
    </div>
  );
};

export default GroundStationDashboard;