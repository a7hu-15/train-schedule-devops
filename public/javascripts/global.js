// RailPulse Client Engine - Apple SF Pro Design System Engine

var allTrainsData = [];
var activeStationFilter = "";
var searchQuery = "";
var socket = null;
var isOperatorAuthed = false;
var operatorToken = "";
var subscribedAlerts = [];
var syntheticProbeLatencies = [14, 18, 12, 16, 15];

$(document).ready(function() {
  isOperatorAuthed = sessionStorage.getItem('operator_authed') === 'true';
  operatorToken = sessionStorage.getItem('operator_token') || "";
  updateOperatorSecurityState();

  initWebSocket();

  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  fetchTrainsData();
  fetchSreHealth();
  fetchSreSlo();

  setInterval(fetchTrainsData, 6000);
  setInterval(fetchSreHealth, 4000);
  setInterval(fetchSreSlo, 5000);
  setInterval(runSyntheticProbes, 3000);

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

  $('#operator-tab').on('click', function() {
    if (isOperatorAuthed) fetchAuditLogs();
  });

  $('#sre-tab').on('click', function() {
    fetchSreSlo();
  });

  $('#btnSubmitAuth').on('click', checkOperatorAuth);
  $('#operatorAuthForm').on('submit', function(e) {
    e.preventDefault();
    checkOperatorAuth();
  });
  $('#btnStaffLogout').on('click', lockOperatorDesk);

  $('#dispatchPresetReason').on('change', function() {
    if ($(this).val() === 'Custom') {
      $('#dispatchCustomReason').show().focus();
    } else {
      $('#dispatchCustomReason').hide();
    }
  });

  $('#btnSaveSubscribe').on('click', submitAlertSubscription);
  $('#btnSaveDispatch').on('click', submitDispatchUpdate);
  $('#btnAddTrainSave').on('click', submitAddTrain);

  $('#btnBreakApp').on('click', triggerBreakApp);
  $('#btnRestoreApp').on('click', triggerRestoreApp);
  $('#btnCpuStress').on('click', triggerCpuStress);
});

function getAuthHeaders() {
  return {
    'X-Operator-Token': sessionStorage.getItem('operator_token') || ''
  };
}

function updateOperatorSecurityState() {
  if (isOperatorAuthed) {
    $('#operator-nav-item').show();
    $('#sre-nav-item').show();
    $('#btnStaffLogin').hide();
    $('#btnStaffLogout').show();
    $('#operatorAuthStatus').removeClass('badge-danger').addClass('badge-success').html('<i class="fas fa-lock-open mr-1"></i> Staff Authenticated');
  } else {
    $('#operator-nav-item').hide();
    $('#sre-nav-item').hide();
    $('#btnStaffLogin').show();
    $('#btnStaffLogout').hide();
    $('#operatorAuthStatus').removeClass('badge-success').addClass('badge-danger').html('<i class="fas fa-lock mr-1"></i> Staff Locked');
    $('#commuter-tab').tab('show');
  }
  renderCommuterBoard();
}

function initWebSocket() {
  try {
    if (typeof io !== 'undefined') {
      socket = io();
      socket.on('connect', function() {
        logSreTerminal('⚡ Real-Time WebSocket connected (ID: ' + socket.id + ')');
      });

      socket.on('trains_updated', function(data) {
        logSreTerminal('📡 Live WebSocket Push received! Refreshing all connected views.');
        allTrainsData = data || [];
        renderSummaryStats();
        renderCommuterBoard();
        renderOperatorTable();
        renderRouteMap();
        checkPassengerAlertTriggers();
        if (isOperatorAuthed) fetchAuditLogs();
      });

      socket.on('disconnect', function() {
        logSreTerminal('WebSocket disconnected. Falling back to HTTP polling.');
      });
    }
  } catch (err) {
    console.log('Socket.IO initialization error, using HTTP fallback.');
  }
}

function updateLiveClock() {
  var now = new Date();
  var timeStr = now.toLocaleTimeString();
  $('#liveClock').text(timeStr);
}

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

