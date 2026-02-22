const express = require('express');

const app = express();

app.get('/health', (_req, res) => {
  res.status(503).json({
    status: 'unavailable',
    message: 'Node fallback is disabled. Run the FastAPI backend (api/main.py) instead.',
  });
});

app.all('*', (_req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'This runtime does not serve StorePulse APIs. Use the Python FastAPI deployment.',
  });
});

module.exports = app;
