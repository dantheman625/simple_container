const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;
const MONGO_URI = 'mongodb://mongo:27017/randomdb';

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
  const randomNumber = Math.floor(Math.random() * 100) + 1; // Random number between 1 and 100
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
