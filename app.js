var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var broken = false;

var indexRouter = require('./routes/index');
var trainsRouter = require('./routes/trains');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
   res.locals = {
     broken: broken
   };
   next();
 });

// Application Page Routes & API Routes
app.use('/', indexRouter);
app.use('/trains', trainsRouter);
app.use('/api/v1/trains', trainsRouter);

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

// SRE Chaos Testing Endpoints
app.get('/generate-cpu-load', function(req, res, next) {
  var val = 0.0001;
  for (var i = 0; i < 10000000; i++) {
    val += Math.sqrt(val);
  }
  res.status(200).json({
    status: 'SUCCESS',
    message: 'CPU load calculation completed',
    result: val
  });
});

// Simulate service outage (Chaos Injection)
app.all('/break', function(req, res, next) {
  broken = true;
  res.status(200).json({
    status: 'BROKEN',
    message: 'Application health status set to UNHEALTHY (HTTP 500 triggered on /health)'
  });
});

app.post('/api/v1/sre/break', function(req, res, next) {
  broken = true;
  res.status(200).json({
    status: 'BROKEN',
    message: 'Application health status set to UNHEALTHY'
  });
});

// Restore service health
app.all('/restore', function(req, res, next) {
  broken = false;
  res.status(200).json({
    status: 'RESTORED',
    message: 'Application health restored to HEALTHY (HTTP 200 on /health)'
  });
});

app.post('/api/v1/sre/restore', function(req, res, next) {
  broken = false;
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
