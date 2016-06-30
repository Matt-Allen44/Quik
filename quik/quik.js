var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sanitizeHtml = require('sanitize-html');
var geoip = require('geoip-lite');

app.get('/css/quik.css', function(req, res){
	res.sendFile(__dirname + '/css/quik.css');
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/chat.html');
});

var clients = [];
app.get('/clients', function(req, res){
	res.end("Open Sockets: " + clients.length)
});



http.listen(80, function(){
	console.log('Launched Quik on :80')
});

usrs_connected = 0;


/*
	ON CONNECTION
*/
	io.on('connection', function(socket){
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
				console.log(socket.conn.remoteAddress + " [" + geoip.lookup(socket.conn.remoteAddress)["city"] + "] " + msg.replace("--DELIM--", ":"))
				io.emit('chat message', msg)
			}
		})
});
