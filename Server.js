var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Pretty Console Colors :D
var color = require('colors');

// Used For loading and saving JSON
var fs = require('fs');

var msgFile = './assets/json/messages.json';
var messageJSON = "";

var groupsFile = './assets/json/groups.json';
var groupsJSON = "";

var usersFile = './assets/json/users.json';
var usersJSON = "";

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

io.on('connection', function(socket){
	// User connected
  	Log('SERVER', 'A user has connected');

  	//User disconnected
  	socket.on('disconnect', function(){
    	Log('SERVER', 'A user has disconnected');
  	});

  	// Handle incoming chat messages
  	socket.on('sendMessage', function(user, msg, grp, time){
    	Log('MESSAGE', '[' + grp.cyan + '] <' + user.green + '> ' + msg);

    	var temp = time.split(' ');
    	var tempTime = temp[4].split(':');
    	var timeStamp = temp[1] + " ";

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
    		timeStamp += tempTime[0] + ":" + tempTime[1] + "AM";
    	} else if (parseInt(tempTime[0]) == 12) {
    		tempTime[0] = 12;
    		timeStamp += tempTime[0] + ":" + tempTime[1] + "PM";
    	} else if (parseInt(tempTime[0]) > 12) {
    		tempTime[0] = (parseInt(tempTime[0]) - 12);
    		timeStamp += tempTime[0] + ":" + tempTime[1] + "PM";
    	} else if (parseInt(tempTime[0]) < 12) {
        timeStamp += tempTime[0] + ":" + tempTime[1] + "AM";
      }

    	if(user !='') {
	    	// Append new message
	    	messageJSON.messages.push({name:user, message:msg, group:grp, timeStamp:timeStamp});

	    	// Write messages to JSON file
	    	fs.writeFile(msgFile, JSON.stringify(messageJSON), function (err) {
				  if (err) return Log('ERROR', err);
			  });

        console.log(timeStamp);
        // Reload JSON
        reloadMessages();

	    	// Send message
	    	io.emit('sendMessage', user, msg, grp, timeStamp);
    	}
  	});



  	// Handle laoding chat messages
  	socket.on('loadMessages', function(user){
  		reloadMessages();
      // Create array of messages
  		var users = [];
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

    	// Send messages back to client
    	io.emit('loadMessages', users, messages, availGroups, groups, times, user);

    	Log('SERVER', '<' + user.green + '> loaded messages from the server')
  	});

    // Handle User Info request
    socket.on('requestUserInfo', function(user) {
      reloadUsers();

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
      }

      // Write to JSON file
      fs.writeFile(usersFile, JSON.stringify(usersJSON), function (err) {
          if (err) return Log('ERROR', err);
      });

      // Update User JSON
      reloadUsers();

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
});



// Start Webserver
http.listen(6288, function(){
	Log('SERVER','Matt-Chat'.rainbow + ' started on port 6288');
});

function reloadMessages() {
  fs.readFile(msgFile, 'utf8', function (err, data) {
      if (err) throw err;
      messageJSON = JSON.parse(data);
  });
}

function reloadGroups() {
	fs.readFile(groupsFile, 'utf8', function (err, data) {
      if (err) throw err;
    groupsJSON = JSON.parse(data);
  });
}

function reloadUsers() {
  fs.readFile(usersFile, 'utf8', function (err, data) {
      if (err) throw err;
    usersJSON = JSON.parse(data);
  });
}

function Log(type, msg) {
	if(type == 'SERVER')
		console.log('[SERVER]: '.bold.gray + msg);
	
	if(type == 'MESSAGE')
		console.log('[MESSAGE]: '.bold.cyan + msg);

	if(type == 'ERROR')
		console.log('[ERROR]: '.bold.red + msg);
}