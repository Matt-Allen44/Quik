var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/chat.html'); //CHANGE TO QUIK.HTML LATER
});

http.listen(80, function(){
	console.log('Launched Quik on :80')
});

usrs_connected = -1;


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
		console.log('> ' + msg)
		io.emit('chat message', msg)
	})
});
