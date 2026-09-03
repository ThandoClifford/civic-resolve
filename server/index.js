const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');

dotenv.config();

const complaintRoutes = require('./routes/complaints');
const reportsRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

const streetlightsRoutes = require('./routes/streetlights');
const telemetryRoutes = require('./routes/telemetry');
const faultsRoutes = require('./routes/faults');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/streetlights', streetlightsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/faults', faultsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CivicResolve API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/municipal_complaints')
  .then(() => {
    console.log('MongoDB connected successfully');
    const server = http.createServer(app);
    const { initializeSocket } = require('./services/socketService');
    initializeSocket(server);
    const { recoverPendingEscalations } = require('./services/smartlightEscalationService');
    recoverPendingEscalations();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
