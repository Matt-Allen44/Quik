var io;
module.exports = function(importIO) {
    console.log("Quikbot.js loaded")
    io = importIO;
}


module.exports.broadcast = function(text) {
  console.log("Emitting")
  io.emit('chat message', "Quikbot", text);
};

module.exports.test = function(){
  console.log("test");
}
