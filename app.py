from flask import Flask, jsonify, request
from flask_cors import CORS
from sgp4.api import Satrec, jday
from datetime import datetime, timedelta
import requests
import math
import random
import time
import json
import threading
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)
CORS(app)

class AdvancedTelemetrySimulator:
    def __init__(self):
        self.base_values = {
            'battery_voltage': 28.5, 'battery_current': 2.5, 'solar_voltage': 35.0,
            'solar_current': 8.5, 'temperature_internal': 22.0, 'temperature_external': -45.0,
            'cpu_usage': 35.0, 'memory_usage': 65.0, 'disk_usage': 45.0,
            'signal_strength': -85.0, 'data_rate': 2.5, 'attitude_x': 0.0,
            'attitude_y': 0.0, 'attitude_z': 0.0, 'angular_velocity_x': 0.1,
            'angular_velocity_y': 0.1, 'angular_velocity_z': 0.1,
            'thruster_fuel': 85.0, 'reaction_wheel_speed': 3000,
        }
        self.orbital_effects = {
            'eclipse_factor': 1.0, 
            'communication_factor': 1.0, 
            'thermal_factor': 1.0
        }
    
    def simulate_realistic_telemetry(self, satellite_position=None):
        telemetry = {}
        current_time = datetime.utcnow()
        
        if satellite_position:
            self._update_orbital_effects(satellite_position)
        
        eclipse_multiplier = 0.3 if self.orbital_effects['eclipse_factor'] < 0.5 else 1.0
        
        # Battery System
        telemetry['battery_voltage'] = self._add_realistic_noise(
            self.base_values['battery_voltage'] * (0.9 + 0.1 * eclipse_multiplier), 0.5
        )
        telemetry['battery_current'] = self._add_realistic_noise(
            self.base_values['battery_current'] * (2.0 - eclipse_multiplier), 0.2
        )
        
        # Solar System
        telemetry['solar_voltage'] = self._add_realistic_noise(
            self.base_values['solar_voltage'] * self.orbital_effects['eclipse_factor'], 2.0
        )
        telemetry['solar_current'] = self._add_realistic_noise(
            self.base_values['solar_current'] * self.orbital_effects['eclipse_factor'], 1.0
        )
        
        # Thermal System
        telemetry['temperature_internal'] = self._add_realistic_noise(
            self.base_values['temperature_internal'] + 
            (10 * self.orbital_effects['thermal_factor'] - 5), 2.0
        )
        telemetry['temperature_external'] = self._add_realistic_noise(
            self.base_values['temperature_external'] + 
            (30 * self.orbital_effects['thermal_factor'] - 15), 5.0
        )
        
        # Computer Systems
        telemetry['cpu_usage'] = max(10, min(95, self._add_realistic_noise(
            self.base_values['cpu_usage'] + random.uniform(-10, 20), 5.0
        )))
        telemetry['memory_usage'] = max(30, min(90, self._add_realistic_noise(
            self.base_values['memory_usage'] + random.uniform(-5, 10), 3.0
        )))
        telemetry['disk_usage'] = max(20, min(80, 
            self.base_values['disk_usage'] + random.uniform(-1, 2)
        ))
        
        # Communication System
        telemetry['signal_strength'] = self._add_realistic_noise(
            self.base_values['signal_strength'] * self.orbital_effects['communication_factor'], 5.0
        )
        telemetry['data_rate'] = max(0.1, self._add_realistic_noise(
            self.base_values['data_rate'] * self.orbital_effects['communication_factor'], 0.5
        ))
        
        # Attitude Control System
        telemetry['attitude_x'] = self._add_realistic_noise(self.base_values['attitude_x'], 0.5)
        telemetry['attitude_y'] = self._add_realistic_noise(self.base_values['attitude_y'], 0.5)
        telemetry['attitude_z'] = self._add_realistic_noise(self.base_values['attitude_z'], 0.5)
        
        telemetry['angular_velocity_x'] = self._add_realistic_noise(self.base_values['angular_velocity_x'], 0.05)
        telemetry['angular_velocity_y'] = self._add_realistic_noise(self.base_values['angular_velocity_y'], 0.05)
        telemetry['angular_velocity_z'] = self._add_realistic_noise(self.base_values['angular_velocity_z'], 0.05)
        
        # Propulsion System
        telemetry['thruster_fuel'] = max(0, self.base_values['thruster_fuel'] - random.uniform(0, 0.001))
        telemetry['reaction_wheel_speed'] = self._add_realistic_noise(self.base_values['reaction_wheel_speed'], 100)
        
        # Add health indicators
        telemetry['system_health'] = self._calculate_system_health(telemetry)
        telemetry['power_balance'] = (telemetry['solar_voltage'] * telemetry['solar_current']) - (telemetry['battery_voltage'] * telemetry['battery_current'])
        
        # Add timestamp
        telemetry['timestamp'] = current_time.isoformat()
        
        return telemetry
    
    def _update_orbital_effects(self, position):
        altitude = position.get('altitude', 400)
        longitude = position.get('longitude', 0)
        hour_angle = (longitude + 180) % 360
        if 90 < hour_angle < 270:
            self.orbital_effects['eclipse_factor'] = 0.1
            self.orbital_effects['thermal_factor'] = 0.3
        else:
            self.orbital_effects['eclipse_factor'] = 1.0
            self.orbital_effects['thermal_factor'] = 0.8
        self.orbital_effects['communication_factor'] = min(1.0, altitude / 500.0)
    
    def _add_realistic_noise(self, base_value, noise_amplitude):
        white_noise = random.gauss(0, noise_amplitude * 0.3)
        spike_noise = random.uniform(-noise_amplitude, noise_amplitude) if random.random() < 0.05 else 0
        return base_value + white_noise + spike_noise
    
    def _calculate_system_health(self, telemetry):
        health_factors = []
        if telemetry['battery_voltage'] > 26.0: health_factors.append(1.0)
        elif telemetry['battery_voltage'] > 24.0: health_factors.append(0.7)
        else: health_factors.append(0.3)
        if -10 <= telemetry['temperature_internal'] <= 35: health_factors.append(1.0)
        else: health_factors.append(0.5)
        if telemetry['cpu_usage'] < 80: health_factors.append(1.0)
        else: health_factors.append(0.6)
        return sum(health_factors) / len(health_factors) * 100

