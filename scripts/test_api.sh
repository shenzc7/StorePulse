#!/bin/bash

echo "Testing StorePulse API endpoints..."
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s http://localhost:8000/health
echo -e "\n"

# Test 2: Metrics
echo "2. Testing metrics endpoint..."
curl -s http://localhost:8000/api/metrics/
echo -e "\n"

# Test 3: Add data
echo "3. Testing add_today endpoint..."
curl -s -X POST http://localhost:8000/api/data/add_today \
  -H "Content-Type: application/json" \
  -d '{"event_date": "2024-01-15", "visits": 100}'
echo -e "\n"

# Test 4: Forecasts
echo "4. Testing forecast endpoint..."
curl -s http://localhost:8000/api/forecast/
echo -e "\n"

echo "Done! Check for any errors above."
