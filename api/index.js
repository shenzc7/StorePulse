const express = require('express');
const app = express();

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StorePulse API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StorePulse API is running' });
});

// Mock forecast endpoint
app.get('/api/forecast', (req, res) => {
  const mockData = {
    predictions: [
      {
        date: '2024-01-20',
        predicted_visits: 150,
        lower_bound: 130,
        upper_bound: 170,
        day_of_week: 'Saturday',
        is_weekend: true,
        is_holiday: false,
        confidence_level: 'high'
      }
    ],
    metadata: {
      trained_at: new Date().toISOString(),
      data_records: 1000
    }
  };
  res.json(mockData);
});

// Mock metrics endpoint
app.get('/api/metrics/', (req, res) => {
  const mockData = {
    lite_lift: 12.5,
    pro_weekend_gain: 18.3,
    coverage: 94.2,
    time_to_first_forecast: "2.3s",
    model_status: {
      lite_model_available: true,
      pro_model_available: true
    }
  };
  res.json(mockData);
});

// Mock settings endpoints
app.get('/api/settings/system/health', (req, res) => {
  const mockData = {
    status: 'healthy',
    database: 'connected',
    api_version: '1.0.0',
    uptime: '1h 23m',
    memory_usage: '45%',
    cpu_usage: '12%'
  };
  res.json(mockData);
});

module.exports = app;