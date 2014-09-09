// module dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var uuid = require('node-uuid');
var exphbs = require('express-handlebars');

var rooms = [];

// all environments
var app = express();
app.set('port', process.env.PORT || 3000);
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/room/:id', function (req, res) {
  res.render('index.handlebars', {
    id: req.params.id,
    url: 'http://' + req.host
  });
});

app.post('/room', function (req, res) {
  // create a new room
  var id = uuid.v4();
  rooms.push({
    id: id,
    sockets: []
  });
  res.redirect('/room/' + id);
});

var server = http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {

  socket.on('join', function (data) {
    console.log('join');

    if (!data.room) return;

    var room = rooms.filter(function (r) { return r.id === data.room })[0];

    if (!room) return;

    var sockets = room.sockets;

    // TODO: push to spectator mode instead of just returning
    if (sockets.length == 2) return;

    socket.on('startState', function (data) {
      console.log('startState');
      console.log(data);
      socket.startState = data;
      if (sockets.length == 2) {
        startGame(sockets);
      }
    });

    socket.on('move', function (data) {
      console.log('move');
      console.log(data);
      // do something
      var opponent = sockets.filter(function (s) { return s.id !== socket.id })[0];
      opponent.emit('move', data);
    });

    socket.on('attack', function () {
      console.log('attack');
      // do something
      var opponent = sockets.filter(function (s) { return s.id !== socket.id })[0];
      opponent.emit('attack');
    });

    socket.on('attacked', function (data) {
      console.log('attacked');
      console.log(data);
      // do something
      var opponent = sockets.filter(function (s) { return s.id !== socket.id })[0];
      opponent.emit('attacked', data);
    });

    socket.on('disconnect', function () {
      console.log('disconnect');
      sockets = sockets.filter(function (s) { return socket.id !== s.id });
    });

    sockets.push(socket);
  });
});

function startGame(sockets) {
  console.log('starting game');
  sockets.forEach(function (socket) {
    var opponent = sockets.filter(function (s) { return s.id !== socket.id })[0];
    opponent.emit('startState', socket.startState);
  });
}
