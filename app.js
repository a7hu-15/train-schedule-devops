var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var client = require('prom-client');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var dbEngine = require('./config/db');

var broken = false;
var OPERATOR_PIN = process.env.OPERATOR_PIN || '8899';
var OPERATOR_TOKEN = 'op_token_sec_8899_railpulse';
var startTime = Date.now();
var totalOutageSeconds = 0;
var lastOutageStart = null;

// Audit Logs Repository
var auditLogs = [
  {
    id: 'AUDIT-INIT',
    action: 'SYSTEM_STARTUP',
    details: 'RailPulse SRE & Cloud Security framework initialized',
    userRole: 'System',
    timestamp: new Date().toISOString()
  }
];

function logAuditAction(action, details, userRole) {
  auditLogs.unshift({
    id: 'AUDIT-' + Date.now(),
    action: action,
    details: details,
    userRole: userRole || 'Dispatcher',
    timestamp: new Date().toISOString()
  });
  if (auditLogs.length > 100) auditLogs.pop();
}

var indexRouter = require('./routes/index');
var trainsRouter = require('./routes/trains');

var app = express();

app.set('logAuditAction', logAuditAction);
app.set('auditLogs', auditLogs);

// 1. Security Headers Middleware (Helmet)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 2. Rate Limiting Middleware
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);

// 3. Prometheus SRE Metrics
client.collectDefaultMetrics({ timeout: 5000 });

var httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by RailPulse',
  labelNames: ['method', 'route', 'status']
});

var httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

var sloErrorBudgetGauge = new client.Gauge({
  name: 'slo_error_budget_remaining_percent',
  help: 'Remaining SLO Error Budget % (Target: 99.9% availability)'
});
sloErrorBudgetGauge.set(99.94);

var activeDisruptionsGauge = new client.Gauge({
  name: 'active_train_disruptions_count',
  help: 'Total active train delays or cancellations'
});

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Collect request latency & metrics
app.use(function(req, res, next) {
  var start = Date.now();
  res.on('finish', function() {
    var durationSec = (Date.now() - start) / 1000;
    if (req.path !== '/metrics') {
      httpRequestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
      httpRequestDurationHistogram.observe({ method: req.method, route: req.path, status: res.statusCode }, durationSec);
    }
  });
  next();
});

app.use(function (req, res, next) {
  res.locals = {
    broken: broken
  };
  next();
});

// Operator Authentication Verification Middleware
function requireOperatorAuth(req, res, next) {
  var token = req.headers['x-operator-token'] || req.query.operatorToken;
  if (token === OPERATOR_TOKEN) {
    return next();
  }
  return res.status(401).json({
    error: 'Unauthorized: Operator authentication token required to perform dispatcher or SRE controls.'
  });
}
app.set('requireOperatorAuth', requireOperatorAuth);

// Application Page Routes & Public API Routes
app.use('/', indexRouter);
app.use('/trains', trainsRouter);
app.use('/api/v1/trains', trainsRouter);

// Operator Auth Verification Endpoint
app.post('/api/v1/auth/verify-pin', function(req, res) {
  var pin = req.body && req.body.pin;
  if (pin === OPERATOR_PIN) {
    logAuditAction('OPERATOR_LOGIN', 'Operator desk unlocked successfully', 'Dispatcher');
    return res.status(200).json({
      success: true,
      token: OPERATOR_TOKEN,
      message: 'Operator Desk authenticated successfully'
    });
  } else {
    logAuditAction('AUTH_FAILURE', 'Invalid operator PIN attempt', 'SecurityAudit');
    return res.status(401).json({
      success: false,
      error: 'Invalid Operator Passcode. Access denied.'
    });
  }
});

// Feature 1: Crowdsourced GPS & Passenger Telemetry API
app.post('/api/v1/telemetry/gps', async function(req, res) {
  try {
    var body = req.body || {};
    var trainId = body.trainId || 'TR-101';
    var lat = body.lat || 40.7128;
    var lng = body.lng || -74.0060;
    var speed = body.speed || 65;

    var ping = await dbEngine.recordGpsPing(trainId, lat, lng, speed);
    logAuditAction('GPS_TELEMETRY', 'Received passenger GPS ping for train ' + trainId + ' (' + ping.speedKmh + ' km/h)', 'Commuter');

    // Broadcast over WebSockets
    var io = app.get('io');
    if (io) io.emit('gps_updated', ping);

    res.json({ success: true, ping: ping });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record GPS telemetry' });
  }
});

// Feature 2: GTFS-RT Data Lake & Historical Analytics API
app.get('/api/v1/analytics/history', async function(req, res) {
  try {
    var analytics = await dbEngine.getHistoricalAnalytics();
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch historical analytics' });
  }
});

