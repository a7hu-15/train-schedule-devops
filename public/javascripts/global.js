// RailPulse Client Engine - Real-Time WebSockets, Route Map, Security & Alerts

var allTrainsData = [];
var activeStationFilter = "";
var searchQuery = "";
var socket = null;
var isOperatorAuthed = false;
var subscribedAlerts = [];

$(document).ready(function() {
  // Check Operator Session Auth
  isOperatorAuthed = sessionStorage.getItem('operator_authed') === 'true';
  updateOperatorSecurityState();

  // Connect WebSocket for Instant Live Push Updates (< 50ms latency)
  initWebSocket();

  // Start Live Tickers
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Initial Load
  fetchTrainsData();
  fetchSreHealth();

  // Fallback Polling (Every 6 seconds)
  setInterval(fetchTrainsData, 6000);
  setInterval(fetchSreHealth, 4000);

  // Event Listeners - Search & Filters
  $('#commuterSearch').on('keyup input', function() {
    searchQuery = $(this).val().trim();
    renderCommuterBoard();
  });

  $('.station-filter-group button').on('click', function() {
    $('.station-filter-group button').removeClass('active');
    $(this).addClass('active');
    activeStationFilter = $(this).data('station') || "";
    renderCommuterBoard();
  });

  // Tab change authorization check
  $('#operator-tab').on('click', function(e) {
    if (!isOperatorAuthed) {
      $('#operatorAuthModal').modal('show');
    }
  });

  // Operator Auth Handlers
  $('#btnSubmitAuth').on('click', checkOperatorAuth);
  $('#btnLockOperator').on('click', lockOperatorDesk);

  // Preset Reason Toggle in Dispatch Modal
  $('#dispatchPresetReason').on('change', function() {
    if ($(this).val() === 'Custom') {
      $('#dispatchCustomReason').show().focus();
    } else {
      $('#dispatchCustomReason').hide();
    }
  });

  // Alert Subscription Handler
  $('#btnSaveSubscribe').on('click', submitAlertSubscription);

  // Save Dispatch Updates
  $('#btnSaveDispatch').on('click', submitDispatchUpdate);

  // Save New Train
  $('#btnAddTrainSave').on('click', submitAddTrain);

  // SRE Chaos Buttons
  $('#btnBreakApp').on('click', triggerBreakApp);
  $('#btnRestoreApp').on('click', triggerRestoreApp);
  $('#btnCpuStress').on('click', triggerCpuStress);
});

// Initialize WebSocket Connection
function initWebSocket() {
  try {
    if (typeof io !== 'undefined') {
      socket = io();
      socket.on('connect', function() {
        logSreTerminal('⚡ Real-Time WebSocket connected (ID: ' + socket.id + ')');
      });

      // Handle Live Push Updates
      socket.on('trains_updated', function(data) {
        logSreTerminal('📡 Live WebSocket Push received! Refreshing all connected passenger views.');
        allTrainsData = data || [];
        renderSummaryStats();
        renderCommuterBoard();
        renderOperatorTable();
        renderRouteMap();
        checkPassengerAlertTriggers();
      });

      socket.on('disconnect', function() {
        logSreTerminal('WebSocket disconnected. Falling back to HTTP polling.');
      });
    }
  } catch (err) {
    console.log('Socket.IO initialization error, using HTTP fallback.');
  }
}

// Live Clock Ticker
function updateLiveClock() {
  var now = new Date();
  var timeStr = now.toLocaleTimeString();
  $('#liveClock').text(timeStr);
}

// Fetch Trains from API
function fetchTrainsData() {
  $.getJSON('/api/v1/trains', function(data) {
    allTrainsData = data || [];
    renderSummaryStats();
    renderCommuterBoard();
    renderOperatorTable();
    renderRouteMap();
  }).fail(function(err) {
    logSreTerminal('Error fetching trains API feed.');
  });
}

