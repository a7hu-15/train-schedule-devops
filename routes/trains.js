var express = require('express');
var router = express.Router();
var dbEngine = require('../config/db');
var redisEngine = require('../config/redis');
var { createCircuitBreaker } = require('../config/circuitBreaker');

// Wrap DB calls in Opossum Circuit Breaker for SRE Fault Tolerance
var getTrainsBreaker = createCircuitBreaker(dbEngine.getTrains, 'GetTrains');
var updateTrainBreaker = createCircuitBreaker(function(args) {
  return dbEngine.updateTrain(args.id, args.updateData);
}, 'UpdateTrain');

// Broadcast real-time WebSocket update locally and over Redis Pub/Sub
async function broadcastUpdate(req) {
  try {
    var trains = await getTrainsBreaker.fire();
    var io = req.app.get('io');
    if (io) {
      io.emit('trains_updated', trains);
    }
    redisEngine.publishEvent('railpulse_trains_updated', trains);
  } catch (err) {
    console.error('Error broadcasting websocket update:', err);
  }
}

function checkOperator(req, res, next) {
  var requireOperatorAuth = req.app.get('requireOperatorAuth');
  if (requireOperatorAuth) {
    return requireOperatorAuth(req, res, next);
  }
  next();
}

/* GET all trains listing with optional search, route & distance filter (Where Is My Train API) */
router.get('/', async function(req, res, next) {
  try {
    var trains = await getTrainsBreaker.fire();
    var search = req.query.search || req.query.station || req.query.trainNumber;
    var origin = req.query.origin || req.query.from;
    var destination = req.query.destination || req.query.to;
    var maxDist = parseInt(req.query.maxDistance || req.query.maxKm, 10);
    var minDist = parseInt(req.query.minDistance || req.query.minKm, 10);

    // Filter by Distance (KM) Range
    if (!isNaN(maxDist) || !isNaN(minDist)) {
      trains = trains.filter(function(t) {
        var dist = t.distanceKm || 0;
        var passMax = isNaN(maxDist) ? true : (dist <= maxDist);
        var passMin = isNaN(minDist) ? true : (dist >= minDist);
        return passMax && passMin;
      });
    }

    // Filter by Origin & Destination route
    if (origin || destination) {
      trains = trains.filter(function(t) {
        var origMatch = true;
        var destMatch = true;

        if (origin) {
          var oq = origin.toLowerCase();
          origMatch = (t.origin && t.origin.toLowerCase().indexOf(oq) !== -1) ||
                      (t.stops && t.stops.some(function(s) { return s.station && s.station.toLowerCase().indexOf(oq) !== -1; }));
        }

        if (destination) {
          var dq = destination.toLowerCase();
          destMatch = (t.destination && t.destination.toLowerCase().indexOf(dq) !== -1) ||
                      (t.stops && t.stops.some(function(s) { return s.station && s.station.toLowerCase().indexOf(dq) !== -1; }));
        }

        return origMatch && destMatch;
      });
    }

    // Filter by general search query (train number, name, station)
    if (search) {
      var q = search.toLowerCase();
      trains = trains.filter(function(t) {
        var matchName = t.name && t.name.toLowerCase().indexOf(q) !== -1;
        var matchNum = t.trainNumber && t.trainNumber.toLowerCase().indexOf(q) !== -1;
        var matchOrig = t.origin && t.origin.toLowerCase().indexOf(q) !== -1;
        var matchDest = t.destination && t.destination.toLowerCase().indexOf(q) !== -1;
        var matchStops = t.stops && t.stops.some(function(s) { 
          return s.station && s.station.toLowerCase().indexOf(q) !== -1; 
        });
        return matchName || matchNum || matchOrig || matchDest || matchStops;
      });
    }

    res.json(trains);
  } catch (err) {
    res.status(503).json({ error: 'Service temporarily degraded. Circuit breaker active.' });
  }
});

/* GET single train by ID, Train Number, or Name (Public) */
router.get('/:id', async function(req, res, next) {
  try {
    var train = await dbEngine.getTrainById(req.params.id);
    if (!train) {
      return res.status(404).json({ error: 'Train schedule not found' });
    }
    res.json(train);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve train schedule' });
  }
});

