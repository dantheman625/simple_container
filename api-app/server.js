const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/randomdb';

// URL of the native sensor driver running on the Docker host (Integration
// layer, not containerized). Reachable from inside a container via the
// special Docker DNS name "host.docker.internal".
const SENSOR_DRIVER_URL =
  process.env.SENSOR_DRIVER_URL || 'http://host.docker.internal:5050/reading';

/**
 * Retrieves the current value from the physical sensor via the native
 * sensor driver (see /sensor-driver). If the driver is unreachable
 * (e.g. when running this demo without the physical/edge component),
 * falls back to a synthetic random value so the rest of the system
 * remains fully functional on its own.
 */
async function readSensorValue() {
  try {
    const response = await fetch(SENSOR_DRIVER_URL, { signal: AbortSignal.timeout(1000) });
    if (!response.ok) throw new Error(`Sensor driver responded with ${response.status}`);
    const reading = await response.json();
    return Math.round(reading.value);
  } catch (err) {
    console.warn('Sensor driver unreachable, falling back to synthetic value:', err.message);
    return Math.floor(Math.random() * 100) + 1;
  }
}

// MongoDB schema and model
const randomSchema = new mongoose.Schema({
  value: Number,
  requestedAt: { type: Date, default: Date.now }
});
const Random = mongoose.model('Random', randomSchema);

// connect to database
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Random number endpoint
app.get('/random', async (req, res) => {
  const randomNumber = await readSensorValue(); // sourced from the physical temperature sensor via the sensor driver (falls back to a synthetic value if unavailable)
  try {
    const entry = new Random({ value: randomNumber });
    await entry.save();
  } catch (err) {
    console.error('Error saving to database', err);
  }
  res.json({ number: randomNumber });
});

app.listen(PORT, () => {
  console.log(`API app running on port ${PORT}`);
});
