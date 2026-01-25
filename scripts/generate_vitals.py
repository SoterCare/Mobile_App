import json
import random
import math
from datetime import datetime, timedelta

def generate_vitals(days=3, interval_minutes=5):
    """
    Generates synthetic vital signs data for the specified number of past days.
    """
    start_time = datetime(2026, 1, 12, 0, 0, 0)
    end_time = datetime(2026, 1, 14, 23, 59, 59)
    
    current_time = start_time
    logs = []

    print(f"Generating data from {start_time} to {end_time}...")
    
    while current_time <= end_time:
        # Create some realistic variations based on time of day
        hour = current_time.hour
        
        # Lower variance at night (00:00 - 06:00)
        is_sleeping = 0 <= hour < 6
        
        # Heart Rate: Sleep ~60-70, Day ~70-90
        base_hr = 65 if is_sleeping else 80
        heart_rate = int(random.gauss(base_hr, 5))
        
        # SpO2: Generally stable 96-99
        spo2 = int(random.triangular(96, 100, 98))
        
        # Temperature: Sleep drops slightly. Circadian rhythm (sin wave daily)
        # Peak at 4 PM (16:00), Trough at 4 AM (04:00)
        # Map hour to 0-2pi
        day_progress = (hour + current_time.minute / 60) / 24
        temp_variation = -0.5 * math.cos(day_progress * 2 * math.pi) 
        temperature = round(36.8 + temp_variation + random.uniform(-0.1, 0.1), 1)

        log_entry = {
            "id": len(logs)+1,
            "userId": 1,
            "data": {
                "heartRate": heart_rate,
                "spo2": spo2,
                "temperature": temperature,
                "timestamp": int(current_time.timestamp() * 1000)
            },
            "timestamp": current_time.isoformat()
        }
        
        logs.append(log_entry)
        current_time += timedelta(minutes=interval_minutes)

    output = { "logs": logs }
    
    filename = "vitals_history_3days.json"
    with open(filename, "w") as f:
        json.dump(output, f, indent=2)
        
    print(f"Successfully generated {len(logs)} logs to {filename}")
    
    # Send to backend
    send_to_backend(output)

def send_to_backend(data):
    """
    Compresses data with GZIP and sends it to the backend.
    """
    import gzip
    import urllib.request
    import urllib.error
    
    url = "http://localhost:3000/logs/sync"
    print(f"Sending {len(data['logs'])} logs to {url}...")
    
    try:
        # Convert to JSON string and bytes
        json_bytes = json.dumps(data).encode('utf-8')
        
        # Compress
        compressed_data = gzip.compress(json_bytes)
        print(f"Compressed size: {len(compressed_data)} bytes (Original: {len(json_bytes)} bytes)")
        
        # Create request
        req = urllib.request.Request(
            url, 
            data=compressed_data, 
            headers={
                "Content-Type": "application/json",
                "Content-Encoding": "gzip",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwic3ViIjoxLCJlbWFpbCI6InNhbmp1bGFAZ21haWwuY29tIiwibmFtZSI6IlNhbmp1bGEiLCJpYXQiOjE3NjkzNjYwNzMsImV4cCI6MTc3NzE0MjA3M30.6AlGllD-dCdlDrh0EYQG91oCNZf7mhnPFOurg3ztlEc"
            }, 
            method='POST'
        )
        
        # Send
        with urllib.request.urlopen(req) as response:
            result = response.read().decode('utf-8')
            print(f"Response: {result}")
            
    except urllib.error.URLError as e:
        print(f"❌ Connection failed: {e}")
        print("Make sure your backend server is running on localhost:3000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    generate_vitals()
