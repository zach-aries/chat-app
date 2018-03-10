let express = require ('express');
let app = express ();

const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 3000;

app.use ('/public', express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

// keep track of online users
let user_list = [];
// stores messages
let messages = [];
// identifier for new users
let next_id = 0;

io.on('connection', function (socket) {

    socket.on('user connected', function () {
        // create new username from next id and string
        // increment next_id so new users have a unique id
        const userID = 1000 + next_id;
        const username = "User-" + userID;
        next_id ++;


        // send confirmation to sending client only
        socket.emit('init', userID, username, user_list, messages);

        // create new user object
        let user = {
            id: socket.id,
            userID: userID,
            username: username,
            color: null
        };
        // add user to active user list
        user_list.push(user);

        // broadcast a new user to all other users
        socket.broadcast.emit('user connected', user);
    });

    socket.on('message', function (msg, userID) {
        let timestamp = new Date();
        let user = user_list.find(x => x.userID === userID);

        // create new message for storage and formating
        let message = {
            id: messages.length,
            userID: userID,
            username: user.username,
            timestamp: timestamp,
            color: user.color,
            message: msg
        };

        // store message
        messages.push(message);
        // if the message list has more than 250 messages then delete the oldest one
        if( messages.length > 250 ){
            messages.shift();
        }

        // emit message to all active users
        io.emit('message', message);
    });

    socket.on('usercolor change', function (userID, color) {
        let i = user_list.findIndex(x => x.userID === userID);
        if (i !== -1) {
            user_list[i].color = color;
        }
    });

    socket.on('username change', function (userID, username, new_user) {
        // check to see if username exists, if so send and error back to sending client
        if (user_list.findIndex(x => x.username === new_user) === -1) {
            // get index of sending client for user list
            let i = user_list.findIndex(x => x.userID === userID);
            if (i !== -1) {
                // change username
                user_list[i].username = new_user;
                // emit username change to all connected users
                io.emit('username change', userID, new_user);
            }
        } else {
            // send error to sending client
            const error = "Username already taken.";
            socket.emit('error message', error);
        }
    });

    socket.on('disconnect', function () {
        // find user in active user list and remove
        const i = user_list.findIndex(x => x.id === socket.id);
        const user = user_list[i];

        user_list.splice(i, 1);

        // emit disconnected user to all active users
        io.emit('user disconnect', user.userID);
    });
});

http.listen(port, function () {
    console.log('listening on #:3000');
});