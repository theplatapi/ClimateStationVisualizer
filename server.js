var express = require('express');
var app = express();
var http = require("http");
var server = http.createServer(app);
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({server: server});
var path = require('path');
var serveIndex = require('serve-index');
var net = require('net');

var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer(); // for parsing multipart/form-data
var basicAuth = require('basic-auth-connect');

var winston = require('winston');
var papertrail = require('winston-papertrail').Papertrail;
var port = process.env.PORT || 8080;
var _ = require('lodash');
var moment = require('moment');

var tcpSocket = new net.Socket();
var webSocket;
var clientConnected = false;
var logPath = path.join(__dirname, '/admin/log/');
var fileSettings = {
  name: 'fileLogger',
  filename: path.join(logPath, 'test.log'),
  json: false,
  formatter: function (options) {
    return moment().format('M/D/YYYY, h:mm:ss:SSS') + '; ' + options.message;
  }
};

var auth = basicAuth(function (user, pass) {
  return (user == "allen" && pass == "thesis");
}, 'Admin Login');

server.listen(port);
console.log("http server listening on port %d", port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Serve files
app.use(express.static('public'));
app.use('/admin/log', auth, express.static('admin/log'), serveIndex(logPath, {icons: true, view: 'details'}));

app.all('/admin', auth);
app.get('/admin', function (req, res) {
  res.sendFile('/public/admin.html', {root: __dirname});
});

//Process admin panel commands
app.post('/admin', upload.array(), function (req, res) {
  var fps = req.body.fps;
  var logname = req.body.logname;
  var port = req.body.port;
  var end = req.body.end;

  if (fps) {
    if (clientConnected) {
      webSocket.send(fps);
      winston.log('info', fps);
      tcpSocket.write(fps);
    }
    else {
      res.send('fail');
    }
  }
  else if (logname) {
    winston
      .remove('fileLogger')
      .log('info', logname)
      .add(winston.transports.File, _.extend(fileSettings, {
        filename: path.join(logPath, logname)
      }));
  }
  else if (port) {
    tcpSocket.connect(port, '0.tcp.ngrok.io');
  }
  else if (end) {
    tcpSocket.destroy();
    winston.log('info', 'END');
  }

  res.end();
});

winston
  .add(papertrail, {
    host: 'logs3.papertrailapp.com',
    port: '10066'
  })
  .add(winston.transports.File, fileSettings)
  .remove(winston.transports.Console);

wss.on("connection", function (ws) {
  if (!clientConnected) {
    clientConnected = true;
    webSocket = ws;
  }

  ws.on("message", function (message) {
    winston.log('info', message);
  });

  ws.on("close", function () {
    clientConnected = false;
  });
});