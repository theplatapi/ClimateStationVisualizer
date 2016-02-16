var express = require('express');
var app = express();
var http = require("http");
var server = http.createServer(app);
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({server: server});
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer(); // for parsing multipart/form-data
var basicAuth = require('basic-auth-connect');
var winston = require('winston');
var papertrail = require('winston-papertrail').Papertrail;
var port = process.env.PORT || 8080;

var auth = basicAuth(function(user, pass) {
  return (user == "allen" && pass == "thesis");
},'Admin Login');

app.use(express.static('public'));
//app.use('/admin', express.static('admin'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
server.listen(port);
console.log("http server listening on port %d", port);

app.all('/admin', auth);

app.get('/admin', function (req, res) {
  res.sendFile('/public/admin.html', {root: __dirname});
});

winston
  .add(winston.transports.File, {
    name: 'fileLogger',
    filename: 'trial1.log',
    json: false,
    formatter: function (options) {
      return new Date() + '; ' + options.message;
    }
  })
  .add(papertrail, {
    host: 'logs3.papertrailapp.com',
    port: '10066'
  });

wss.on("connection", function (ws) {
  ws.on("message", function (message) {
    winston.log('info', message);
  });

  ws.on("close", function () {
    console.log("websocket connection closed");
  });

  app.post('/admin', upload.array(), function (req, res) {
    var fps = req.body.fps;
    ws.send(fps);
    res.sendFile('/public/admin.html', {root: __dirname});
    res.end();
  });
});