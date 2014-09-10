// module dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var uuid = require('node-uuid');
var hogan = require('hogan-middleware');

var rooms = [];

for (var i = 1; i <= 10; i++) {
  rooms.push({
    public: true,
    id: i.toString(),
    sockets: []
  });
}

// all environments
var app = express();
app.set('port', process.env.PORT || 3000);
app.engine('mustache', hogan.__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'mustache');
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  var public = rooms.filter(function (r) { return r.public });
  var sorted = public.sort(function (a, b) { return parseInt(a.id) > parseInt(b.id) });
  var open = sorted.filter(function (r) { return r.sockets.length < 2 });

  res.render('home', {
    rooms: open
  });
});

app.get('/room/:id', function (req, res) {
  var room = rooms.filter(function (r) { return r.id === req.params.id })[0];

  if (!room) return;
  if (room.sockets.length === 2) return;

  res.render('index', {
    id: req.params.id,
    url: 'http://' + req.host
  });
});

app.post('/room', function (req, res) {
  // create a new room
  var id = uuid.v4();
  rooms.push({
    public: false,
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

    // TODO: push to spectator mode instead of just returning
    if (room.sockets.length == 2) return;

    socket.on('startState', function (data) {
      console.log('startState');
      console.log(data);
      socket.startState = data;
      if (room.sockets.length == 2) {
        startGame(room.sockets);
      }
    });

    socket.on('move', function (data) {
      console.log('move');
      console.log(data);
      // do something
      var opponent = room.sockets.filter(function (s) { return s.id !== socket.id })[0];
      opponent.emit('move', data);
    });

    socket.on('attack', function () {
      console.log('attack');
      // do something
      var opponent = room.sockets.filter(function (s) { return s.id !== socket.id })[0];
      opponent.emit('attack');
    });

    socket.on('attacked', function (data) {
      console.log('attacked');
      console.log(data);
      // do something
      var opponent = room.sockets.filter(function (s) { return s.id !== socket.id })[0];
      opponent.emit('attacked', data);
    });

    socket.on('disconnect', function () {
      console.log('disconnect');
      room.sockets = room.sockets.filter(function (s) { return socket.id !== s.id });
      rooms = rooms.filter(function (r) { return r.id !== room.id });
      rooms.push(room);
    });

    room.sockets.push(socket);
  });
});

function startGame(sockets) {
  console.log('starting game');
  sockets.forEach(function (socket) {
    var opponent = sockets.filter(function (s) { return s.id !== socket.id })[0];
    opponent.emit('startState', socket.startState);
  });
}
