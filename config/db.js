var { Pool } = require('pg');
var low = require('lowdb');
var FileSync = require('lowdb/adapters/FileSync');

var isPgAvailable = false;
var pool = null;

if (process.env.DATABASE_URL || process.env.POSTGRES_HOST) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'railpulse',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    isPgAvailable = true;
    console.log('[Database Engine] PostgreSQL Connection Pool initialized.');
  } catch (err) {
    console.warn('[Database Engine] PostgreSQL fallback to lowdb storage:', err.message);
  }
}

var adapter = new FileSync('data/trains.json');
var lowDb = low(adapter);

// Ensure default structures exist in LowDB
lowDb.defaults({
  trains: [],
  historyLogs: [
    { id: 'HIST-22436', trainId: 'TR-22436', trainNumber: '22436', delayMinutes: 0, status: 'ON-TIME', station: 'New Delhi (NDLS)', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'HIST-12951', trainId: 'TR-12951', trainNumber: '12951', delayMinutes: 15, status: 'DELAYED', station: 'Vadodara (BRC)', timestamp: new Date(Date.now() - 43200000).toISOString() },
    { id: 'HIST-12259', trainId: 'TR-12259', trainNumber: '12259', delayMinutes: 25, status: 'DELAYED', station: 'Dhanbad (DHN)', timestamp: new Date(Date.now() - 21600000).toISOString() }
  ],
  gpsTelemetry: [],
  coachDensity: {
    'TR-22436': { density: 'Low', reports: 42, lastUpdated: new Date().toISOString() },
    'TR-12951': { density: 'Moderate', reports: 68, lastUpdated: new Date().toISOString() },
    'TR-12002': { density: 'Low', reports: 29, lastUpdated: new Date().toISOString() },
    'TR-12259': { density: 'Heavy', reports: 84, lastUpdated: new Date().toISOString() }
  },
  multiRegionState: {
    primaryRegion: 'us-east-1 (N. Virginia - Active)',
    secondaryRegion: 'eu-central-1 (Frankfurt - Standby)',
    activeRegion: 'us-east-1',
    failoverStatus: 'HEALTHY',
    lastFailover: null
  }
}).write();

async function getTrains() {
  var trains = lowDb.get('trains').value() || [];
  var densities = lowDb.get('coachDensity').value() || {};

  return trains.map(function(t) {
    var den = densities[t.id] || { density: 'Low', reports: 0 };
    t.coachDensity = den.density;
    t.densityReports = den.reports;
    return t;
  });
}

async function getTrainById(id) {
  var trains = await getTrains();
  var train = trains.find(function(t) { return t.id === id || t.name === id || t.trainNumber === id; });
  return train;
}

async function updateTrain(id, updateData) {
  var existing = await getTrainById(id);
  if (!existing) return null;

  lowDb.get('trains')
    .find({ id: existing.id })
    .assign(updateData)
    .write();

  // Record historical delay log for GTFS Data Lake
  if (updateData.status || updateData.delayMinutes !== undefined) {
    lowDb.get('historyLogs').push({
      id: 'HIST-' + Date.now(),
      trainId: existing.id,
      trainNumber: existing.trainNumber,
      status: updateData.status || existing.status,
      delayMinutes: updateData.delayMinutes !== undefined ? updateData.delayMinutes : existing.delayMinutes,
      station: existing.origin || 'Terminal',
      timestamp: new Date().toISOString()
    }).write();
  }

  return getTrainById(existing.id);
}

async function createTrain(newTrain) {
  lowDb.get('trains').push(newTrain).write();
  lowDb.get('coachDensity').set(newTrain.id, { density: 'Low', reports: 1, lastUpdated: new Date().toISOString() }).write();
  return newTrain;
}

async function deleteTrain(id) {
  var existing = await getTrainById(id);
  if (!existing) return null;

  lowDb.get('trains').remove({ id: existing.id }).write();
  return existing;
}

// Feature 1: Crowdsourced GPS & Passenger Telemetry
async function recordGpsPing(trainId, lat, lng, speed) {
  var train = await getTrainById(trainId);
  var ping = {
    id: 'GPS-' + Date.now(),
    trainId: trainId,
    trainNumber: train ? train.trainNumber : 'EXP',
    lat: parseFloat(lat) || 28.6139,
    lng: parseFloat(lng) || 77.2090,
    speedKmh: Math.round(speed || (75 + Math.random() * 45)),
    timestamp: new Date().toISOString()
  };

  lowDb.get('gpsTelemetry').push(ping).write();
  if (lowDb.get('gpsTelemetry').value().length > 50) {
    lowDb.get('gpsTelemetry').shift().write();
  }

  return ping;
}

