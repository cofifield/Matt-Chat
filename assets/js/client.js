// Open connection to server
var socket = io();

checkCookie();

// Build Interface
function buildInterface() {
	if($('#name').val() != '') {
		loadGroups();
		loadMessages();
		updateOnlineStatus();
	} else {
		console.log('Hey! You need a name before you can build the interface!');
	}
}

// Ask server for messages
function loadMessages() {
	if($('#name').val() != '')
		socket.emit('loadMessages', $('#name').val());
	else
		console.log('Hey! You need a name before you can chat!');
}

// Load messages from server
socket.on('loadMessages', function(users, images, messages, availGroups, groups, times, user){
	if(user == $('#name').val()) {
		for(var x=0; x < messages.length; x++) {
			for(var y=0; y < availGroups.length; y ++) {
				if(groups[x] == availGroups[y]) {
					for(var z=0; z < images.length; z++) {
						var userImg = images[z].split('*');
						if(users[x] == userImg[0])
							$('#chats-' + groups[x]).append('<img class="media-object img-circle pull-left" src="' + userImg[1] + '" />');
					}
					$('#chats-' + groups[x]).append('<div class="msg"><h5>' + messages[x] + '</h5> <small class="text-muted">' + users[x] + ' | ' + times[x] + '</small></div><hr>');
				}
			}
		}
	}
});

// Ask server for groups
function loadGroups() {
	if($('#name').val() != '')
		socket.emit('loadGroups', $('#name').val());
	else
		console.log('Hey! You need a name before you can load groups!');
}

// Load groups from server
socket.on('loadGroups', function(groups, user){
	if(user == $('#name').val()) {

		var card = "";
		var chatBox = "";

		for(var x=0; x < groups.length; x++) {

			// Build Group Card
			var temp = groups[x].split('*');
			var members = temp[1].split('/');

          	card += '<div class="col-md-4">';
			card += '<div class="card">';
			card += '<span class="card-title">' + temp[0] + '</span>';
            card += '<div class="card-image">';
            card += '<img class="img-responsive" src="http://placehold.it/200X150">'
            card += '</div>';
			card += '<div class="card-content">';
            card += '<p id="' + temp[0] + '-grpmem">';

            card += '</p>';      
            card += '</div>';     
            card += '<div class="card-action">';
            card += '<a href="#' + temp[0] + '" onClick="openChat(\'' + temp[0] + '\')">Open Chat</a>'
            card += '</div>';
            card += '</div>';
            card += '</div>';

  			// Build Chat Boxes
			chatBox += '<div style="display:none;" id="chatBox-' + temp[0] + '" class="col-md-8">';
	    	chatBox += '<div class="panel panel-info">';
	        chatBox += '<div class="panel-heading" id="' + temp[0] + '-chatmem">';
	        chatBox += '<button type="button" class="close" onClick="closeChat(\'' + temp[0] + '\')">&times;</button>';
	        chatBox += '</div>';
	        chatBox += '<div id="' + temp[0] + '-scr" class="panel-body chatBox">';
			chatBox += '<ul class="media-list">';
	 		chatBox += '<li class="media">';
			chatBox += '<div class="media-body">';
			chatBox += '<div class="media">';
	        chatBox += '<div id="chats-' + temp[0] + '" class="media-body">';
	        chatBox += '</div>';
	        chatBox += '</div>';
			chatBox += '</div>';
	        chatBox += '</li>';
            chatBox += '</ul>';
            chatBox += '</div>';
            chatBox += '<div class="panel-footer">';
            chatBox += '<div class="input-group">';
            chatBox += '<input id="msgBox-' + temp[0] + '" type="text" onkeydown="getChar(event, \'' + temp[0] + '\')" class="form-control" placeholder="Enter Message" />';
            chatBox += '<span class="input-group-btn">';
            chatBox += '<button class="btn btn-info" onClick="sendMessage(\'' + temp[0] + '\')" type="button">SEND</button>';
            chatBox += '</span>';
            chatBox += '</div>';
            chatBox += '</div>';
        	chatBox += '</div>';
    		chatBox += '</div>';
		}

		// Add built content
		$('#groups').append(card);
		$('#chats').append(chatBox);
	}
});


