var fs = require('fs');
var buffer = '';

module.exports = function(importIO) {
    console.log("Quikbot.js loaded");
    io = importIO;
};

module.exports.getRedisConfig = function() {
  var data = fs.readFileSync(__dirname + '/conf/redisconf', 'utf8');
  return {host:data.split(',')[0].split(':')[1].trim(), port:data.split(',')[1].split(':')[1].trim(), pass:data.split(',')[2].split(':')[1].trim()};
};

module.exports.getMotd = function(){
  return fs.readFileSync(__dirname + '/branding/motd', 'utf8');
};

module.exports.getGodIps = function(){
  return fs.readFileSync(__dirname + '/conf/godips', 'utf8');
};

module.exports.getNetConfPort = function(){
  return (parseInt(fs.readFileSync(__dirname + '/conf/netconf', 'utf8').split(':')[1]));
};
