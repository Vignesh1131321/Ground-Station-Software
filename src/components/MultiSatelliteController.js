import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MultiSatelliteController.css';

const MultiSatelliteController = ({ onSatelliteSelect, onConstellationSelect }) => {
  const [satelliteGroups, setSatelliteGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('space_stations');
  const [selectedSatellites, setSelectedSatellites] = useState(['ISS (ZARYA)']);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchSatelliteGroups();
  }, []);

  const fetchSatelliteGroups = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/satellites/groups');
      setSatelliteGroups(response.data.groups);
      setLastUpdate(response.data.last_update);
    } catch (error) {
      console.error('Error fetching satellite groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupChange = async (groupKey) => {
    setSelectedGroup(groupKey);
    setIsLoading(true);
    
    try {
      // Fetch detailed satellite list for selected group
      const response = await axios.get(`http://localhost:5000/api/satellites/groups?group=${groupKey}`);
      
      setSatelliteGroups(prev => ({
        ...prev,
        [groupKey]: {
          ...prev[groupKey],
          satellites: response.data.satellites
        }
      }));
      
      // Auto-select first satellite in group
      if (response.data.satellites.length > 0) {
        const firstSat = response.data.satellites[0];
        setSelectedSatellites([firstSat]);
        onSatelliteSelect(firstSat);
      }
      
    } catch (error) {
      console.error('Error fetching group satellites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSatelliteToggle = (satelliteName) => {
    setSelectedSatellites(prev => {
      const isSelected = prev.includes(satelliteName);
      const newSelection = isSelected 
        ? prev.filter(name => name !== satelliteName)
        : [...prev, satelliteName];
      
      // Notify parent component
      onSatelliteSelect(newSelection);
      return newSelection;
    });
  };

  const handleConstellationView = async () => {
    setIsLoading(true);
    try {
      onConstellationSelect(selectedGroup);
    } catch (error) {
      console.error('Error loading constellation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTLEData = async () => {
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/tle/update', {
        group: selectedGroup,
        force: true
      });
      
      // Refresh satellite groups after update
      await fetchSatelliteGroups();
      
    } catch (error) {
      console.error('Error updating TLE data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="multi-satellite-controller">
      <div className="controller-header">
        <h3>🛰️ Satellite Control Center</h3>
        <div className="update-info">
          <span>Last TLE Update: {formatLastUpdate(lastUpdate)}</span>
          <button 
            className="update-button"
            onClick={updateTLEData}
            disabled={isLoading}
          >
            {isLoading ? '🔄' : '📡'} Update TLE
          </button>
        </div>
      </div>

      {/* Satellite Group Selector */}
      <div className="group-selector">
        <label>Satellite Group:</label>
        <select 
          value={selectedGroup} 
          onChange={(e) => handleGroupChange(e.target.value)}
          disabled={isLoading}
        >
          {Object.entries(satelliteGroups).map(([key, group]) => (
            <option key={key} value={key}>
              {group.name} ({group.count} sats)
            </option>
          ))}
        </select>
      </div>

      {/* Constellation Quick Actions */}
      <div className="constellation-actions">
        <button 
          className="constellation-button"
          onClick={handleConstellationView}
          disabled={isLoading || !selectedGroup}
        >
          🌌 View Entire Constellation
        </button>
        
        <div className="quick-groups">
          {['space_stations', 'starlink', 'galileo', 'gps'].map(group => (
            <button
              key={group}
              className={`quick-group ${selectedGroup === group ? 'active' : ''}`}
              onClick={() => handleGroupChange(group)}
              disabled={isLoading}
            >
              {satelliteGroups[group]?.name?.split(' ')[0] || group.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Individual Satellite Selector */}
      <div className="satellite-selector">
        <label>Individual Satellites:</label>
        <div className="satellite-list">
          {satelliteGroups[selectedGroup]?.satellites?.slice(0, 20).map(satellite => (
            <div key={satellite} className="satellite-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedSatellites.includes(satellite)}
                  onChange={() => handleSatelliteToggle(satellite)}
                />
                <span className="satellite-name">{satellite}</span>
              </label>
            </div>
          ))}
        </div>
        
        {satelliteGroups[selectedGroup]?.count > 20 && (
          <div className="more-satellites">
            + {satelliteGroups[selectedGroup].count - 20} more satellites available
          </div>
        )}
      </div>

      {/* Selected Satellites Summary */}
      {selectedSatellites.length > 0 && (
        <div className="selection-summary">
          <h4>📡 Tracking ({selectedSatellites.length}):</h4>
          <div className="selected-list">
            {selectedSatellites.map(sat => (
              <span key={sat} className="selected-satellite">
                {sat}
              </span>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading satellite data...</span>
        </div>
      )}
    </div>
  );
};

export default MultiSatelliteController;