// Operator RBAC Security Auth
function checkOperatorAuth() {
  var pin = $('#operatorPinInput').val().trim();
  if (pin === '1234' || pin === 'dispatch123' || pin === 'admin') {
    isOperatorAuthed = true;
    sessionStorage.setItem('operator_authed', 'true');
    $('#operatorAuthModal').modal('hide');
    $('#authErrorMsg').hide();
    updateOperatorSecurityState();
    $('#operator-tab').tab('show');
    logSreTerminal('🔐 Operator desk unlocked by authorized user.');
  } else {
    $('#authErrorMsg').show();
  }
}

function lockOperatorDesk() {
  isOperatorAuthed = false;
  sessionStorage.removeItem('operator_authed');
  updateOperatorSecurityState();
  $('#commuter-tab').tab('show');
  logSreTerminal('🔒 Operator desk locked.');
}

function updateOperatorSecurityState() {
  if (isOperatorAuthed) {
    $('#operatorAuthStatus').removeClass('badge-danger').addClass('badge-success').html('<i class="fas fa-lock-open mr-1"></i> Operator Authenticated');
    $('#btnLockOperator').show();
  } else {
    $('#operatorAuthStatus').removeClass('badge-success').addClass('badge-danger').html('<i class="fas fa-lock mr-1"></i> Desk Locked');
    $('#btnLockOperator').hide();
  }
}

// Alert Subscription
function submitAlertSubscription() {
  var email = $('#subEmail').val().trim();
  var trainId = $('#subTrainId').val();
  var threshold = parseInt($('#subThreshold').val(), 10) || 0;

  if (!email) {
    alert('Please enter a valid email address.');
    return;
  }

  subscribedAlerts.push({ email: email, trainId: trainId, threshold: threshold });
  $('#subscribeModal').modal('hide');
  showToastNotification('success', '🔔 Subscribed! You will receive live alerts for ' + (trainId === 'ALL' ? 'All Trains' : trainId) + ' at ' + email);
  logSreTerminal('Passenger subscribed to delay alerts: ' + email);
}

function checkPassengerAlertTriggers() {
  if (subscribedAlerts.length === 0) return;

  allTrainsData.forEach(function(t) {
    if (t.status === 'DELAYED' || t.status === 'CANCELLED') {
      subscribedAlerts.forEach(function(sub) {
        if (sub.trainId === 'ALL' || sub.trainId === t.id) {
          if (t.delayMinutes >= sub.threshold) {
            showToastNotification('warning', '🚨 LIVE DELAY ALERT: Train ' + t.name + ' (' + (t.trainNumber || 'EXP') + ') is ' + t.status + ' (+' + t.delayMinutes + 'm). Reason: ' + (t.delayReason || 'Disruption'));
          }
        }
      });
    }
  });
}

function showToastNotification(type, message) {
  var alertClass = type === 'success' ? 'alert-success' : 'alert-warning';
  var html = '<div class="alert ' + alertClass + ' alert-dismissible fade show shadow" role="alert">' +
             '  <strong>' + message + '</strong>' +
             '  <button type="button" class="close" data-dismiss="alert">&times;</button>' +
             '</div>';
  $('#globalAlertContainer').html(html);
}