class MultiSatelliteTracker:
    def __init__(self):
        self.satellites = {}
        self.satellite_groups = {}
        self.telemetry_simulator = AdvancedTelemetrySimulator()
        self.tle_cache = {}
        self.last_tle_update = None
        self.update_lock = threading.Lock()
        
        # Add satellite name aliases for common shortcuts
        self.satellite_aliases = {
            'ISS': ['ISS (ZARYA)', 'INTERNATIONAL SPACE STATION', 'ISS'],
            'HUBBLE': ['HST', 'HUBBLE SPACE TELESCOPE'],
            'TIANGONG': ['TIANGONG', 'CSS (TIANHE)']
        }
        
        # Initialize with predefined satellite groups
        self.initialize_satellite_groups()
        
    def initialize_satellite_groups(self):
        """Initialize satellite group definitions from CelesTrak"""
        self.satellite_groups = {
            'space_stations': {
                'name': 'Space Stations',
                'url': 'https://celestrak.org/NORAD/elements/stations.txt',
                'satellites': {}
            },
            'starlink': {
                'name': 'Starlink Constellation', 
                'url': 'https://celestrak.org/NORAD/elements/starlink.txt',
                'satellites': {}
            },
            'galileo': {
                'name': 'Galileo Navigation',
                'url': 'https://celestrak.org/NORAD/elements/galileo.txt', 
                'satellites': {}
            },
            'gps': {
                'name': 'GPS Constellation',
                'url': 'https://celestrak.org/NORAD/elements/gps-ops.txt',
                'satellites': {}
            },
            'glonass': {
                'name': 'GLONASS Navigation',
                'url': 'https://celestrak.org/NORAD/elements/glonass-ops.txt',
                'satellites': {}
            },
            'weather': {
                'name': 'Weather Satellites',
                'url': 'https://celestrak.org/NORAD/elements/weather.txt',
                'satellites': {}
            },
            'active': {
                'name': 'Active Satellites',
                'url': 'https://celestrak.org/NORAD/elements/active.txt',
                'satellites': {}
            }
        }
    
    def find_satellite_by_name(self, search_name):
        """Find satellite by exact name or alias"""
        search_name = search_name.upper().strip()
        
        # Try exact match first
        for sat_name in self.satellites.keys():
            if sat_name.upper() == search_name:
                return sat_name
        
        # Try alias matching
        for alias, full_names in self.satellite_aliases.items():
            if search_name == alias.upper():
                for full_name in full_names:
                    for sat_name in self.satellites.keys():
                        if full_name.upper() in sat_name.upper():
                            return sat_name
        
        # Try partial matching (contains search term)
        for sat_name in self.satellites.keys():
            if search_name in sat_name.upper():
                return sat_name
        
        return None
    
    def fetch_live_tle_data(self, group_key=None, force_update=False):
        """Fetch live TLE data from CelesTrak"""
        current_time = datetime.utcnow()
        
        # Check if update is needed (every 6 hours unless forced)
        if not force_update and self.last_tle_update:
            time_diff = current_time - self.last_tle_update
            if time_diff.total_seconds() < 6 * 3600:  # 6 hours
                return {"status": "cached", "message": "Using cached TLE data"}
        
        with self.update_lock:
            updated_groups = []
            errors = []
            
            groups_to_update = [group_key] if group_key else self.satellite_groups.keys()
            
            for group in groups_to_update:
                if group not in self.satellite_groups:
                    continue
                    
                try:
                    print(f"🛰️  Fetching TLE data for {self.satellite_groups[group]['name']}...")
                    response = requests.get(self.satellite_groups[group]['url'], timeout=30)
                    
                    if response.status_code == 200:
                        tle_data = response.text.strip().split('\n')
                        parsed_sats = self._parse_tle_data(tle_data)
                        
                        # Update satellite group
                        self.satellite_groups[group]['satellites'] = parsed_sats
                        
                        # Add to main satellites dictionary
                        for sat_name, sat_data in parsed_sats.items():
                            self.satellites[sat_name] = sat_data['satrec']
                        
                        updated_groups.append(group)
                        print(f"✅ Loaded {len(parsed_sats)} satellites from {group}")
                        
                    else:
                        error_msg = f"Failed to fetch {group}: HTTP {response.status_code}"
                        errors.append(error_msg)
                        print(f"❌ {error_msg}")
                        
                except Exception as e:
                    error_msg = f"Error fetching {group}: {str(e)}"
                    errors.append(error_msg)
                    print(f"❌ {error_msg}")
            
            if updated_groups:
                self.last_tle_update = current_time
            
            return {
                "status": "success" if updated_groups else "error",
                "updated_groups": updated_groups,
                "total_satellites": len(self.satellites),
                "errors": errors,
                "timestamp": current_time.isoformat()
            }
    
    def _parse_tle_data(self, tle_lines):
        """Parse TLE data from text format"""
        satellites = {}
        
        # Process TLE data (every 3 lines: name, line1, line2)
        for i in range(0, len(tle_lines), 3):
            if i + 2 < len(tle_lines):
                try:
                    name = tle_lines[i].strip()
                    line1 = tle_lines[i + 1].strip()
                    line2 = tle_lines[i + 2].strip()
                    
                    # Validate TLE lines
                    if line1.startswith('1 ') and line2.startswith('2 '):
                        satrec = Satrec.twoline2rv(line1, line2)
                        
                        # Extract NORAD ID
                        norad_id = int(line1[2:7].strip())
                        
                        satellites[name] = {
                            'satrec': satrec,
                            'tle_line1': line1,
                            'tle_line2': line2,
                            'norad_id': norad_id,
                            'name': name
                        }
                        
                except Exception as e:
                    print(f"⚠️  Failed to parse satellite {name}: {e}")
                    continue
        
        return satellites
    
    def get_satellite_list(self, group=None):
        """Get list of available satellites"""
        if group and group in self.satellite_groups:
            return {
                'group': group,
                'name': self.satellite_groups[group]['name'],
                'satellites': list(self.satellite_groups[group]['satellites'].keys()),
                'count': len(self.satellite_groups[group]['satellites'])
            }
        
        # Return all groups summary
        groups_summary = {}
        for group_key, group_data in self.satellite_groups.items():
            groups_summary[group_key] = {
                'name': group_data['name'],
                'count': len(group_data['satellites']),
                'satellites': list(group_data['satellites'].keys())[:10]  # First 10 for preview
            }
        
        return {
            'total_satellites': len(self.satellites),
            'groups': groups_summary,
            'last_update': self.last_tle_update.isoformat() if self.last_tle_update else None
        }
    
    def get_position(self, satellite_name, timestamp=None):
        """Get satellite position at given time"""
        # Find the actual satellite name
        actual_name = self.find_satellite_by_name(satellite_name)
        if not actual_name:
            print(f"❌ Satellite not found: {satellite_name}")
            print(f"Available satellites: {list(self.satellites.keys())[:5]}...")
            return None
        
        if timestamp is None:
            timestamp = datetime.utcnow()
            
        sat = self.satellites.get(actual_name)
        if not sat:
            return None
            
        jd, fr = jday(timestamp.year, timestamp.month, timestamp.day, 
                     timestamp.hour, timestamp.minute, timestamp.second)
        e, r, v = sat.sgp4(jd, fr)
        
        if e != 0:
            print(f"SGP4 error {e} for {actual_name}")
            return None
            
        # Convert to lat/lon/alt
        lat, lon, alt = self.eci_to_geodetic(r, timestamp)
        
        return {
            'name': actual_name,  # Return actual name found
            'requested_name': satellite_name,  # Original requested name
            'latitude': math.degrees(lat),
            'longitude': math.degrees(lon), 
            'altitude': alt,
            'velocity': math.sqrt(v[0]**2 + v[1]**2 + v[2]**2) if v else 0,
            'timestamp': timestamp.isoformat()
        }
    
    def get_constellation_positions(self, group_name, max_satellites=50):
        """Get positions for entire constellation"""
        if group_name not in self.satellite_groups:
            return None
        
        satellites_data = self.satellite_groups[group_name]['satellites']
        constellation = []
        
        # Limit number of satellites to avoid performance issues
        sat_names = list(satellites_data.keys())[:max_satellites]
        
        current_time = datetime.utcnow()
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_name = {
                executor.submit(self.get_position, name, current_time): name 
                for name in sat_names
            }
            
            for future in future_to_name:
                sat_name = future_to_name[future]
                try:
                    position = future.result(timeout=5)
                    if position:
                        position['name'] = sat_name
                        position['norad_id'] = satellites_data[sat_name]['norad_id']
                        constellation.append(position)
                except Exception as e:
                    print(f"Error getting position for {sat_name}: {e}")
        
        return {
            'group': group_name,
            'group_name': self.satellite_groups[group_name]['name'],
            'satellites': constellation,
            'count': len(constellation),
            'timestamp': current_time.isoformat()
        }
    
    def eci_to_geodetic(self, position, timestamp):
        """Convert ECI coordinates to lat/lon/alt"""
        x, y, z = position
        R_EARTH = 6371.0
        
        altitude = math.sqrt(x*x + y*y + z*z) - R_EARTH
        latitude = math.atan2(z, math.sqrt(x*x + y*y))
        longitude = math.atan2(y, x)
        
        return latitude, longitude, altitude
    
    def get_telemetry(self, satellite_name):
        """Get realistic telemetry data for satellite"""
        position = self.get_position(satellite_name)
        if position:
            return self.telemetry_simulator.simulate_realistic_telemetry(position)
        return None

