var express = require('express');
var app = express();

// Define Static path for User images
app.use('/img', express.static(__dirname + '/assets/img'));

var http = require('http').Server(app);
var io = require('socket.io')(http);

// Pretty Console Colors :D
var color = require('colors');

// Used For loading and saving JSON
var fs = require('fs');

var logFile = './logs/server.log';

var msgFile = './assets/json/messages.json';
var messageJSON = '';

var groupsFile = './assets/json/groups.json';
var groupsJSON = '';

var usersFile = './assets/json/users.json';
var usersJSON = '';

fs.readFile(msgFile, 'utf8', function (err, data) {
    if (err) throw err;
    messageJSON = JSON.parse(data);
});

fs.readFile(groupsFile, 'utf8', function (err, data) {
    if (err) throw err;
    groupsJSON = JSON.parse(data);
});

fs.readFile(usersFile, 'utf8', function (err, data) {
    if (err) throw err;
    usersJSON = JSON.parse(data);
});

// Handle Get Requests
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// CSS
app.get('/assets/style', function(req, res){
	res.sendFile(__dirname + '/assets/css/style.css');
});

// JS
app.get('/assets/client', function(req, res){
	res.sendFile(__dirname + '/assets/js/client.js');
});

var allClients = [];

io.on('connection', function(socket) {
  Log('SERVER', 'A user has connected');
  allClients.push(socket);

	//User disconnected
  socket.on('disconnect', function() {
    var i = allClients.indexOf(socket);
    Log('SERVER', allClients[i].name + ' has disconnected');
    io.emit('userDisconnected', allClients[i].name);
    allClients.splice(i, 1);
  });

	// Handle incoming chat messages
	socket.on('sendMessage', function(user, msg, grp, time) {
    Log('MESSAGE', '[' + grp.cyan + '] <' + user.green + '> ' + msg);

  	var temp = time.split(' ');
  	var tempTime = temp[4].split(':');
  	var timeStamp = temp[1] + ' ';

    // Add ending to day
    if(temp[2] == 1 || temp[2] == 21 || temp[2] == 31) {
      temp[2] += 'st ';
    } else if(temp[2] == 2 || temp[2] == 22) {
      temp[2] += 'nd ';
    } else if(temp[2] == 3 || temp[2] == 23) {
      temp[2] += 'rd ';
    } else {
      temp[2] += 'th ';
    }

    timeStamp += temp[2];

  	// Format date string to our liking
  	if(parseInt(tempTime[0]) == 0) {
  		tempTime[0] = 12;
  		timeStamp += tempTime[0] + ':' + tempTime[1] + 'AM';
  	} else if (parseInt(tempTime[0]) == 12) {
  		tempTime[0] = 12;
  		timeStamp += tempTime[0] + ':' + tempTime[1] + 'PM';
  	} else if (parseInt(tempTime[0]) > 12) {
  		tempTime[0] = (parseInt(tempTime[0]) - 12);
  		timeStamp += tempTime[0] + ':' + tempTime[1] + 'PM';
  	} else if (parseInt(tempTime[0]) < 12) {
      timeStamp += tempTime[0] + ':' + tempTime[1] + 'AM';
    }

    // Append new message
    messageJSON.messages.push({name:user, message:msg, group:grp, timeStamp:timeStamp});

    // Write messages to JSON file
    fs.writeFile(msgFile, JSON.stringify(messageJSON), function (err) {
			if (err) return Log('ERROR', err);
		});

      // Reload message JSON
      reloadMessages();

      reloadUsers();
      var img = '';
      for(var x=0; x < usersJSON.users.length; x++) {
        if(usersJSON.users[x].name == user) {
            img = usersJSON.users[x].img;
        }
      }

  	  // Send message
  	  io.emit('sendMessage', user, img, msg, grp, timeStamp);
  });

    

	// Handle laoding chat messages
	socket.on('loadMessages', function(user){
    reloadUsers();
		reloadMessages();
    reloadUsers();

    // Create array of messages
		var users = [];
    var images = [];
  	var messages = [];
    var groups = [];
    var times = [];
    var availGroups = [];

  	for(var x=0; x < messageJSON.messages.length; x++) {
  		users.push(messageJSON.messages[x].name);
  		messages.push(messageJSON.messages[x].message);
      groups.push(messageJSON.messages[x].group);
      times.push(messageJSON.messages[x].timeStamp);
  	}

  	for(var x=0; x < groupsJSON.groups.length; x++) {
  		availGroups.push(groupsJSON.groups[x].name)
  	}

    for(var x=0; x < usersJSON.users.length; x++) {
      images.push(usersJSON.users[x].name + '*' + usersJSON.users[x].img)
    }

  	// Send messages back to client
  	io.emit('loadMessages', users, images, messages, availGroups, groups, times, user);

  	Log('SERVER', '<' + user.green + '> loaded messages from the server')
	});

  // Handle User Info request
  socket.on('requestUserInfo', function(user) {
    reloadUsers();
    var i = allClients.indexOf(socket);
    allClients[i].name = user;

    var found = false;
    var id = 0;
    for(var x=0; x < usersJSON.users.length; x ++) {
      if(usersJSON.users[x].name == user) {
        usersJSON.users[x].online = '1';
        id = x;
        found = true;
      }
    }

    // Create new user if they don't exist
    if(!found) {
      usersJSON.users.push({name:user, online:'1', img:'http://placehold.it/45X45'})
      Log('SERVER', 'Created new user <' + user.green + '>')
    }

    // Write to JSON file
    fs.writeFile(usersFile, JSON.stringify(usersJSON), function (err) {
        if (err) return Log('ERROR', err);
    });

    // Send user info back to client
    socket.emit('requestUserInfo' , usersJSON.users[id].online, usersJSON.users[id].img);

  });

	// Handle incoming group requests
	socket.on('loadGroups', function(user){
    reloadGroups();
		// Create array of messages
  	var groups = [];
  	for(var x=0; x < groupsJSON.groups.length; x++) {
  		groups.push(groupsJSON.groups[x].name + '*' + groupsJSON.groups[x].members);
  	}

  	// Send messages back to client
  	io.emit('loadGroups', groups, user);

  	Log('SERVER', '<' + user.green + '> loaded groups from the server')
	});

  // Update online status
  socket.on('updateOnlineStatus', function(){
    reloadUsers();
    reloadGroups();

    var users = [];
    var online = [];
    var groups = [];

    for(var x=0; x < groupsJSON.groups.length; x++) {
      groups.push(groupsJSON.groups[x].name + '*' + groupsJSON.groups[x].members);
    }

    for(var x=0; x < usersJSON.users.length; x++) {
      users.push(usersJSON.users[x].name);
      online.push(usersJSON.users[x].online);
    }
    io.emit('updateOnlineStatus', users, online, groups);
  });

  // Update online status
  socket.on('userDisconnected', function(name){
    reloadUsers();
    reloadGroups();

    for(var x=0; x < usersJSON.users.length; x++) {
      if(usersJSON.users[x].name == name) {
        usersJSON.users[x].online = '0';
      }
    }

    // Write to JSON file
    fs.writeFile(usersFile, JSON.stringify(usersJSON), function (err) {
        if (err) return Log('ERROR', err);
    });

    var users = [];
    var online = [];
    var groups = [];

    for(var x=0; x < groupsJSON.groups.length; x++) {
      groups.push(groupsJSON.groups[x].name + '*' + groupsJSON.groups[x].members);
    }

    for(var x=0; x < usersJSON.users.length; x++) {
      users.push(usersJSON.users[x].name);
      online.push(usersJSON.users[x].online);
    }
    
    io.emit('updateOnlineStatus', users, online, groups);
  });
});



