// app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('better-sqlite3');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = new sqlite3('motoMinder.db', { verbose: console.log });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const garageRoutes = require('./routes/garages');
const bikeRoutes = require('./server/routes/bikes');
const sectionRoutes = require('./server/routes/sections');
const partRoutes = require('./server/routes/parts');
const tagRoutes = require('./routes/tags');
const maintenanceRoutes = require('./server/routes/maintenance');
const searchRoutes = require('./routes/search');

// Use routes
app.use('/api/garages', garageRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;