var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sanitizeHtml = require('sanitize-html');
var geoip = require('geoip-lite');
var swearjar = require('swearjar');

app.get('/css/quik.css', function(req, res){
	res.sendFile(__dirname + '/css/quik.css');
});

app.get('/branding/favicon.ico', function(req, res){
	res.sendFile(__dirname + '/branding/favicon.ico');
});

/* Branding related requests */

app.get('/branding/logo.png', function(req, res){
	res.sendFile(__dirname + '/branding/logo.png');
});

app.get('/branding/theme', function(req, res){
	res.sendFile(__dirname + '/branding/theme');
});

/* End of branding related requests */

app.get('/', function(req, res){
	res.sendFile(__dirname + '/chat.html');
});

app.get('/firebase', function(req, res){
	res.sendFile(__dirname + '/firebase.html');
});

var clients = [];
app.get('/dashboard', function(req, res){
	res.end("Open Sockets: " + clients.length)
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
	console.log("404")
	res.status(404);
  	res.sendFile(__dirname + '/404.html');
});


http.listen(80, function(){
	console.log('Launched Quik on :80')
});

usrs_connected = 0;


/*
	ON CONNECTION
*/
	io.on('connection', function(socket){
		socket.emit('chat message', 'Notice --DELIM-- Connection established')
		socket.emit('chat message', "Notice --DELIM-- This application is released under the Apache 2.0 License, hack on the source at https://github.com/Matt-Allen44/Quik")
		socket.emit('chat message', 'Notice --DELIM-- This chat room is logged and users must comply with the TOS')

		clients.push(socket)
		usrs_connected = usrs_connected+1;
		io.emit('connectEvent', usrs_connected)

		socket.on('disconnect', function(){
			usrs_connected = usrs_connected-1;
			console.log(usrs_connected + ' users connected')
			io.emit('disconnectEvent', usrs_connected)
		})

			socket.on('chat message', function(msg){
  			msg = sanitizeHtml(msg)

  			//Check if users name is empty
  			if(msg.split("--DELIM--")[0].length === 0){
  				socket.emit('chat message', "Server --DELIM-- Connection Refused (invalid name)")
  				socket.emit('chat message',  "Server --DELIM-- Your IP (" + socket.conn.remoteAddress + ") has been logged.")
  				socket.disconnect();
  			}

  			//Check if users name is too llong
  			if(msg.split("--DELIM--")[0].length > 10){
  				socket.emit('chat message', "Server --DELIM-- Connection Refused (name to long)")
  				socket.emit('chat message',  "Server --DELIM-- Your IP (" + socket.conn.remoteAddress + ") has been logged.")
  				socket.disconnect();
  			}


  			if(0 === msg.length){
  				socket.emit('chat message', "Server --DELIM-- Empty message removed")
  				console.log("> empty message removed")
  			} else {
  				console.log(socket.conn.remoteAddress + " [" + /*geoip.lookup(socket.conn.remoteAddress)["city"] +*/ "] " + msg.replace("--DELIM--", ":"))
  				io.emit('chat message', swearjar.censor(msg))
  			}
		})
});
