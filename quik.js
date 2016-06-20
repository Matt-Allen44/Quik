var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/quik.html');
});

http.listen(80, function(){
	console.log('Launched Quik on :80')
});


/*
	ON CONNECTION
*/
io.on('connection', function(socket){
	console.log('> Connection');

	socket.on('disconnect', function(){
		console.log('> Disconnected')
	})

	socket.on('chat message', function(msg){
		console.log('> ' + msg)
		io.emit('chat message', msg)
	})
});