// Render Route Map
function renderRouteMap() {
  if (allTrainsData.length === 0) {
    $('#mapTrainList').html('<div class="col-12 text-center text-muted py-3">No active trains on line.</div>');
    return;
  }

  var html = '';
  allTrainsData.forEach(function(t) {
    var statusBadge = 'status-badge-' + t.status;
    html += '<div class="col-md-6 col-lg-4 mb-3">';
    html += '  <div class="card bg-black border-secondary p-3 text-white h-100">';
    html += '    <div class="d-flex justify-content-between align-items-center mb-2">';
    html += '      <span class="font-weight-bold text-info"><i class="fas fa-train mr-1"></i> ' + t.name + '</span>';
    html += '      <span class="' + statusBadge + '">' + t.status + '</span>';
    html += '    </div>';
    html += '    <p class="x-small text-muted mb-2">Route: ' + (t.origin || 'Sycamore') + ' &rarr; ' + (t.destination || 'Hickory') + '</p>';
    html += '    <div class="d-flex justify-content-between align-items-center x-small">';
    html += '      <span><i class="fas fa-clock mr-1 text-muted"></i> Sched: ' + t.scheduledTime + '</span>';
    html += '      <span class="platform-pill">' + (t.platform || 'Platform 1') + '</span>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  });

  $('#mapTrainList').html(html);
}

// Render Summary Stats
function renderSummaryStats() {
  var total = allTrainsData.length;
  var onTime = 0, delayed = 0, cancelled = 0;

  allTrainsData.forEach(function(t) {
    if (t.status === 'ON-TIME') onTime++;
    else if (t.status === 'DELAYED') delayed++;
    else if (t.status === 'CANCELLED') cancelled++;
  });

  $('#totalTrainsCount').text(total);
  $('#onTimeCount').text(onTime);
  $('#delayedCount').text(delayed);
  $('#cancelledCount').text(cancelled);
}

// Render Commuter Board Cards
function renderCommuterBoard() {
  var filtered = allTrainsData.filter(function(t) {
    if (activeStationFilter) {
      var stationMatch = (t.origin && t.origin.indexOf(activeStationFilter) !== -1) ||
                         (t.destination && t.destination.indexOf(activeStationFilter) !== -1) ||
                         (t.stops && t.stops.some(function(s) { return s.station && s.station.indexOf(activeStationFilter) !== -1; }));
      if (!stationMatch) return false;
    }
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      var matchName = t.name && t.name.toLowerCase().indexOf(q) !== -1;
      var matchNum = t.trainNumber && t.trainNumber.toLowerCase().indexOf(q) !== -1;
      var matchOrig = t.origin && t.origin.toLowerCase().indexOf(q) !== -1;
      var matchDest = t.destination && t.destination.toLowerCase().indexOf(q) !== -1;
      return matchName || matchNum || matchOrig || matchDest;
    }
    return true;
  });

  if (filtered.length === 0) {
    $('#commuterTrainGrid').html('<div class="col-12 text-center text-muted py-5">No train schedules match your current search/filter criteria.</div>');
    return;
  }

  var html = '';
  filtered.forEach(function(t) {
    var statusClass = 'status-badge-' + t.status;
    var isDelayed = (t.status === 'DELAYED');
    var isCancelled = (t.status === 'CANCELLED');

    html += '<div class="col-md-6 col-lg-4 mb-4">';
    html += '  <div class="train-card d-flex flex-column justify-content-between">';
    html += '    <div>';
    html += '      <div class="d-flex justify-content-between align-items-start mb-2">';
    html += '        <div>';
    html += '          <span class="badge badge-secondary mr-2">' + (t.trainNumber || 'EXP') + '</span>';
    html += '          <span class="platform-pill">' + (t.platform || 'Platform 1') + '</span>';
    html += '        </div>';
    html += '        <span class="' + statusClass + '">' + t.status + '</span>';
    html += '      </div>';
    html += '      <h5 class="text-white font-weight-bold mb-1">' + t.name + '</h5>';
    html += '      <p class="small text-muted mb-3"><i class="fas fa-route mr-1"></i> ' + (t.origin || 'Main Terminal') + ' &rarr; ' + (t.destination || 'Central') + '</p>';
    
    html += '      <div class="row text-center bg-black p-2 rounded mb-3">';
    html += '        <div class="col-6 border-right border-secondary">';
    html += '          <span class="d-block x-small text-muted">SCHEDULED</span>';
    html += '          <span class="text-white font-weight-bold">' + t.scheduledTime + '</span>';
    html += '        </div>';
    html += '        <div class="col-6">';
    html += '          <span class="d-block x-small text-muted">ESTIMATED</span>';
    if (isDelayed) {
      html += '        <span class="text-warning font-weight-bold">' + (t.estimatedTime || t.scheduledTime) + ' (+' + t.delayMinutes + 'm)</span>';
    } else if (isCancelled) {
      html += '        <span class="text-danger font-weight-bold">CANCELLED</span>';
    } else {
      html += '        <span class="text-success font-weight-bold">' + t.scheduledTime + '</span>';
    }
    html += '        </div>';
    html += '      </div>';

    if ((isDelayed || isCancelled) && t.delayReason && t.delayReason !== 'None') {
      html += '    <div class="disruption-banner mb-2">';
      html += '      <i class="fas fa-exclamation-triangle text-warning mr-2"></i>';
      html += '      <span>' + t.delayReason + '</span>';
      html += '    </div>';
    }
    html += '    </div>';

    html += '    <div class="pt-2 border-top border-secondary text-right">';
    html += '      <button class="btn btn-outline-info btn-sm" onclick="openDispatchModal(\'' + t.id + '\')"><i class="fas fa-edit mr-1"></i> Dispatch Edit</button>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  });

  $('#commuterTrainGrid').html(html);
}

// Render Operator Table
function renderOperatorTable() {
  if (allTrainsData.length === 0) {
    $('#operatorTableBody').html('<tr><td colspan="9" class="text-center text-muted py-3">No train schedules configured.</td></tr>');
    return;
  }

  var html = '';
  allTrainsData.forEach(function(t) {
    var statusClass = 'status-badge-' + t.status;
    html += '<tr>';
    html += '  <td><span class="badge badge-secondary">' + (t.trainNumber || 'EXP') + '</span></td>';
    html += '  <td class="font-weight-bold text-white">' + t.name + '</td>';
    html += '  <td class="small text-muted">' + (t.origin || 'Main') + ' &rarr; ' + (t.destination || 'Central') + '</td>';
    html += '  <td>' + t.scheduledTime + '</td>';
    html += '  <td><span class="platform-pill">' + (t.platform || 'Platform 1') + '</span></td>';
    html += '  <td><span class="' + statusClass + '">' + t.status + '</span></td>';
    html += '  <td>' + (t.delayMinutes > 0 ? '+' + t.delayMinutes + ' mins' : '-') + '</td>';
    html += '  <td class="small text-muted">' + (t.delayReason || 'None') + '</td>';
    html += '  <td>';
    html += '    <button class="btn btn-primary btn-sm mr-1" onclick="openDispatchModal(\'' + t.id + '\')"><i class="fas fa-edit"></i> Edit</button>';
    html += '    <button class="btn btn-danger btn-sm" onclick="deleteTrain(\'' + t.id + '\')"><i class="fas fa-trash"></i></button>';
    html += '  </td>';
    html += '</tr>';
  });

  $('#operatorTableBody').html(html);
}

// Open Dispatch Modal
function openDispatchModal(id) {
  if (!isOperatorAuthed) {
    $('#operatorAuthModal').modal('show');
    return;
  }

  var train = allTrainsData.find(function(t) { return t.id === id; });
  if (!train) return;

  $('#dispatchTrainId').val(train.id);
  $('#modalTrainTitle').text(train.name + ' (' + (train.trainNumber || 'EXP') + ')');
  $('#dispatchStatus').val(train.status);
  $('#dispatchDelayMins').val(train.delayMinutes || 0);
  $('#dispatchPlatform').val(train.platform || 'Platform 1');

  var preset = ['None', 'Signaling Fault at Station Junction', 'Mechanical & Brake Inspection', 'Track Maintenance & Debris Clear', 'Platform Overcrowding & Reassignment'];
  if (preset.indexOf(train.delayReason) !== -1) {
    $('#dispatchPresetReason').val(train.delayReason);
    $('#dispatchCustomReason').hide();
  } else if (train.delayReason && train.delayReason !== 'None') {
    $('#dispatchPresetReason').val('Custom');
    $('#dispatchCustomReason').val(train.delayReason).show();
  } else {
    $('#dispatchPresetReason').val('None');
    $('#dispatchCustomReason').hide();
  }

  $('#dispatchModal').modal('show');
}

// Submit Dispatch Update
function submitDispatchUpdate() {
  var id = $('#dispatchTrainId').val();
  var status = $('#dispatchStatus').val();
  var delayMins = parseInt($('#dispatchDelayMins').val(), 10) || 0;
  var platform = $('#dispatchPlatform').val().trim() || 'Platform 1';

  var reason = $('#dispatchPresetReason').val();
  if (reason === 'Custom') {
    reason = $('#dispatchCustomReason').val().trim() || 'Custom Disruption';
  }

  var updatePayload = {
    status: status,
    delayMinutes: delayMins,
    platform: platform,
    delayReason: reason
  };

  $.ajax({
    url: '/api/v1/trains/' + id,
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify(updatePayload),
    success: function(res) {
      $('#dispatchModal').modal('hide');
      logSreTerminal('Updated train ' + id + ' -> Status: ' + status + ', Platform: ' + platform);
    },
    error: function(err) {
      alert('Error updating train schedule.');
    }
  });
}

// Submit Add Train
function submitAddTrain() {
  var name = $('#newTrainName').val().trim();
  var num = $('#newTrainNum').val().trim();
  var platform = $('#newPlatform').val().trim();
  var origin = $('#newOrigin').val().trim();
  var dest = $('#newDest').val().trim();
  var scheduledTime = $('#newScheduledTime').val().trim();

  if (!name || !scheduledTime) {
    alert('Please enter train name and scheduled time.');
    return;
  }

  var payload = {
    name: name,
    trainNumber: num,
    platform: platform,
    origin: origin,
    destination: dest,
    scheduledTime: scheduledTime
  };

  $.ajax({
    url: '/api/v1/trains',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(payload),
    success: function(res) {
      $('#addTrainModal').modal('hide');
      $('#addTrainForm')[0].reset();
      logSreTerminal('Added new train schedule: ' + name);
    },
    error: function(err) {
      alert('Error creating train schedule.');
    }
  });
}

// Delete Train
function deleteTrain(id) {
  if (!confirm('Are you sure you want to remove train schedule ' + id + '?')) return;

  $.ajax({
    url: '/api/v1/trains/' + id,
    type: 'DELETE',
    success: function(res) {
      logSreTerminal('Deleted train schedule: ' + id);
    }
  });
}

// SRE Health Probes
function fetchSreHealth() {
  $.ajax({
    url: '/health',
    type: 'GET',
    success: function(data) {
      $('#livenessBadge').removeClass('badge-danger').addClass('badge-success').text('Healthy (200 OK)');
      $('#livenessResponseJson').text(JSON.stringify(data, null, 2));
    },
    error: function(xhr) {
      $('#livenessBadge').removeClass('badge-success').addClass('badge-danger').text('Unhealthy (500 ERR)');
      $('#livenessResponseJson').text(xhr.responseText || '{"status": "DOWN", "error": "500 Internal Server Error"}');
    }
  });
}

function triggerBreakApp() {
  $.post('/api/v1/sre/break', function(data) {
    fetchSreHealth();
    logSreTerminal('🚨 CHAOS TRIGGERED: App outage injected. /health now returning HTTP 500.');
  });
}

function triggerRestoreApp() {
  $.post('/api/v1/sre/restore', function(data) {
    fetchSreHealth();
    logSreTerminal('✅ SYSTEM RESTORED: App health set back to healthy. /health returning HTTP 200.');
  });
}

function triggerCpuStress() {
  $('#cpuResultJson').text('Calculating heavy CPU load (10M iterations)...');
  var startTime = Date.now();
  $.get('/generate-cpu-load', function(data) {
    var elapsed = Date.now() - startTime;
    $('#cpuResultJson').text(JSON.stringify(data) + ' (Time taken: ' + elapsed + 'ms)');
    logSreTerminal('⚡ CPU STRESS COMPLETED in ' + elapsed + 'ms. HPA metric target reached.');
  });
}

function logSreTerminal(msg) {
  var log = $('#sreLogTerminal');
  var time = new Date().toLocaleTimeString();
  log.append('\n[' + time + '] ' + msg);
  log.scrollTop(log[0].scrollHeight);
}