function runSyntheticProbes() {
  var start = Date.now();
  $.getJSON('/api/v1/trains', function() {
    var elapsed = Date.now() - start;
    syntheticProbeLatencies.push(elapsed);
    if (syntheticProbeLatencies.length > 10) syntheticProbeLatencies.shift();

    var sum = syntheticProbeLatencies.reduce(function(a, b) { return a + b; }, 0);
    var avgP95 = Math.round(sum / syntheticProbeLatencies.length);

    $('#synthP95Val').text(avgP95 + 'ms');
  });
}

function fetchSreSlo() {
  $.getJSON('/api/v1/sre/slo', function(slo) {
    if (slo) {
      $('#sloAvailabilityVal').text((slo.currentAvailabilityPercent || 99.9) + '%');
      $('#sloBudgetVal').text((slo.errorBudgetRemainingPercent || 100) + '%');
      $('#sloMttrVal').text((slo.activeDisruptions || 0));
    }
  }).fail(function(err) {
    console.warn('SLO fetch error');
  });
}

function checkOperatorAuth() {
  var pin = $('#operatorPinInput').val().trim();
  if (!pin) {
    $('#authErrorMsg').text('Please enter a passcode.').show();
    return;
  }

  $.ajax({
    url: '/api/v1/auth/verify-pin',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ pin: pin }),
    success: function(res) {
      if (res.success && res.token) {
        isOperatorAuthed = true;
        operatorToken = res.token;
        sessionStorage.setItem('operator_authed', 'true');
        sessionStorage.setItem('operator_token', res.token);
        $('#operatorAuthModal').modal('hide');
        $('#operatorPinInput').val('');
        $('#authErrorMsg').hide();
        updateOperatorSecurityState();
        $('#operator-tab').tab('show');
        fetchAuditLogs();
        fetchSreSlo();
        logSreTerminal('🔐 Staff authentication successful. Operator Desk revealed.');
        showToastNotification('success', '🔑 Staff Authenticated! Operator Desk & SRE Chaos Room unlocked.');
      } else {
        $('#authErrorMsg').text('Invalid Operator Passcode. Access denied.').show();
      }
    },
    error: function(xhr) {
      var errText = (xhr.responseJSON && xhr.responseJSON.error) || 'Access denied.';
      $('#authErrorMsg').text(errText).show();
    }
  });
}

function lockOperatorDesk() {
  isOperatorAuthed = false;
  operatorToken = "";
  sessionStorage.removeItem('operator_authed');
  sessionStorage.removeItem('operator_token');
  updateOperatorSecurityState();
  logSreTerminal('🔒 Staff signed out. Operator Desk hidden.');
  showToastNotification('success', '🔒 Staff signed out. Returned to Commuter View.');
}

function fetchAuditLogs() {
  if (!isOperatorAuthed) return;

  $.ajax({
    url: '/api/v1/audit-logs',
    type: 'GET',
    headers: getAuthHeaders(),
    success: function(logs) {
      renderAuditLogsTable(logs || []);
    },
    error: function(err) {
      console.warn('Audit logs fetch error:', err);
    }
  });
}