/* PUT update train status, delay mins, platform, or delay reason (PROTECTED) */
router.put('/:id', checkOperator, async function(req, res, next) {
  try {
    var trainId = req.params.id;
    var existing = await dbEngine.getTrainById(trainId);
    if (!existing) {
      return res.status(404).json({ error: 'Train schedule not found' });
    }

    var updateData = {};
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.delayMinutes !== undefined) updateData.delayMinutes = parseInt(req.body.delayMinutes, 10) || 0;
    if (req.body.delayReason !== undefined) updateData.delayReason = req.body.delayReason;
    if (req.body.platform !== undefined) updateData.platform = req.body.platform;
    if (req.body.estimatedTime !== undefined) updateData.estimatedTime = req.body.estimatedTime;
    if (req.body.origin !== undefined) updateData.origin = req.body.origin;
    if (req.body.destination !== undefined) updateData.destination = req.body.destination;

    var updatedTrain = await updateTrainBreaker.fire({ id: existing.id, updateData: updateData });

    var logAuditAction = req.app.get('logAuditAction');
    if (logAuditAction) {
      logAuditAction(
        'UPDATE_TRAIN',
        'Updated train ' + existing.trainNumber + ' (' + existing.name + ') status to ' + (updateData.status || existing.status),
        'Dispatcher'
      );
    }

    broadcastUpdate(req);

    res.json({ message: 'Train schedule updated successfully', train: updatedTrain });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update train schedule' });
  }
});

/* POST create new train schedule (PROTECTED) */
router.post('/', checkOperator, async function(req, res, next) {
  try {
    var body = req.body;
    if (!body.name || !body.scheduledTime) {
      return res.status(400).json({ error: 'Train name and scheduledTime are required fields' });
    }

    var newId = 'TR-' + (Date.now() % 10000);
    var newTrain = {
      id: body.id || newId,
      trainNumber: body.trainNumber || ('EXP-' + Math.floor(Math.random() * 900 + 100)),
      name: body.name,
      origin: body.origin || 'Delhi (NDLS)',
      destination: body.destination || 'Jaipur (JP)',
      distanceKm: parseInt(body.distanceKm, 10) || 308,
      travelDuration: body.travelDuration || '4h 30m',
      runsOnDays: body.runsOnDays || ['Daily'],
      scheduledTime: body.scheduledTime,
      estimatedTime: body.estimatedTime || body.scheduledTime,
      platform: body.platform || 'Platform 1',
      status: body.status || 'ON-TIME',
      delayMinutes: parseInt(body.delayMinutes, 10) || 0,
      delayReason: body.delayReason || 'None',
      stops: body.stops || []
    };

    var created = await dbEngine.createTrain(newTrain);

    var logAuditAction = req.app.get('logAuditAction');
    if (logAuditAction) {
      logAuditAction(
        'CREATE_TRAIN',
        'Created new train schedule ' + created.trainNumber + ' (' + created.name + ')',
        'Dispatcher'
      );
    }

    broadcastUpdate(req);

    res.status(201).json({ message: 'Train schedule created successfully', train: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create train schedule' });
  }
});

/* DELETE train schedule (PROTECTED) */
router.delete('/:id', checkOperator, async function(req, res, next) {
  try {
    var trainId = req.params.id;
    var existing = await dbEngine.getTrainById(trainId);
    if (!existing) {
      return res.status(404).json({ error: 'Train schedule not found' });
    }

    await dbEngine.deleteTrain(existing.id);

    var logAuditAction = req.app.get('logAuditAction');
    if (logAuditAction) {
      logAuditAction(
        'DELETE_TRAIN',
        'Deleted train schedule ' + existing.trainNumber + ' (' + existing.name + ')',
        'Dispatcher'
      );
    }

    broadcastUpdate(req);

    res.json({ message: 'Train schedule deleted successfully', id: existing.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete train schedule' });
  }
});

module.exports = router;
