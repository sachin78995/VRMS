const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const driverRoutes = require('./routes/driverRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : null;
const corsOptions = allowedOrigins?.length ? { origin: allowedOrigins } : {};
app.use(cors(corsOptions));
app.use(express.json());

// Use the MONGO_URI environment variable if provided; default to the requested localhost URL.
// Note: you can append a database name to the URI (e.g. mongodb://localhost:27017/vrms)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vrms';

mongoose.connect(MONGO_URI)
  .then(() => console.log(`Connected to MongoDB at ${MONGO_URI}`))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'VRMS backend is running' });
});

app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
