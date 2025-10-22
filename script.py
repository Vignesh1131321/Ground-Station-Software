from sgp4.api import Satrec, jday
from datetime import datetime

# Parse TLE data
line1 = '1 25544U 98067A 21122.75616700 .00027980 00000-0 51432-3 0 9994'
line2 = '2 25544 51.6442 207.4449 0002769 310.1189 193.6568 15.48993527281553'

satellite = Satrec.twoline2rv(line1, line2)

# Get current position
now = datetime.utcnow()
jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)
e, r, v = satellite.sgp4(jd, fr)

print(f"Position: {r}")  # In km from Earth center