// Recieve messages
socket.on('sendMessage', function(user, img, msg, group, time){
	$('#chats-' + group).append('<img class="media-object img-circle pull-left" src="' + img + '" />');
	$('#chats-' + group).append('<div class="msg"><h5>' + msg + '</h5> <small class="text-muted">' + user + ' | ' + time + '</small></div><hr>');
	$('#' + group + '-scr').scrollTop($('#' + group + '-scr')[0].scrollHeight);
});

// Recieve User info
socket.on('requestUserInfo', function(online, img){
	setCookie('online', online, '30');
	setCookie('usrImage', img, '30');
	$('#cookie').html(getCookie('name') + ' ' + getCookie('online') + ' ' + getCookie('usrImage'));
});

// Recieve Online Status
socket.on('updateOnlineStatus', function(users, online, groups) {
	for(var x=0; x < groups.length; x++) {
		var temp = groups[x].split('*');
		var members = temp[1].split('/');

		// Clear HTML to prevent online status build up
		$('#' + temp[0] + '-grpmem').html('');
		$('#' + temp[0] + '-chatmem').html('<span>&nbsp;</span>');
		$('#' + temp[0] + '-chatmem').append('<span style="float: left;">' + temp[0] + ' | </span>');

		for(var y=0; y < members.length; y++) {
            for(var z=0; z < online.length; z ++) {
            	if(members[y] == users[z]) {
            		if(online[z] == 1) {
            			$('#' + temp[0] + '-grpmem').append('<div style="margin-bottom: 5px;"><span class="online-group"></span>' + users[z] + '</div>');
            			$('#' + temp[0] + '-chatmem').append('<span style="float: left;"><span class="online-chat"></span>' + users[z] + ' | </span> ');
            		} else {
            			$('#' + temp[0] + '-grpmem').append('<div style="margin-bottom: 5px;"><span class="offline-group"></span>' + users[z] + '</div>');
            			$('#' + temp[0] + '-chatmem').append('<span style="float: left;"><span class="offline-chat"></span>' + users[z] + ' | </span> ');
            		}
            	}
            }
        }
        // Add Close Button
    	$('#' + temp[0] + '-chatmem').append('<button type="button" class="close" onClick="closeChat(\'' + temp[0] + '\')">&times;</button>');
	}
});

socket.on('userDisconnected', function(user) {
	socket.emit('userDisconnected', user);
});


function updateOnlineStatus() {
	socket.emit('updateOnlineStatus');
}

function logOut() {
	setCookie('online', '0', '0');
	setCookie('usrImage', '', '0');
	setCookie('name', '', '0');
	$('#name').val('');
	$(location).attr('href', 'http://192.168.1.238:6288');
}

// Check if enter is pressed while in the message text field
function getChar(event, group) {
	if(event.keyCode == 13)
		sendMessage(group);
}

// Send messages
function sendMessage(group) {
	if($('#msgBox-' + group).val() != '') {
		socket.emit('sendMessage', $('#name').val(), $('#msgBox-' + group).val(), group, Date());
		$('#msgBox-' + group).val('');
	}
}

// Open chat box
function openChat(group) {
	$('#chatBox-' + group).css('display','');
}

// Close chat box
function closeChat(group) {
	$('#chatBox-' + group).css('display','none');
}

// Prevent user from having a blank name.
function validateName(clicked) {
	if($('#name').val() != '') {
		$('#nameButton').prop('disabled', false);
		$('#nameButton').prop('enabled', true);
		if(clicked == true) {
			setCookie('name', $('#name').val(), '30');
			checkCookie();
		}
	} else {
		$('#nameButton').prop('disabled', true);
	}
}

// Add items to cookie
function setCookie(cName, cValue, exDays) {
    var d = new Date();
    d.setTime(d.getTime() + (exDays*24*60*60*1000));
    var expires = 'expires='+ d.toUTCString();
    document.cookie = cName + '=' + cValue + '; ' + expires;
}

// Retreive items from cookie
function getCookie(cName) {
    var name = cName + '=';
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return '';
}

// Check if user already has cookie
function checkCookie() {
    var name=getCookie('name');
    if (name != '') {
    	// If they have a cookie with a name
        $('#name').val(name);
        $('#username').html(name + ' <span class="caret"></span>');
        buildInterface();
        // Request the rest of the user data
        socket.emit('requestUserInfo', name);
    } else {
       // Disable name button on startup
		validateName();
		// Load Name Modal
		$('#nameModal').modal('toggle');
    }
}