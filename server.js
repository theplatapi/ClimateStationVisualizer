var express = require('express');
var app = express();
var http = require("http");
//var WebSocketServer = require("ws").Server;

var port = process.env.PORT || 8080;

app.use(express.static('public'));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening at localhost:%d", port);


//var wss = new WebSocketServer({server: server});
//console.log("websocket server created");
//
//wss.on("connection", function (ws) {
//  var id = setInterval(function () {
//    ws.send(JSON.stringify(new Date()), function () {
//    })
//  }, 1000);
//
//  console.log("websocket connection open");
//
//  ws.on("close", function () {
//    console.log("websocket connection close");
//    clearInterval(id);
//  })
//});