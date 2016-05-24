// Open connection to server
var socket = io();

// Disable name button on startup
validateName();

// Load Name Modal
$('#nameModal').modal('toggle');

// Build Interface
function buildInterface() {
	if($('#name').val() != '') {
		loadGroups();
		loadMessages();
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
socket.on('loadMessages', function(users, messages, availGroups, groups, times, user){
	if(user == $('#name').val()) {
		for(var x=0; x < messages.length; x++) {
			for(var y=0; y < availGroups.length; y ++) {
				if(groups[x] == availGroups[y]) {
					$('#chats-' + groups[x]).append('<img class="media-object img-circle pull-left" src="http://placehold.it/45X45" />');
					$('#chats-' + groups[x]).append('<h5>' + messages[x] + '</h5>');
					$('#chats-' + groups[x]).append('<small class="text-muted">' + users[x] + ' | ' + times[x] + '</small><hr>');
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

          	card += '<div class="col-md-6">';
			card += '<div class="card">';
			card += '<span class="card-title">' + temp[0] + '</span>';
            card += '<div class="card-image">';
            card += '<img class="img-responsive" src="http://placehold.it/300X200">'
            card += '</div>';
			card += '<div class="card-content">';
            card += '<p>';

            for(var y=0; y < members.length; y++) {
            	card += members[y] + ' ';
            }

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
	        chatBox += '<div class="panel-heading">';
	        chatBox += temp[0];
	        chatBox += '<button type="button" class="close" onClick="closeChat(\'' + temp[0] + '\')">&times;</button>';
	        chatBox += '</div>';
	        chatBox += '<div class="panel-body">';
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
socket.on('sendMessage', function(user, msg, group, time){
	$('#chats-' + group).append('<img class="media-object img-circle pull-left" src="http://placehold.it/45X45" />');
	$('#chats-' + group).append('<h5>' + msg + '</h5>');
	$('#chats-' + group).append('<small class="text-muted">' + user + ' | ' + time + '</small><hr>');
});

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

function openChat(group) {
	$('#chatBox-' + group).css('display','');
}

function closeChat(group) {
	$('#chatBox-' + group).css('display','none');
}

function validateName(clicked) {
	if($('#name').val() != '') {
		$('#nameButton').prop('disabled', false);
		$('#nameButton').prop('enabled', true);
		if(clicked == true) {
			buildInterface();
		}
	} else {
		$('#nameButton').prop('disabled', true);
	}
}