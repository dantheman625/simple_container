/**
 * Sensor Driver (Integration Layer)
 * ----------------------------------
 * This script simulates the firmware/driver software of a physical
 * temperature sensor attached to an edge device (e.g. a Raspberry Pi
 * reading a DS18B20 sensor over a 1-Wire bus).
 *
 * IMPORTANT: This is intentionally NOT containerized. It represents
 * software that runs natively on the edge device's host OS, with direct
 * access to hardware interfaces (e.g. /sys/bus/w1/devices/.../w1_slave
 * or a serial port such as /dev/ttyUSB0). In a real deployment this
 * would be installed as a systemd service or run via a startup script
 * on the device itself.
 *
 * It exposes the latest sensor reading on a local-only HTTP endpoint
 * so that containerized services (e.g. api-app) can retrieve the value
 * without needing direct hardware access themselves. This keeps the
 * hardware-coupled code outside the container boundary, in line with
 * the Asset/Integration layer separation described in the thesis
 * (Containerization Scope).
 *
 * Run with: node driver.js
 * Default port: 5050 (only intended to be reachable from localhost /
 * the Docker host, not exposed to the outside world).
 */

const http = require('http');

const PORT = process.env.SENSOR_DRIVER_PORT || 5050;

// Simulated sensor state: a temperature value that drifts slowly,
// as a real ambient temperature sensor would.
let currentTemperature = 21.0; // start at a plausible room temperature (°C)

function readPhysicalSensor() {
  // Simulate a small random walk to mimic real sensor noise/drift.
  const delta = (Math.random() - 0.5) * 0.4; // +/- 0.2 °C per tick
  currentTemperature += delta;

  // Keep the value within a realistic indoor range.
  if (currentTemperature < 15) currentTemperature = 15;
  if (currentTemperature > 30) currentTemperature = 30;

  return {
    value: Math.round(currentTemperature * 100) / 100,
    unit: 'celsius',
    sensorId: 'temp-sensor-01',
    readAt: new Date().toISOString(),
  };
}

// Periodically "sample" the sensor, like a real polling driver would.
setInterval(readPhysicalSensor, 1000);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/reading' && req.method === 'GET') {
    const reading = readPhysicalSensor();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reading));
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`Sensor driver running natively on port ${PORT} (not containerized)`);
  console.log(`Reading available at http://localhost:${PORT}/reading`);
});
