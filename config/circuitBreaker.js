var CircuitBreaker = require('opossum');

var options = {
  timeout: 3000, // If function takes longer than 3s, trigger failure
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 10000 // Try again after 10 seconds
};

function createCircuitBreaker(asyncFunction, name) {
  var breaker = new CircuitBreaker(asyncFunction, options);

  breaker.on('open', function() {
    console.warn(`[Circuit Breaker: ${name}] 🔴 CIRCUIT OPENED! Outage threshold exceeded. Serving cached fallbacks.`);
  });

  breaker.on('halfOpen', function() {
    console.log(`[Circuit Breaker: ${name}] 🟡 CIRCUIT HALF-OPEN! Testing downstream recovery.`);
  });

  breaker.on('close', function() {
    console.log(`[Circuit Breaker: ${name}] 🟢 CIRCUIT CLOSED! Service healthy.`);
  });

  return breaker;
}

module.exports = {
  createCircuitBreaker
};
