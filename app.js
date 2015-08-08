var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var config = require(__dirname+'/config');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require("path");
var os = require('os');
var exec = require('child_process').exec;
var child;


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

function getScreen(){
  child = exec(__dirname+'/nircmd.fbi savescreenshot www/images/screen.png',
    function (error, stdout, stderr) {
      io.sockets.emit('showscreen');
      setTimeout(getScreen, config.timeGetScreen);
  });
}

getScreen();

//Socket
io.on('connection', function (socket) {});

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

function dirTree(filename) {
    var stats = fs.lstatSync(filename),
        info = {
            path: filename,
            name: path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
            return dirTree(filename + '/' + child);
        });
    } else {
        info.type = "file";
        fs.watchFile(filename, function (curr, prev) {
		  	io.sockets.emit('filechange', { filename: filename });
		});
    }

    return info;
}

var port = process.env.PORT || config.app.port;
process.setMaxListeners(0);
var FRONTEND_PATH = __dirname+'/www';
app.use(express.static(FRONTEND_PATH));

app.get('/', function(req, res) {
	res.sendfile(FRONTEND_PATH+'/index.html');
});
app.post('/getfiles', function(req, res){
  if(config.dirlist){
    res.jsonp(dirTree(config.dirlist));
  } else {
    res.jsonp({});
  }
});
app.post('/getfile', function(req, res){
	if(req.body.file){
		res.sendfile(req.body.file);
	} else {
		res.send("");
	}
});
app.get('/getfile', function(req, res){
  if(req.query.file){
    res.sendfile(req.query.file);
  } else {
    res.send("");
  }
});

server.listen(port);
console.log('\n\nShowMyFiles rorando na porta: ' + port);
console.log('\nIP para conexão direta:');
//Pega ip da maquina
var ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
  });
});

