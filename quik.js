var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/chat.html'); //CHANGE TO QUIK.HTML LATER
});

http.listen(80, function(){
	console.log('Launched Quik on :80')
});


/*
	ON CONNECTION
*/
io.on('connection', function(socket){
	console.log('> Connection');
	io.emit('chat message', msg)

	socket.on('disconnect', function(){
		console.log('> Disconnected')
		io.emit('chat message', msg)
	})

	socket.on('chat message', function(msg){
		console.log('> ' + msg)
		io.emit('chat message', msg)
	})
});