// Start Webserver
http.listen(6288, function(){
	Log('SERVER','Matt-Chat'.rainbow + ' started on port 6288');
});

function reloadMessages() {
  fs.readFile(msgFile, 'utf8', function (err, data) {
      if (err) return Log('ERROR', err);
      messageJSON = JSON.parse(data);
  });
}

function reloadGroups() {
	fs.readFile(groupsFile, 'utf8', function (err, data) {
      if (err) return Log('ERROR', err);
    groupsJSON = JSON.parse(data);
  });
}

function reloadUsers() {
  fs.readFile(usersFile, 'utf8', function (err, data) {
      if (err) return Log('ERROR', err);
    usersJSON = JSON.parse(data);
  });
}

function Log(type, msg) {

  // var logStream = '';

	if(type == 'SERVER') {
    // logStream += '[SERVER]: ' + msg;
		console.log('[SERVER]: '.bold.gray + msg);
  }
	
	if(type == 'MESSAGE') {
    // logStream += '[MESSAGE]: ' + msg;
		console.log('[MESSAGE]: '.bold.cyan + msg);
  }

	if(type == 'ERROR') {
    // logStream += '[ERROR]: ' + msg;
		console.log('[ERROR]: '.bold.red + msg);
  }

  // // Write to log file
  //   fs.appendFile(logFile, logStream + "\n", function (err) {
  //       if (err) throw err;
  //   });
}