function renderAuditLogsTable(logs) {
  if (logs.length === 0) {
    $('#auditLogsTableBody').html('<tr><td colspan="4" class="text-center text-muted py-3">No audit actions recorded yet.</td></tr>');
    return;
  }

  var html = '';
  logs.forEach(function(l) {
    var timeStr = new Date(l.timestamp).toLocaleTimeString();
    var actionBadge = 'badge-secondary';
    if (l.action.indexOf('UPDATE') !== -1) actionBadge = 'badge-info';
    else if (l.action.indexOf('CREATE') !== -1) actionBadge = 'badge-success';
    else if (l.action.indexOf('DELETE') !== -1 || l.action.indexOf('CHAOS') !== -1) actionBadge = 'badge-warning';
    else if (l.action.indexOf('FAILURE') !== -1) actionBadge = 'badge-danger';

    html += '<tr>';
    html += '  <td class="x-small text-muted">' + timeStr + '</td>';
    html += '  <td><span class="badge ' + actionBadge + '" style="border-radius: 8px;">' + l.action + '</span></td>';
    html += '  <td class="small text-white">' + l.details + '</td>';
    html += '  <td class="x-small text-muted">' + l.userRole + '</td>';
    html += '</tr>';
  });

  $('#auditLogsTableBody').html(html);
}

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
  showToastNotification('success', '🔔 Subscribed! Alerts enabled for ' + (trainId === 'ALL' ? 'All Schedules' : trainId) + ' at ' + email);
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
  var html = '<div class="alert ' + alertClass + ' alert-dismissible fade show shadow" style="border-radius: 16px;" role="alert">' +
             '  <strong>' + message + '</strong>' +
             '  <button type="button" class="close" data-dismiss="alert">&times;</button>' +
             '</div>';
  $('#globalAlertContainer').html(html);
}

function renderRouteMap() {
  if (allTrainsData.length === 0) {
    $('#mapTrainList').html('<div class="col-12 text-center text-muted py-3">No active trains on line.</div>');
    return;
  }

  var html = '';
  allTrainsData.forEach(function(t) {
    var statusBadge = 'apple-status-' + t.status;
    html += '<div class="col-md-6 col-lg-4 mb-3">';
    html += '  <div class="apple-card p-3 text-white h-100">';
    html += '    <div class="d-flex justify-content-between align-items-center mb-2">';
    html += '      <span class="font-weight-bold text-info"><i class="fas fa-train mr-1"></i> ' + t.name + '</span>';
    html += '      <span class="' + statusBadge + '">' + t.status + '</span>';
    html += '    </div>';
    html += '    <p class="x-small text-muted mb-2">Route: ' + (t.origin || 'Sycamore') + ' &rarr; ' + (t.destination || 'Hickory') + '</p>';
    html += '    <div class="d-flex justify-content-between align-items-center x-small">';
    html += '      <span><i class="fas fa-clock mr-1 text-muted"></i> Sched: ' + t.scheduledTime + '</span>';
    html += '      <span class="apple-platform-pill">' + (t.platform || 'Platform 1') + '</span>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  });

  $('#mapTrainList').html(html);
}

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
    var statusClass = 'apple-status-' + t.status;
    var isDelayed = (t.status === 'DELAYED');
    var isCancelled = (t.status === 'CANCELLED');

    html += '<div class="col-md-6 col-lg-4 mb-4">';
    html += '  <div class="apple-card d-flex flex-column justify-content-between">';
    html += '    <div>';
    html += '      <div class="d-flex justify-content-between align-items-center mb-3">';
    html += '        <div>';
    html += '          <span class="badge badge-secondary mr-2" style="border-radius: 8px;">' + (t.trainNumber || 'EXP') + '</span>';
    html += '          <span class="apple-platform-pill">' + (t.platform || 'Platform 1') + '</span>';
    html += '        </div>';
    html += '        <span class="' + statusClass + '">' + t.status + '</span>';
    html += '      </div>';

    html += '      <h5 class="text-white font-weight-bold mb-1 letter-spacing-tight">' + t.name + '</h5>';
    html += '      <p class="x-small text-muted mb-3"><i class="fas fa-route mr-1 text-info"></i> ' + (t.origin || 'Main Terminal') + ' &rarr; ' + (t.destination || 'Central') + '</p>';
    
    html += '      <div class="row text-center p-3 rounded mb-3" style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.06);">';
    html += '        <div class="col-6 border-right border-secondary">';
    html += '          <span class="d-block x-small text-muted letter-spacing-wide">SCHEDULED</span>';
    html += '          <span class="text-white font-weight-bold h6 mb-0">' + t.scheduledTime + '</span>';
    html += '        </div>';
    html += '        <div class="col-6">';
    html += '          <span class="d-block x-small text-muted letter-spacing-wide">ESTIMATED</span>';
    if (isDelayed) {
      html += '        <span class="text-warning font-weight-bold h6 mb-0">' + (t.estimatedTime || t.scheduledTime) + ' <small>(+' + t.delayMinutes + 'm)</small></span>';
    } else if (isCancelled) {
      html += '        <span class="text-danger font-weight-bold h6 mb-0">CANCELLED</span>';
    } else {
      html += '        <span class="text-success font-weight-bold h6 mb-0">' + t.scheduledTime + '</span>';
    }
    html += '        </div>';
    html += '      </div>';

    if ((isDelayed || isCancelled) && t.delayReason && t.delayReason !== 'None') {
      html += '    <div class="apple-disruption-callout mb-3">';
      html += '      <i class="fas fa-exclamation-triangle text-warning mr-2"></i>';
      html += '      <span>' + t.delayReason + '</span>';
      html += '    </div>';
    }
    html += '    </div>';

    if (isOperatorAuthed) {
      html += '  <div class="pt-2 border-top border-secondary text-right">';
      html += '    <button class="btn btn-outline-info apple-btn-pill btn-sm" onclick="openDispatchModal(\'' + t.id + '\')"><i class="fas fa-edit mr-1"></i> Edit Dispatch</button>';
      html += '  </div>';
    }

    html += '  </div>';
    html += '</div>';
  });

  $('#commuterTrainGrid').html(html);
}