# Initialize multi-satellite tracker
tracker = MultiSatelliteTracker()

# Load initial satellite data
print("🚀 Initializing Ground Station with live TLE data...")
initial_load = tracker.fetch_live_tle_data('space_stations', force_update=True)
print(f"📡 Initial load result: {initial_load}")

# Find and print ISS name for debugging
iss_names = [name for name in tracker.satellites.keys() if 'ISS' in name.upper()]
if iss_names:
    print(f"🛰️ ISS found as: {iss_names[0]}")
else:
    print("❌ ISS not found in loaded satellites")

# API Routes
@app.route('/')
def home():
    return jsonify({
        'message': 'Advanced Multi-Satellite Ground Station API',
        'total_satellites': len(tracker.satellites),
        'satellite_groups': len(tracker.satellite_groups),
        'last_tle_update': tracker.last_tle_update.isoformat() if tracker.last_tle_update else None,
        'endpoints': {
            'satellite_groups': '/api/satellites/groups',
            'constellation': '/api/constellation/<group_name>',
            'satellite_position': '/api/satellite/<name>/position',
            'satellite_telemetry': '/api/satellite/<name>/telemetry',
            'satellite_orbit': '/api/satellite/<name>/orbit',
            'historical_telemetry': '/api/satellite/<name>/telemetry/historical',
            'update_tle': '/api/tle/update',
            'debug': '/api/debug/satellites',
            'health': '/api/health'
        }
    })

