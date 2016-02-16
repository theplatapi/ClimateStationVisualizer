var express = require('express');
var app = express();
var http = require("http");
var WebSocketServer = require("ws").Server;

var port = process.env.PORT || 8080;

app.use(express.static('public'));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening at localhost:%d", port);


var wss = new WebSocketServer({server: server});

wss.on("connection", function (ws) {
  ws.on("message", function (message) {
    console.log(message);
    ws.send("30");
  });

  ws.on("close", function () {
    console.log("websocket connection close");
  })
});