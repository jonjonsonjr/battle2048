// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var socket = io.connect('http://battle2048.herokuapp.com/');
  //var socket = io.connect('http://localhost');
  gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager, socket);
  onlineGameManager = new OnlineGameManager(4, HTMLActuator, LocalStorageManager, socket);
});