@app.route('/api/satellites/groups')
def get_satellite_groups():
    """Get all satellite groups and their satellites"""
    group = request.args.get('group')
    return jsonify(tracker.get_satellite_list(group))

@app.route('/api/constellation/<group_name>')
def get_constellation(group_name):
    """Get all satellites in a constellation"""
    max_sats = request.args.get('max', 50, type=int)
    constellation = tracker.get_constellation_positions(group_name, max_sats)
    
    if constellation:
        return jsonify(constellation)
    return jsonify({'error': f'Constellation {group_name} not found'}), 404

@app.route('/api/satellite/<satellite_name>/position')
def get_satellite_position(satellite_name):
    """Get current satellite position"""
    position = tracker.get_position(satellite_name)
    if position:
        return jsonify(position)
    
    # Return helpful error with available satellites
    available_sats = list(tracker.satellites.keys())[:10]
    return jsonify({
        'error': f'Satellite {satellite_name} not found',
        'suggestion': 'Try one of these available satellites:',
        'available_satellites': available_sats,
        'total_satellites': len(tracker.satellites)
    }), 404

@app.route('/api/satellite/<satellite_name>/orbit')
def get_satellite_orbit(satellite_name):
    """Get orbital positions for next few hours"""
    positions = []
    start_time = datetime.utcnow()
    
    for i in range(0, 7200, 60):  # Every minute for 2 hours
        timestamp = start_time + timedelta(seconds=i)
        position = tracker.get_position(satellite_name, timestamp)
        if position:
            positions.append(position)
    
    if positions:
        return jsonify(positions)
    return jsonify({'error': f'Could not calculate orbit for {satellite_name}'}), 404