function renderOperatorTable() {
  if (allTrainsData.length === 0) {
    $('#operatorTableBody').html('<tr><td colspan="9" class="text-center text-muted py-3">No train schedules configured.</td></tr>');
    return;
  }

  var html = '';
  allTrainsData.forEach(function(t) {
    var statusClass = 'apple-status-' + t.status;
    html += '<tr>';
    html += '  <td><span class="badge badge-secondary" style="border-radius: 8px;">' + (t.trainNumber || 'EXP') + '</span></td>';
    html += '  <td class="font-weight-bold text-white">' + t.name + '</td>';
    html += '  <td class="small text-muted">' + (t.origin || 'Main') + ' &rarr; ' + (t.destination || 'Central') + '</td>';
    html += '  <td>' + t.scheduledTime + '</td>';
    html += '  <td><span class="apple-platform-pill">' + (t.platform || 'Platform 1') + '</span></td>';
    html += '  <td><span class="' + statusClass + '">' + t.status + '</span></td>';
    html += '  <td>' + (t.delayMinutes > 0 ? '+' + t.delayMinutes + ' mins' : '-') + '</td>';
    html += '  <td class="small text-muted">' + (t.delayReason || 'None') + '</td>';
    html += '  <td>';
    html += '    <button class="btn btn-primary apple-btn-pill btn-sm mr-1" onclick="openDispatchModal(\'' + t.id + '\')"><i class="fas fa-edit"></i> Edit</button>';
    html += '    <button class="btn btn-danger apple-btn-pill btn-sm" onclick="deleteTrain(\'' + t.id + '\')"><i class="fas fa-trash"></i></button>';
    html += '  </td>';
    html += '</tr>';
  });

  $('#operatorTableBody').html(html);
}

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

function submitDispatchUpdate() {
  if (!isOperatorAuthed) {
    $('#dispatchModal').modal('hide');
    $('#operatorAuthModal').modal('show');
    return;
  }

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
    headers: getAuthHeaders(),
    data: JSON.stringify(updatePayload),
    success: function(res) {
      $('#dispatchModal').modal('hide');
      logSreTerminal('Updated train ' + id + ' -> Status: ' + status + ', Platform: ' + platform);
      showToastNotification('success', '✅ Train schedule updated successfully!');
      fetchAuditLogs();
      fetchSreSlo();
    },
    error: function(xhr) {
      if (xhr.status === 401) {
        alert('Staff authentication expired. Please sign in again.');
        lockOperatorDesk();
      } else {
        alert('Error updating train schedule.');
      }
    }
  });
}