// Feature 2: GTFS Data Lake & Historical Delay Analytics
async function getHistoricalAnalytics() {
  var logs = lowDb.get('historyLogs').value() || [];
  var trains = lowDb.get('trains').value() || [];

  var routeGrades = trains.map(function(t) {
    var trainLogs = logs.filter(function(l) { return l.trainId === t.id; });
    var delayedCount = trainLogs.filter(function(l) { return l.status === 'DELAYED' || l.status === 'CANCELLED'; }).length;
    var totalCount = Math.max(1, trainLogs.length);
    var onTimeRatio = ((totalCount - delayedCount) / totalCount) * 100;

    var grade = 'A+';
    if (onTimeRatio < 60) grade = 'F';
    else if (onTimeRatio < 70) grade = 'D';
    else if (onTimeRatio < 80) grade = 'C';
    else if (onTimeRatio < 90) grade = 'B';
    else if (onTimeRatio < 95) grade = 'A';

    return {
      trainId: t.id,
      trainNumber: t.trainNumber,
      name: t.name,
      onTimePercentage: parseFloat(onTimeRatio.toFixed(1)),
      grade: grade,
      totalTrackedRuns: totalCount
    };
  });

  return {
    totalArchivedLogs: logs.length,
    routeReliabilityGrades: routeGrades,
    recentHistory: logs.slice(-15).reverse()
  };
}

// Feature 3: Crowdsourced Coach Density & Station Congestion
async function recordCoachDensity(trainId, density) {
  var current = lowDb.get('coachDensity').get(trainId).value() || { density: 'Low', reports: 0 };
  var newReports = (current.reports || 0) + 1;

  lowDb.get('coachDensity').set(trainId, {
    density: density,
    reports: newReports,
    lastUpdated: new Date().toISOString()
  }).write();

  return { trainId: trainId, density: density, reports: newReports };
}

// Feature 4: DevOps Multi-Region Disaster Recovery
async function getMultiRegionStatus() {
  return lowDb.get('multiRegionState').value();
}

async function toggleRegionFailover(region) {
  var state = lowDb.get('multiRegionState').value();
  var targetRegion = region || (state.activeRegion === 'us-east-1' ? 'eu-central-1' : 'us-east-1');

  state.activeRegion = targetRegion;
  state.failoverStatus = targetRegion === 'us-east-1' ? 'HEALTHY (Primary Region)' : 'FAILOVER ACTIVE (Secondary Region - eu-central-1)';
  state.lastFailover = new Date().toISOString();

  lowDb.set('multiRegionState', state).write();
  return state;
}

// Start Live Real-Time Train Engine Simulator
function startLiveTrainSimulator(app) {
  setInterval(async function() {
    try {
      var trains = lowDb.get('trains').value() || [];
      if (trains.length === 0) return;

      var idx = Math.floor(Math.random() * trains.length);
      var train = trains[idx];

      if (train.status !== 'CANCELLED') {
        var rand = Math.random();
        if (rand < 0.5) {
          var delta = Math.floor(Math.random() * 5) - 2; // -2 to +2 mins
          train.delayMinutes = Math.max(0, train.delayMinutes + delta);

          if (train.delayMinutes === 0) {
            train.status = 'ON-TIME';
            train.delayReason = 'None';
            train.estimatedTime = train.scheduledTime;
          } else {
            train.status = 'DELAYED';
            if (!train.delayReason || train.delayReason === 'None') {
              train.delayReason = 'Operational Congestion / Speed Restriction';
            }
          }
          lowDb.get('trains').find({ id: train.id }).assign(train).write();
        }
      }

      if (app) {
        var io = app.get('io');
        if (io) io.emit('trains_updated', await getTrains());
      }
    } catch (err) {
      console.warn('Live simulation update error:', err.message);
    }
  }, 10000);
}

module.exports = {
  isPgAvailable,
  getTrains,
  getTrainById,
  updateTrain,
  createTrain,
  deleteTrain,
  recordGpsPing,
  getHistoricalAnalytics,
  recordCoachDensity,
  getMultiRegionStatus,
  toggleRegionFailover,
  startLiveTrainSimulator
};