@app.route('/api/satellite/<satellite_name>/telemetry')
def get_satellite_telemetry(satellite_name):
    """Get current satellite telemetry data"""
    try:
        telemetry = tracker.get_telemetry(satellite_name)
        if telemetry:
            return jsonify(telemetry)
        
        available_sats = list(tracker.satellites.keys())[:5]
        return jsonify({
            'error': f'Could not generate telemetry for {satellite_name}',
            'available_satellites': available_sats
        }), 404
    except Exception as e:
        return jsonify({'error': f'Telemetry error: {str(e)}'}), 500

@app.route('/api/satellite/<satellite_name>/telemetry/historical')
def get_satellite_telemetry_historical(satellite_name):
    """Get historical telemetry data for charts"""
    try:
        hours = request.args.get('hours', 2, type=int)
        data_points = []
        
        start_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Generate fewer points for better performance
        step_minutes = max(1, hours * 60 // 120)  # Max 120 data points
        
        for i in range(0, hours * 60, step_minutes):
            timestamp = start_time + timedelta(minutes=i)
            
            # Get position for this time
            position = tracker.get_position(satellite_name, timestamp)
            
            # Generate telemetry for this time
            if position:
                telemetry = tracker.telemetry_simulator.simulate_realistic_telemetry(position)
                telemetry['timestamp'] = timestamp.isoformat()
                data_points.append(telemetry)
        
        return jsonify(data_points)
    except Exception as e:
        return jsonify({'error': f'Historical telemetry error: {str(e)}'}), 500

@app.route('/api/tle/update', methods=['POST', 'GET'])
def update_tle_data():
    """Update TLE data from CelesTrak"""
    group = request.args.get('group') if request.method == 'GET' else request.json.get('group') if request.json else None
    force = request.args.get('force', 'false').lower() == 'true'
    
    result = tracker.fetch_live_tle_data(group, force_update=force)
    return jsonify(result)

@app.route('/api/debug/satellites')
def debug_satellites():
    """Debug endpoint to see all loaded satellites"""
    return jsonify({
        'total_satellites': len(tracker.satellites),
        'satellite_names': list(tracker.satellites.keys()),
        'groups': {
            group: list(data['satellites'].keys())[:5] 
            for group, data in tracker.satellite_groups.items()
        },
        'iss_matches': [name for name in tracker.satellites.keys() if 'ISS' in name.upper()]
    })

@app.route('/api/health')
def health_check():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'satellites_loaded': len(tracker.satellites),
        'groups_loaded': len(tracker.satellite_groups),
        'last_tle_update': tracker.last_tle_update.isoformat() if tracker.last_tle_update else None,
        'version': '2.0.0'
    })

