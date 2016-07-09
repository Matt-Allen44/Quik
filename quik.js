var quik = require('express')();
var http = require('http').Server(quik);
var https = require('https').Server(quik);
var io = require('socket.io')(http);
var sanitizeHtml = require('sanitize-html');
var geoip = require('geoip-lite');
var swearjar = require('swearjar');
var os = require('os');
var winston = require('winston');
var util = require('util');
var helmet = require('helmet');
var csp = require('helmet-csp');
var clients = [];
var userIDs = [];
var users = [];
var banlist = [];
var godlist = "";
var usrs_connected = 0;
var log = '';
var whitelistip = '121.45.31.204';
// Called on all quik requests

quik.use(helmet());
quik.use(csp({
  // Specify directives as normal.
  directives: {
    defaultSrc: ["'self'", 'groms.xyz'],
    scriptSrc: ["'self'", "'unsafe-inline'", "ejci.net", 'cloudflare.com','github.io','gstatic.com','google-analytics.com'],
    styleSrc: ['groms.xyz','cloudflare.com'],
    imgSrc: ['groms.xyz', 'data:'],
    sandbox: ['allow-forms', 'allow-scripts'],
    reportUri: '/report-violation',

    objectSrc: [], // An empty array allows nothing through
  },

  // Set to true if you only want browsers to report errors, not block them.
  // You may also set this to a function(req, res) in order to decide dynamically
  // whether to use reportOnly mode, e.g., to allow for a dynamic kill switch.
  reportOnly: false,

  // Set to true if you want to blindly set all headers: Content-Security-Policy,
  // X-WebKit-CSP, and X-Content-Security-Policy.
  setAllHeaders: true,

  // Set to true if you want to disable CSP on Android where it can be buggy.
  disableAndroid: false,

  // Set to false if you want to completely disable any user-agent sniffing.
  // This may make the headers less compatible but it will be much faster.
  // This defaults to `true`.
  browserSniff: true
}));
quik.use(function (req, res, next) {
  qLog('Server Request', util.format('%s %s %s', req.connection.remoteAddress, req.method, req.url));
  if(banlist.indexOf(req.connection.remoteAddress) > -1){
    qLog('Server Request', util.format('%s %s %s', req.connection.remoteAddress, req.method, req.url) + " access denied - IP Ban");
    res.status(403);
    res.sendFile(__dirname + '/ipban.html');
  } else {
    next();
  }
});
quik.get('/css/quik.css', function (req, res) {
  res.sendFile(__dirname + '/css/quik.css');
});
quik.get('/branding/favicon.ico', function (req, res) {
  res.sendFile(__dirname + '/branding/favicon.ico');
});
/* Dashboard info */
quik.get('/dash/sysdat', function (req, res) {
  if(godlist == req.connection.remoteAddress){
    if (process.platform === 'win32') {
      res.send('501 Not Implemented (SYSDAT NOT SUPPORTED ON WINDOWS)');
    } else {
      res.send('200 OK');
    }
  } else {
    res.status(403);
    res.sendFile(__dirname + '/ipban.html');
  }
});
quik.get('/dash/usrdat', function (req, res) {
  if(godlist == req.connection.remoteAddress){
    res.send(clients.toString());
  } else {
    res.status(403);
    res.sendFile(__dirname + '/ipban.html');
  }
});
quik.get('/dash/logdat', function (req, res) {
  if(godlist == req.connection.remoteAddress){
    res.send(log);
  } else {
    res.status(403);
    res.sendFile(__dirname + '/ipban.html');
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
  if(godlist == req.connection.remoteAddress){
    res.sendFile(__dirname + '/dash.html');
  } else {
    qLog("403 Logs", ("Denied " + req.connection.remoteAddress));
    res.status(403);
    res.sendFile(__dirname + '/ipban.html');
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

var motd = "";
var fs = require('fs');
fs.readFile(__dirname + "/branding/motd", 'utf8', function(err, data) {
  if (err) throw err;
  motd = data;
});

fs.readFile(__dirname + "/conf/godips", 'utf8', function(err, data) {
  if (err) throw err;
  godlist = data.trim();
  qLog('Server Log', "Loaded god ips: " + godlist);
});

var privateKey = fs.readFileSync( '/etc/letsencrypt/live/groms.xyz/privkey.pem' );
var certificate = fs.readFileSync( '/etc/letsencrypt/live/groms.xyz/cert.pem' );

http.listen(80, function () {
  qLog('Server Log', 'Quick Started, this application is protected by the Apache 2.0 License - hack on the source at github.com/matt-allen44/quik');
  qLog('Server Log', 'Started on :80');
});
https.createServer({
    key: privateKey,
    cert: certificate
}, quik).listen(443);

/*
	ON CONNECTION
*/
io.on('connection', function (socket) {
  socket.emit('chat message', 'Notice', 'Connection established');
  socket.emit('chat message', 'Notice', 'This application is released under the Apache 2.0 License, hack on the source at https://github.com/Matt-Allen44/Quik');
  socket.emit('chat message', 'Notice', motd);
  usrs_connected = usrs_connected + 1;

  socket.on('disconnect', function () {
    usrs_connected = usrs_connected - 1;
    qLog('chatlog', usrs_connected + ' users connected');
    io.emit('disconnectEvent', getUsername(socket.id), usrs_connected);
    //clients.splice(userIDs[socket.id], 1);
    //userIDs.splice(socket.id, 1);
  });
  socket.on('ban', function (ip) {
    banIP(ip);
    socket.emit('chat message', 'Server', "the ip " + ip + " has been permanently banned.");
  });
  socket.on('chat message', function (msg) {
    usr = getUsername(socket.id);
    msg = sanitizeHtml(msg);
    //Check if users name is empty
    if (msg.split('--DELIM--')[0].length === 0) {
      socket.emit('chat message', 'Server', 'Connection Refused (invalid name)');
      socket.emit('chat message', 'Server', 'Your IP (' + socket.conn.remoteAddress + ') has been logged.');
      socket.disconnect();
    }
    //Check if users name is too llong
    if (msg.split('--DELIM--')[0].length > 10) {
      socket.emit('chat message', 'Server', 'Connection Refused (name to long)');
      socket.emit('chat message', 'Server', '(' + socket.conn.remoteAddress + ') has been logged.');
      socket.disconnect();
    }
    if (0 === msg.length) {
      socket.emit('chat message', 'Server', 'Empty message removed');
      qLog('chatlog', 'empty message removed');
    } else {
      qLog('chatlog', socket.conn.remoteAddress + ' [' + ipLookup(socket.conn.remoteAddress).city + '] ' + msg);
      io.emit('chat message', usr, swearjar.censor(msg));
    }
  });
  //Seters and getters for usernames
  socket.on('set username', function (name) {
    name = sanitizeHtml(name);
    setUsername(socket.id, name, socket);

    io.emit('on user connect', name);
    io.emit('connectEvent', getUsername(socket.id), usrs_connected);
  });
  socket.on('get username', function (socketID) {
    socketID = sanitizeHtml(socketID);
    getUsername(socket.id);
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
    return geoip.lookup(ip);
  }
}

var clientid = 0;
function setUsername(socketID, name, socket){
  if(typeof users[socketID] === 'undefined'){
    qLog('chatlog', socketID + " set username to " + name);
    users[socketID] = name;
    userIDs[socketID] = clientid;

    console.log("updated client list");
    clients[clientid] = ([
      socket.id,
      getUsername(socket.id),
      socket.conn.remoteAddress,
      ipLookup(socket.conn.remoteAddress).region,
      ipLookup(socket.conn.remoteAddress).country,
      Math.floor(new Date() / 1000),
      clientid
    ]);
    clientid++;
  } else {
    qLog('chatlog', socketID + " could not set username to " + name + " as they already have a username of " + users[socketID]);
  }
}
function getUsername(socketID){
  if(typeof users[socketID] === 'undefined'){
    qLog('chatlog', "could not get username of " + socketID);
  } else {
    qLog('chatlog', "succesfully got useranem of " + socketID + " - " + users[socketID]);
    return users[socketID];
  }
}
function banIP(user, ip){
  qLog('adminlog', "IP banned " + ip);
  io.emit("chat message", "Server", ip + " has been banned.");
  banlist.push(ip);
}
winston.add(winston.transports.File, { filename: 'quik.log' });
function qLog(type, msg) {
  msg = new Date() + msg;
  console.log('[' + type + '] ' + msg);
  log += '[' + type + '] ' + msg + '\n';
  winston.log(type, msg);
}
