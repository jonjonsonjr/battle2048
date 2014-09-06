// module dependencies
var express = require('express');
var http = require('http');
var path = require('path');

// all environments
var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 1000*60*60*24*14 }));

var server = http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var sockets = [];

var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
  if (sockets.length == 2) return;

  console.log(socket.id);

  socket.on('startState', function (data) {
    console.log('startState');
    console.log(data);
    socket.startState = data;
    if (sockets.length == 2) {
      startGame();
    }
  });

  socket.on('move', function (data) {
    console.log('move');
    console.log(data);
    // do something
    var opponent = sockets.filter(function (s) { return s.id != socket.id })[0];
    opponent.emit('move', data);
  });

  socket.on('attack', function () {
    console.log('attack');
    // do something
    var opponent = sockets.filter(function (s) { return s.id != socket.id })[0];
    opponent.emit('attack');
  });

  socket.on('attacked', function (data) {
    console.log('attacked');
    console.log(data);
    // do something
    var opponent = sockets.filter(function (s) { return s.id != socket.id })[0];
    opponent.emit('attacked', data);
  });

  socket.on('disconnect', function () {
    console.log('disconnect');
    sockets = sockets.filter(function (s) { return socket.id !== s.id });
  });

  sockets.push(socket);
});

function startGame() {
  sockets.forEach(function (socket) {
    var opponent = sockets.filter(function (s) { return s.id != socket.id })[0];
    opponent.emit('startState', socket.startState);
  });
}
