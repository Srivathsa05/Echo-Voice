#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:3001';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testHealthEndpoint() {
  log('\n=== Testing Health Endpoint ===', 'blue');
  
  try {
    const response = await makeRequest('/api/health');
    
    if (response.status === 200) {
      log('Health check: PASS', 'green');
      log(`Status: ${response.data.status}`, 'reset');
      log(`Environment: ${response.data.environment}`, 'reset');
      log(`Cache size: ${response.data.services.cache.size}`, 'reset');
      return true;
    } else {
      log(`Health check: FAIL (Status: ${response.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`Health check: FAIL (${error.message})`, 'red');
    return false;
  }
}

async function testReadinessEndpoint() {
  log('\n=== Testing Readiness Endpoint ===', 'blue');
  
  try {
    const response = await makeRequest('/api/health/ready');
    
    if (response.status === 200) {
      log('Readiness check: PASS', 'green');
      log(`Status: ${response.data.status}`, 'reset');
      return true;
    } else {
      log(`Readiness check: FAIL (Status: ${response.status})`, 'red');
      log(`Reason: ${response.data.reason}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`Readiness check: FAIL (${error.message})`, 'red');
    return false;
  }
}

async function testHistoryEndpoint() {
  log('\n=== Testing History Endpoint ===', 'blue');
  
  try {
    const response = await makeRequest('/api/history');
    
    if (response.status === 200) {
      log('History endpoint: PASS', 'green');
      log(`Total consultations: ${response.data.total}`, 'reset');
      return true;
    } else {
      log(`History endpoint: FAIL (Status: ${response.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`History endpoint: FAIL (${error.message})`, 'red');
    return false;
  }
}

async function testInvalidSession() {
  log('\n=== Testing Invalid Session Handling ===', 'blue');
  
  try {
    const response = await makeRequest('/api/results/invalid-session-id');
    
    if (response.status === 404) {
      log('Invalid session handling: PASS', 'green');
      log(`Error: ${response.data.error}`, 'reset');
      return true;
    } else {
      log(`Invalid session handling: FAIL (Status: ${response.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`Invalid session handling: FAIL (${error.message})`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('  Echo Backend API Test Suite', 'blue');
  log('========================================', 'blue');
  
  log(`\nTesting endpoint: ${BASE_URL}`, 'yellow');
  
  const results = {
    health: await testHealthEndpoint(),
    readiness: await testReadinessEndpoint(),
    history: await testHistoryEndpoint(),
    invalidSession: await testInvalidSession()
  };
  
  log('\n========================================', 'blue');
  log('  Test Results Summary', 'blue');
  log('========================================', 'blue');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? 'PASS' : 'FAIL';
    const color = result ? 'green' : 'red';
    log(`${test}: ${status}`, color);
  });
  
  log('\n========================================', 'blue');
  log(`  Total: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  log('========================================\n', 'blue');
  
  if (passed === total) {
    log('All tests passed! Backend is ready.', 'green');
    process.exit(0);
  } else {
    log('Some tests failed. Check the output above.', 'red');
    process.exit(1);
  }
}

runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
