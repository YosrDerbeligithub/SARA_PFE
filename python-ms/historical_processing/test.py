from datetime import datetime, timedelta, timezone
import json
import random
from pydantic import BaseModel, Field

class SensorReading(BaseModel):
    """
    Represents a single sensor reading with full metadata.
    Matches the required response structure.
    """
    id: int = Field(..., description="Unique identifier for the reading")
    agentSerial: str = Field(..., description="Sensor module identifier")
    deviceType: str = Field(..., description="Type of sensor device")
    reading: float = Field(..., description="Actual measured value")
    unit: str = Field(..., description="Measurement unit")
    timeOfReading: datetime = Field(..., description="Timestamp of measurement")
    timeOfCreate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),
                                   description="Timestamp of record creation")

    def to_dict(self):
        """Convert the Pydantic model to a dictionary with datetime as ISO strings."""
        return {
            "id": self.id,
            "agentSerial": self.agentSerial,
            "deviceType": self.deviceType,
            "reading": self.reading,
            "unit": self.unit,
            "timeOfReading": self.timeOfReading.isoformat(),
            "timeOfCreate": self.timeOfCreate.isoformat()
        }

def generate_records(start_time: datetime, minutes: int = 180) -> tuple:
    records = []
    total = 0  # Initialize total sum of readings

    for i in range(minutes):
        # Increment time by one minute for each record.
        time_reading = start_time + timedelta(minutes=i)
        reading_value = round(random.uniform(22.0, 25.0), 1)  # Random temperature

        record = SensorReading(
            id=i,
            agentSerial="AGENT001",
            deviceType="TemperatureSensor",
            reading=reading_value,
            unit="C",
            timeOfReading=time_reading
        )

        total += reading_value
        records.append(record.to_dict())  # Convert model to dictionary before storing

    avg = total / minutes  # Calculate average once after the loop
    return records, avg

if __name__ == "__main__":
    # Start at 2022-03-10 12:00:00 UTC
    start_time = datetime(2022, 3, 10, 12, 0, 0, tzinfo=timezone.utc)
    records, avg = generate_records(start_time)

    # Write the data to a JSON file
    with open("sensor_readings.json", "w") as f:
        json.dump(records, f, indent=2)

    print(f"Generated 180 records with an average reading of {avg:.2f}°C")
    print("Saved to sensor_readings.json")


async def fetch_raw_data(sensor_type: str, agent_serial: Optional[str],
                         start: datetime, end: datetime) -> List[Dict[str, Any]]:
    data=[
  {
    "id": 0,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:00:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 1,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:01:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 2,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:02:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 3,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:03:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 4,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:04:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 5,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:05:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 6,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:06:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 7,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:07:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 8,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:08:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 9,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:09:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 10,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:10:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 11,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:11:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 12,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:12:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 13,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:13:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 14,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:14:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 15,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:15:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 16,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:16:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 17,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:17:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 18,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:18:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 19,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:19:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 20,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:20:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 21,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:21:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 22,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:22:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 23,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:23:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 24,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 25.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:24:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 25,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:25:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 26,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:26:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 27,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:27:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 28,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:28:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 29,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:29:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 30,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:30:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 31,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:31:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 32,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:32:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 33,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 25.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:33:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 34,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:34:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 35,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:35:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 36,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:36:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 37,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:37:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 38,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:38:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 39,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:39:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 40,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:40:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 41,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:41:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 42,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:42:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 43,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:43:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 44,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:44:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 45,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:45:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 46,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:46:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 47,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:47:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 48,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:48:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 49,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 25.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:49:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 50,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:50:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 51,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:51:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 52,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:52:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 53,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 25.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:53:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 54,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:54:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 55,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:55:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 56,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:56:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 57,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:57:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 58,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:58:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 59,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T12:59:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 60,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:00:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 61,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:01:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 62,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:02:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 63,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:03:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 64,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:04:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 65,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:05:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 66,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:06:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 67,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:07:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 68,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:08:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 69,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:09:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 70,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:10:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 71,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:11:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 72,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:12:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 73,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:13:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 74,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:14:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 75,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:15:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 76,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:16:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 77,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:17:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 78,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:18:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 79,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:19:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 80,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:20:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 81,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:21:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 82,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:22:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 83,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:23:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 84,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:24:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 85,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:25:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 86,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:26:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 87,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:27:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 88,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:28:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 89,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:29:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 90,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:30:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 91,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:31:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 92,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:32:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 93,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:33:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 94,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:34:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 95,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:35:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 96,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:36:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 97,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:37:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 98,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:38:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 99,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:39:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 100,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:40:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 101,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:41:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 102,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:42:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 103,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:43:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 104,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:44:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 105,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:45:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 106,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:46:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 107,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:47:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 108,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:48:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 109,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:49:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 110,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:50:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 111,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:51:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 112,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:52:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 113,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:53:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 114,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:54:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 115,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:55:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 116,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:56:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 117,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:57:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 118,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:58:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 119,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T13:59:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 120,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:00:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 121,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:01:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 122,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:02:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 123,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:03:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 124,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:04:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 125,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:05:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 126,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:06:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 127,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:07:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 128,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:08:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 129,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:09:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 130,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:10:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 131,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:11:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 132,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:12:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 133,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:13:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 134,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:14:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 135,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:15:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 136,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:16:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 137,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:17:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 138,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:18:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 139,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:19:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 140,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:20:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 141,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:21:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 142,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:22:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 143,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:23:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 144,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:24:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 145,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:25:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 146,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:26:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 147,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:27:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 148,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:28:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 149,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:29:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 150,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:30:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 151,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:31:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 152,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:32:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 153,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:33:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 154,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:34:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 155,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:35:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 156,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:36:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 157,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:37:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 158,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:38:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 159,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:39:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 160,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:40:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 161,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:41:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.850456+00:00"
  },
  {
    "id": 162,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:42:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 163,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.2,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:43:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 164,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:44:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 165,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:45:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 166,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:46:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 167,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:47:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 168,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:48:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 169,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:49:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 170,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.0,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:50:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 171,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.8,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:51:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 172,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.6,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:52:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 173,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:53:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 174,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.1,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:54:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 175,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.4,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:55:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 176,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 24.3,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:56:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 177,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.7,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:57:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 178,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 23.9,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:58:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  },
  {
    "id": 179,
    "agentSerial": "AGENT001",
    "deviceType": "TemperatureSensor",
    "reading": 22.5,
    "unit": "C",
    "timeOfReading": "2022-03-10T14:59:00+00:00",
    "timeOfCreate": "2025-03-21T20:56:42.851456+00:00"
  }
]
    return data
