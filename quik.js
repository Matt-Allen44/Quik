var quik = require('express')();
var http = require('http').Server(quik);
var io = require('socket.io')(http);
var sanitizeHtml = require('sanitize-html');
var geoip = require('geoip-lite');
var swearjar = require('swearjar');
var os = require('os');
var winston = require('winston');
var util = require('util');
var clients = [];
var usrs_connected = 0;
var log = '';
var whitelistip = '121.45.31.204';
// Called on all quik requests
quik.use(function (req, res, next) {
  qLog('Server Request', util.format('%s %s %s', req.connection.remoteAddress, req.method, req.url));
  next();
});
quik.get('/css/quik.css', function (req, res) {
  res.sendFile(__dirname + '/css/quik.css');
});
quik.get('/branding/favicon.ico', function (req, res) {
  res.sendFile(__dirname + '/branding/favicon.ico');
});
/* Dashboard info */
quik.get('/dash/sysdat', function (req, res) {
  if (req.connection.remoteAddress == whitelistip) {
    if (process.platform === 'win32') {
      res.send('501 Not Implemented (SYSDAT NOT SUPPORTED ON WINDOWS)');
    } else {
      res.send('200 OK');
    }
  } else {
    res.end('403 Unauthorised');
  }
});
quik.get('/dash/usrdat', function (req, res) {
  if (req.connection.remoteAddress == whitelistip) {
    res.send(clients.toString());
  } else {
    res.end('403 Unauthorised');
  }
});
quik.get('/dash/logdat', function (req, res) {
  if (req.connection.remoteAddress == whitelistip) {
    res.send(log);
  } else {
    res.end('403 Unauthorised');
  }
});
/* Branding related requests */
quik.get('/branding/logo.png', function (req, res) {
  res.sendFile(__dirname + '/branding/logo.png');
});
quik.get('/branding/theme', function (req, res) {
  res.sendFile(__dirname + '/branding/theme');
});
/* End of branding related requests */
quik.get('/', function (req, res) {
  res.sendFile(__dirname + '/chat.html');
});
quik.get('/firebase', function (req, res) {
  res.sendFile(__dirname + '/firebase.html');
});
quik.get('/dash', function (req, res) {
  if (req.connection.remoteAddress == whitelistip) {
    res.sendFile(__dirname + '/dash.html');
  } else {
    res.end('403 Unauthorised');
  }
});
quik.get('/notify.mp3', function (req, res) {
  res.sendFile(__dirname + '/notify.mp3');
});
//The 404 Route (ALWAYS Keep this as the last route)
quik.get('*', function (req, res) {
  res.status(404);
  res.sendFile(__dirname + '/404.html');
});
http.listen(80, function () {
  qLog('Server Log', 'Quick Started, this application is protected by the Apache 2.0 License - hack on the source at github.com/matt-allen44/quik');
  qLog('Server Log', 'Started on :80');
});
/*
	ON CONNECTION
*/
io.on('connection', function (socket) {
  socket.emit('chat message', 'Notice --DELIM-- Connection established');
  socket.emit('chat message', 'Notice --DELIM-- This application is released under the Apache 2.0 License, hack on the source at https://github.com/Matt-Allen44/Quik');
  socket.emit('chat message', 'Notice --DELIM-- This chat room is logged and users must comply with the TOS');
  clients.push([
    socket.id,
    socket.conn.remoteAddress,
    ipLookup(socket.conn.remoteAddress).region,
    ipLookup(socket.conn.remoteAddress).country,
    Math.floor(new Date() / 1000)
  ]);
  usrs_connected = usrs_connected + 1;
  io.emit('connectEvent', usrs_connected);
  socket.on('disconnect', function () {
    usrs_connected = usrs_connected - 1;
    qLog('chatlog', usrs_connected + ' users connected');
    io.emit('disconnectEvent', usrs_connected);
  });
  socket.on('chat message', function (msg) {
    msg = sanitizeHtml(msg);
    //Check if users name is empty
    if (msg.split('--DELIM--')[0].length === 0) {
      socket.emit('chat message', 'Server --DELIM-- Connection Refused (invalid name)');
      socket.emit('chat message', 'Server --DELIM-- Your IP (' + socket.conn.remoteAddress + ') has been logged.');
      socket.disconnect();
    }
    //Check if users name is too llong
    if (msg.split('--DELIM--')[0].length > 10) {
      socket.emit('chat message', 'Server --DELIM-- Connection Refused (name to long)');
      socket.emit('chat message', 'Server --DELIM-- Your IP (' + socket.conn.remoteAddress + ') has been logged.');
      socket.disconnect();
    }
    if (0 === msg.length) {
      socket.emit('chat message', 'Server --DELIM-- Empty message removed');
      qLog('chatlog', 'empty message removed');
    } else {
      qLog('chatlog', socket.conn.remoteAddress + ' [' + ipLookup(socket.conn.remoteAddress).city + '] ' + msg.replace('--DELIM--', ':'));
      io.emit('chat message', swearjar.censor(msg));
    }
  });
});
function ipLookup(ip) {
  if (ip == '127.0.0.1' || ip == 'localhost' || ip == '::1') {
    var array = {
      city: 'Local Client',
      region: 'Local Client',
      country: 'Local Client'
    };
    return array;
  } else {
    qLog(ip);
    return geoip.lookup(ip);
  }
}
winston.add(winston.transports.File, { filename: 'quik.log' });
function qLog(type, msg) {
  msg = new Date() + msg;
  console.log('[' + type + '] ' + msg);
  log += '[' + type + '] ' + msg + '\n';
  winston.log(type, msg);
}