// Feature 3: Crowdsourced Coach Density API
app.post('/api/v1/crowdsource/density', async function(req, res) {
  try {
    var body = req.body || {};
    var trainId = body.trainId;
    var density = body.density; // Low, Moderate, Heavy, Overcrowded

    if (!trainId || !density) {
      return res.status(400).json({ error: 'trainId and density are required' });
    }

    var result = await dbEngine.recordCoachDensity(trainId, density);
    logAuditAction('CROWD_DENSITY', 'Passenger submitted coach crowding rating: ' + density + ' for train ' + trainId, 'Commuter');

    var io = app.get('io');
    if (io) io.emit('density_updated', result);

    res.json({ success: true, result: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record coach density rating' });
  }
});

// Feature 4: DevOps Multi-Region Disaster Recovery API
app.get('/api/v1/sre/disaster-recovery', async function(req, res) {
  try {
    var status = await dbEngine.getMultiRegionStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch disaster recovery status' });
  }
});

app.post('/api/v1/sre/disaster-recovery/failover', requireOperatorAuth, async function(req, res) {
  try {
    var targetRegion = req.body && req.body.region;
    var result = await dbEngine.toggleRegionFailover(targetRegion);
    logAuditAction('DEVOPS_FAILOVER', 'Triggered Multi-Region Disaster Recovery failover to: ' + result.activeRegion, 'SRE-Engineer');
    res.json({ success: true, status: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger region failover' });
  }
});

// Operational Audit Logs Endpoint (Protected)
app.get('/api/v1/audit-logs', requireOperatorAuth, function(req, res) {
  res.json(auditLogs);
});

// SRE SLO & Error Budget API Endpoint
app.get('/api/v1/sre/slo', async function(req, res) {
  try {
    var trains = await dbEngine.getTrains();
    var total = trains.length;
    var disruptions = trains.filter(function(t) { return t.status === 'DELAYED' || t.status === 'CANCELLED'; }).length;
    activeDisruptionsGauge.set(disruptions);

    var totalUptimeSeconds = (Date.now() - startTime) / 1000;
    var currentOutageSec = lastOutageStart ? ((Date.now() - lastOutageStart) / 1000) : 0;
    var effectiveOutageSec = totalOutageSeconds + currentOutageSec;
    var availabilityPercent = totalUptimeSeconds > 0 ? Math.max(0, ((totalUptimeSeconds - effectiveOutageSec) / totalUptimeSeconds) * 100) : 100;

    var allowedErrorSec = Math.max(1, totalUptimeSeconds * 0.001);
    var remainingBudgetPercent = Math.max(0, Math.min(100, ((allowedErrorSec - effectiveOutageSec) / allowedErrorSec) * 100));
    sloErrorBudgetGauge.set(parseFloat(remainingBudgetPercent.toFixed(2)));

    var mrStatus = await dbEngine.getMultiRegionStatus();

    res.json({
      sloTarget: '99.9% Monthly Availability',
      currentAvailabilityPercent: parseFloat(availabilityPercent.toFixed(3)),
      errorBudgetRemainingPercent: parseFloat(remainingBudgetPercent.toFixed(2)),
      totalUptimeSeconds: Math.round(totalUptimeSeconds),
      totalOutageSeconds: Math.round(effectiveOutageSec),
      mttrSeconds: effectiveOutageSec > 0 ? 14.5 : 0,
      activeDisruptions: disruptions,
      circuitBreakerStatus: broken ? 'OPEN (DEGRADED)' : 'CLOSED (HEALTHY)',
      activeCloudRegion: mrStatus.activeRegion,
      multiRegionFailoverStatus: mrStatus.failoverStatus,
      isPgAvailable: dbEngine.isPgAvailable
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate SLO metrics' });
  }
});

// Prometheus Metrics Endpoint
app.get('/metrics', async function(req, res, next) {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Kubernetes Liveness Probe Endpoint
app.get('/health', function(req, res, next) {
  if (!broken) {
    res.status(200).json({
      status: 'UP',
      message: 'Transit Application is running healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      status: 'DOWN',
      error: 'Simulated service degradation (Chaos mode active)',
      timestamp: new Date().toISOString()
    });
  }
});

// Kubernetes Readiness Probe Endpoint
app.get('/ready', function(req, res, next) {
  res.status(200).json({
    status: 'READY',
    message: 'Transit Application is ready to accept traffic',
    timestamp: new Date().toISOString()
  });
});

// SRE Chaos Testing Endpoints (Protected by Operator Auth)
app.get('/generate-cpu-load', requireOperatorAuth, function(req, res, next) {
  var val = 0.0001;
  for (var i = 0; i < 10000000; i++) {
    val += Math.sqrt(val);
  }
  logAuditAction('CPU_STRESS', 'Generated heavy CPU load calculation', 'SRE-Engineer');
  res.status(200).json({
    status: 'SUCCESS',
    message: 'CPU load calculation completed',
    result: val
  });
});

app.all('/break', requireOperatorAuth, function(req, res, next) {
  broken = true;
  lastOutageStart = Date.now();
  logAuditAction('CHAOS_BREAK', 'Simulated service outage triggered', 'SRE-Engineer');
  res.status(200).json({
    status: 'BROKEN',
    message: 'Application health status set to UNHEALTHY'
  });
});

app.post('/api/v1/sre/break', requireOperatorAuth, function(req, res, next) {
  broken = true;
  lastOutageStart = Date.now();
  logAuditAction('CHAOS_BREAK', 'Simulated service outage triggered via API', 'SRE-Engineer');
  res.status(200).json({
    status: 'BROKEN',
    message: 'Application health status set to UNHEALTHY'
  });
});

app.all('/restore', requireOperatorAuth, function(req, res, next) {
  broken = false;
  if (lastOutageStart) {
    totalOutageSeconds += (Date.now() - lastOutageStart) / 1000;
    lastOutageStart = null;
  }
  logAuditAction('CHAOS_RESTORE', 'Service health restored', 'SRE-Engineer');
  res.status(200).json({
    status: 'RESTORED',
    message: 'Application health restored to HEALTHY'
  });
});

app.post('/api/v1/sre/restore', requireOperatorAuth, function(req, res, next) {
  broken = false;
  if (lastOutageStart) {
    totalOutageSeconds += (Date.now() - lastOutageStart) / 1000;
    lastOutageStart = null;
  }
  logAuditAction('CHAOS_RESTORE', 'Service health restored via API', 'SRE-Engineer');
  res.status(200).json({
    status: 'RESTORED',
    message: 'Application health restored to HEALTHY'
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    res.json({ error: err.message || 'Internal Server Error' });
  } else {
    res.render('error');
  }
});

module.exports = app;
