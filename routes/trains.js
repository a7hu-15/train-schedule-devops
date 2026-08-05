var express = require('express');
var router = express.Router();
var low = require('lowdb');
var FileSync = require('lowdb/adapters/FileSync');

var adapter = new FileSync('data/trains.json');
var db = low(adapter);

// Helper function to broadcast real-time WebSocket update to all clients
function broadcastUpdate(req) {
  try {
    var io = req.app.get('io');
    if (io) {
      var trains = db.get('trains').value() || [];
      io.emit('trains_updated', trains);
    }
  } catch (err) {
    console.error('Error broadcasting websocket update:', err);
  }
}

/* GET all trains listing with optional search filter. */
router.get('/', function(req, res, next) {
  var trains = db.get('trains').value() || [];
  var search = req.query.search || req.query.station;

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
});

/* GET single train by ID or Name */
router.get('/:id', function(req, res, next) {
  var train = db.get('trains').find({ id: req.params.id }).value();
  if (!train) {
    train = db.get('trains').find({ name: req.params.id }).value();
  }
  if (!train) {
    return res.status(404).json({ error: 'Train schedule not found' });
  }
  res.json(train);
});

/* PUT update train status, delay mins, platform, or delay reason */
router.put('/:id', function(req, res, next) {
  var trainId = req.params.id;
  var existing = db.get('trains').find({ id: trainId }).value();
  if (!existing) {
    existing = db.get('trains').find({ name: trainId }).value();
  }
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

  db.get('trains')
    .find({ id: existing.id })
    .assign(updateData)
    .write();

  var updatedTrain = db.get('trains').find({ id: existing.id }).value();
  
  // Real-Time WebSocket Push
  broadcastUpdate(req);

  res.json({ message: 'Train schedule updated successfully', train: updatedTrain });
});

/* POST create new train schedule */
router.post('/', function(req, res, next) {
  var body = req.body;
  if (!body.name || !body.scheduledTime) {
    return res.status(400).json({ error: 'Train name and scheduledTime are required fields' });
  }

  var newId = 'TR-' + (Date.now() % 10000);
  var newTrain = {
    id: body.id || newId,
    trainNumber: body.trainNumber || ('EXP-' + Math.floor(Math.random() * 900 + 100)),
    name: body.name,
    origin: body.origin || 'Main Terminal',
    destination: body.destination || 'Central Station',
    scheduledTime: body.scheduledTime,
    estimatedTime: body.estimatedTime || body.scheduledTime,
    platform: body.platform || 'Platform 1',
    status: body.status || 'ON-TIME',
    delayMinutes: parseInt(body.delayMinutes, 10) || 0,
    delayReason: body.delayReason || 'None',
    stops: body.stops || []
  };

  db.get('trains').push(newTrain).write();
  
  // Real-Time WebSocket Push
  broadcastUpdate(req);

  res.status(201).json({ message: 'Train schedule created successfully', train: newTrain });
});

/* DELETE train schedule */
router.delete('/:id', function(req, res, next) {
  var trainId = req.params.id;
  var existing = db.get('trains').find({ id: trainId }).value();
  if (!existing) {
    existing = db.get('trains').find({ name: trainId }).value();
  }
  if (!existing) {
    return res.status(404).json({ error: 'Train schedule not found' });
  }

  db.get('trains').remove({ id: existing.id }).write();
  
  // Real-Time WebSocket Push
  broadcastUpdate(req);

  res.json({ message: 'Train schedule deleted successfully', id: existing.id });
});

module.exports = router;
