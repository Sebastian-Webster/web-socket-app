const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//TODO:
//If the server restarts, the user is no longer a joined user and they can still send texts. To fix this, if socket connection is lost, tell the user the server has been disconnected and on reconnection get client to send nickname and other data to reinitiate socket


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/:file', (req, res) => {
    res.sendFile(__dirname + `/${req.params.file}`);
});

app.get('/assets/images/:file', (req, res) => {
    res.sendFile(__dirname + `/assets/images/${req.params.file}`);
});

const users = new Map();
const joinedUsers = new Set();
const usersTyping = {};

function sendUpdatedClientCount() {
    const toSend = {}
    joinedUsers.forEach(user => {
        toSend[user] = users.get(user)
    })
    io.emit('clientCount', toSend);
}

function sendUpdatedUsersTyping() {
    console.log('Users Typing:', usersTyping)
    emitToJoinedClients('usersTyping', usersTyping)
}

function broadcastEmitToJoinedClients(event, data, initiatingSocketId) {
    joinedUsers.forEach(socketId => {
        if (socketId !== initiatingSocketId) {
            io.to(socketId).emit(event, data)
        }
    })
}

function emitToJoinedClients(event, data) {
    joinedUsers.forEach(socketId => {
        io.to(socketId).emit(event, data)
    })
}

io.on('connection', (socket) => {
    socket.emit('defaultName', socket.id)
    users.set(socket.id, socket.id.toString())
    socket.on('new user', () => {
        //socket.broadcast.emit('new user', 'new user has joined the chat') //sends to all but the initiating socket
        socket.emit('new user', {nickname: null, text: `Hello and welcome to this chat!`}) //send to only the initiating socket
        sendUpdatedClientCount()
    })


    socket.on('chat message', (msg) => {
        delete usersTyping[socket.id]
        broadcastEmitToJoinedClients('chat message', {text: msg, nickname: users.get(socket.id) || 'Unknown User', socketId: socket.id}, socket.id); //Sends to all clients who have joined except the initiating socket
        sendUpdatedUsersTyping()
    });

    socket.on('choose name', (name) => {
        broadcastEmitToJoinedClients('new user', {nickname: name, text: 'has joined the chat'}, socket.id) //sends to all but the initiating socket
        users.set(socket.id, name)
        joinedUsers.add(socket.id)
        sendUpdatedClientCount()
    });    

    socket.on('disconnect', () => {
        if (joinedUsers.has(socket.id)) {
            emitToJoinedClients('disconnected', {nickname: users.get(socket.id) || 'Unknown User', text: 'has left the chat'}) //sends to all but the initiating socket
        }
        joinedUsers.delete(socket.id)
        delete usersTyping[socket.id]
        sendUpdatedClientCount()
        sendUpdatedUsersTyping()
        
    })

    socket.on('useDefaultName', () => {
        joinedUsers.add(socket.id)
        socket.broadcast.emit('new user', {nickname: users.get(socket.id), text: 'has joined the chat'}) //sends to all but the initiating socket
        sendUpdatedClientCount()
    })

    socket.on('startTyping', () => {
        usersTyping[socket.id] = users.get(socket.id) || 'Unknown User'
        sendUpdatedUsersTyping()
    })

    socket.on('stopTyping', () => {
        delete usersTyping[socket.id]
        sendUpdatedUsersTyping()
    })
});  

server.listen(3000, () => {
  console.log('listening on *:3000');
});