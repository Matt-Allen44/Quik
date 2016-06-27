var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sanitizeHtml = require('sanitize-html');

app.get('/css/quik.css', function(req, res){
	res.sendFile(__dirname + '/css/quik.css'); //CHANGE TO QUIK.HTML LATER
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/chat.html'); //CHANGE TO QUIK.HTML LATER
});

http.listen(80, function(){
	console.log('Launched Quik on :80')
});

usrs_connected = 0;


/*
	ON CONNECTION
*/
	io.on('connection', function(socket){
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
				console.log('> ' + msg.replace("--DELIM--", ":"))
				io.emit('chat message', msg)
			}
		})
});