# Background TLE update task
def background_tle_update():
    """Background task to update TLE data periodically"""
    while True:
        try:
            time.sleep(6 * 3600)  # Update every 6 hours
            print("🔄 Running background TLE update...")
            tracker.fetch_live_tle_data(force_update=True)
        except Exception as e:
            print(f"❌ Background TLE update failed: {e}")

# Start background update thread
update_thread = threading.Thread(target=background_tle_update, daemon=True)
update_thread.start()

if __name__ == '__main__':
    print("🚀 Starting Advanced Multi-Satellite Ground Station API...")
    
    # Load space stations first to get ISS
    print("📡 Loading space stations...")
    result = tracker.fetch_live_tle_data('space_stations', force_update=True)
    print(f"Initial load result: {result}")
    
    # Find and print ISS name
    iss_names = [name for name in tracker.satellites.keys() if 'ISS' in name.upper()]
    if iss_names:
        print(f"🛰️ ISS found as: {iss_names[0]}")
    else:
        print("❌ ISS not found in loaded satellites")
    
    print(f"📡 Loaded {len(tracker.satellites)} satellites across {len(tracker.satellite_groups)} groups")
    print("🌐 Server available at: http://localhost:5000")
    print("🐛 Debug endpoint: http://localhost:5000/api/debug/satellites")
    print("📊 Available endpoints:")
    print("   - GET /api/satellites/groups               : List all satellite groups")
    print("   - GET /api/constellation/starlink          : Get Starlink constellation")  
    print("   - GET /api/constellation/galileo           : Get Galileo constellation")
    print("   - GET /api/satellite/ISS/position          : Get ISS position")
    print("   - GET /api/satellite/ISS/telemetry         : Get ISS telemetry")
    print("   - GET /api/satellite/ISS/orbit             : Get ISS orbit")
    print("   - POST/GET /api/tle/update                 : Update live TLE data")
    print("   - GET /api/debug/satellites                : Debug satellite names")
    app.run(debug=True, host='0.0.0.0', port=5000)