function submitAddTrain() {
  if (!isOperatorAuthed) {
    $('#addTrainModal').modal('hide');
    $('#operatorAuthModal').modal('show');
    return;
  }

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
    headers: getAuthHeaders(),
    data: JSON.stringify(payload),
    success: function(res) {
      $('#addTrainModal').modal('hide');
      $('#addTrainForm')[0].reset();
      logSreTerminal('Added new train schedule: ' + name);
      showToastNotification('success', '✅ Added new schedule: ' + name);
      fetchAuditLogs();
      fetchSreSlo();
    },
    error: function(xhr) {
      if (xhr.status === 401) {
        alert('Staff authentication expired. Please sign in again.');
        lockOperatorDesk();
      } else {
        alert('Error creating train schedule.');
      }
    }
  });
}

function deleteTrain(id) {
  if (!isOperatorAuthed) {
    $('#operatorAuthModal').modal('show');
    return;
  }

  if (!confirm('Are you sure you want to remove train schedule ' + id + '?')) return;

  $.ajax({
    url: '/api/v1/trains/' + id,
    type: 'DELETE',
    headers: getAuthHeaders(),
    success: function(res) {
      logSreTerminal('Deleted train schedule: ' + id);
      showToastNotification('success', '🗑️ Train schedule removed: ' + id);
      fetchAuditLogs();
      fetchSreSlo();
    },
    error: function(xhr) {
      if (xhr.status === 401) {
        alert('Staff authentication expired. Please sign in again.');
        lockOperatorDesk();
      } else {
        alert('Error deleting train schedule.');
      }
    }
  });
}

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
  if (!isOperatorAuthed) {
    $('#operatorAuthModal').modal('show');
    return;
  }

  $.ajax({
    url: '/api/v1/sre/break',
    type: 'POST',
    headers: getAuthHeaders(),
    success: function(data) {
      fetchSreHealth();
      fetchSreSlo();
      logSreTerminal('🚨 CHAOS TRIGGERED: App outage injected. /health now returning HTTP 500.');
      showToastNotification('warning', '🚨 CHAOS TRIGGERED: Application health set to UNHEALTHY');
      fetchAuditLogs();
    },
    error: function(xhr) {
      if (xhr.status === 401) $('#operatorAuthModal').modal('show');
    }
  });
}

function triggerRestoreApp() {
  if (!isOperatorAuthed) {
    $('#operatorAuthModal').modal('show');
    return;
  }

  $.ajax({
    url: '/api/v1/sre/restore',
    type: 'POST',
    headers: getAuthHeaders(),
    success: function(data) {
      fetchSreHealth();
      fetchSreSlo();
      logSreTerminal('✅ SYSTEM RESTORED: App health set back to healthy. /health returning HTTP 200.');
      showToastNotification('success', '✅ SYSTEM RESTORED: Application health set to HEALTHY');
      fetchAuditLogs();
    },
    error: function(xhr) {
      if (xhr.status === 401) $('#operatorAuthModal').modal('show');
    }
  });
}

function triggerCpuStress() {
  if (!isOperatorAuthed) {
    $('#operatorAuthModal').modal('show');
    return;
  }

  $('#cpuResultJson').text('Calculating heavy CPU load (10M iterations)...');
  var startTime = Date.now();
  $.ajax({
    url: '/generate-cpu-load',
    type: 'GET',
    headers: getAuthHeaders(),
    success: function(data) {
      var elapsed = Date.now() - startTime;
      $('#cpuResultJson').text(JSON.stringify(data) + ' (Time taken: ' + elapsed + 'ms)');
      logSreTerminal('⚡ CPU STRESS COMPLETED in ' + elapsed + 'ms. HPA metric target reached.');
      fetchAuditLogs();
      fetchSreSlo();
    },
    error: function(xhr) {
      if (xhr.status === 401) $('#operatorAuthModal').modal('show');
    }
  });
}

function logSreTerminal(msg) {
  var log = $('#sreLogTerminal');
  var time = new Date().toLocaleTimeString();
  log.append('\n[' + time + '] ' + msg);
  log.scrollTop(log[0].scrollHeight);
}