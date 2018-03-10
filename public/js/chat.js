$(function () {
    const socket = io();
    let _username;
    let _userID;
    let _user_list = [];

    // init function
    socket.on('init', function(userID, username, user_list, messages) {
        // set userID and username
        _userID = userID;
        _username = username;

        // update username in DOM
        setUserName(_username);

        // populate user list with all active users
        for (let i = 0; i < user_list.length; i++) {
            _user_list.push(user_list[i]);
            addUser(user_list[i]);
        }

        // populate messages
        for (let i = 0; i < messages.length; i++) {
            addMessage(messages[i]);
        }

        // create alert to display current username
        let alert = $('<li>')
            .addClass('alert alert-light')
            .attr('role','alert')
            .text('Signed in as: ' + _username);

        // display current user's username
        $('#messages').append( alert );
        $('#messages')[0].scrollTop =  $('#messages')[0].scrollHeight;
    });

    socket.on('user disconnect', function(uid) {
        // remove disconnected user for user_list
        const i = _user_list.findIndex(x => x.userID === uid);
        _user_list.splice(i, 1);

        // remove disconnected user from DOM
        removeUser(uid);
    });

    socket.on('connect', function() {
        // connect function
        socket.emit('user connected');
    });

    socket.on('user connected', function (user) {
        // add connected user to userlist
        _user_list.push(user);
        // add connected user to DOM
        addUser(user);
    });

    socket.on('message', function (message) {
        // add message to DOM
        addMessage(message);
    });

    socket.on('username change', function (uid, new_user) {
        if (uid === _userID) {
            _username = new_user;
            setUserName(_username);

            dislaySuccess("Username changed to — " + _username);
        } else {
            let i = _user_list.findIndex(x => x.userID === uid);
            if (i !== -1) {
                _user_list[i].username = new_user;
                $('#user-'+uid).html(new_user);
            }
        }
    });

    socket.on('error message', function (msg) {
        dislayError(msg);
    });

    $("#frm-submit").click(function() {
        $("#chat-input").submit();
    });

    $('#chat-input').submit(function(){
        // get message from chat entry
        const msg = $('#msg').val();

        if (msg.startsWith('/nickcolor')){
            if (msg.length === 17) {
                let color = msg.substring(11, 17);

                if (color.match(/^[0-9a-zA-Z]+$/)){
                    socket.emit('usercolor change', _userID, color);
                    dislaySuccess("Username color changed to — " + color);
                } else {
                    dislayError('Color must contain alpha numeric characters only.');
                }
            } else {
                dislayError("User Color must be in format '/nickcolor RRGGBB'.");
            }

            $('#msg').val('');
            return false;
        }

        if (msg.startsWith('/nick')){
            let new_user = msg.substring(6, msg.length);
            if ( new_user.match(/\S/)){
                new_user = new_user.trim();
                if (new_user.length < 16){
                    socket.emit('username change', _userID, _username, new_user);
                } else {
                    dislayError("Username too long, must be 15 characters or less.");
                }
            } else {
                dislayError("Username must contain alpha numeric characters.");
            }

            $('#msg').val('');
            return false;
        }

        // check to make sure the message includes a character
        if (msg.match(/\S/)) {
            // emit message to server and add li with msg to chat box
            socket.emit('message', msg, _userID);

            // clear chat entry
            $('#msg').val('');
        }

        return false;
    });

    function addMessage(msg) {


        let date = new Date(msg.timestamp);
        let time = $('<span class="time"></span>').text(date.toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }));

        let info = $('<div>').addClass('msg-info').text(msg.username);
        let li = $('<li>').addClass(msg.userID.toString()).text(msg.message);

        if (msg.color !== null) {
            $(info).css("color", "#"+msg.color);
        }

        if (msg.userID === _userID) {
            $(li).addClass('self');
        }

        info.append(time);
        li.prepend(info);

        $('#messages').append(li);
        $('#messages')[0].scrollTop =  $('#messages')[0].scrollHeight;
    }

    function setUserName(user) {
        $('#username').html( user );
    }

    function addUser(user) {
        let el_user = $('<li>').text(user.username);
        $(el_user).attr('id', 'user-' + user.userID);


        $('#user-list').append(el_user);
    }

    function removeUser(id) {
        $('#user-'+ id).remove();
    }

    function dislaySuccess(msg) {
        let alert = $('<li>')
            .addClass('alert alert-success alert-dismissible fade show')
            .attr('role','alert')
            .text(msg);
        let btn = $('<button>')
            .addClass('close')
            .attr('type','button')
            .attr('data-dismiss','alert')
            .attr('aria-label','Close');
        let spn = $('<span>')
            .attr('aria-hidden', true)
            .html('&times;');

        btn.append(spn);
        alert.append(btn);

        $('#messages').append( alert );
        $('#messages')[0].scrollTop =  $('#messages')[0].scrollHeight;
    }

    function dislayError(msg) {
        let alert = $('<li>')
            .addClass('alert alert-danger alert-dismissible fade show')
            .attr('role','alert')
            .text(msg);
        let btn = $('<button>')
            .addClass('close')
            .attr('type','button')
            .attr('data-dismiss','alert')
            .attr('aria-label','Close');
        let spn = $('<span>')
            .attr('aria-hidden', true)
            .html('&times;');

        btn.append(spn);
        alert.append(btn);

        $('#messages').append( alert );
        $('#messages')[0].scrollTop =  $('#messages')[0].scrollHeight;
    }
});