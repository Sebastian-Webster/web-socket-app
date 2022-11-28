const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/:file', (req, res) => {
    res.sendFile(__dirname + `/${req.params.file}`);
});

const users = new Map();
const joinedUsers = new Set();

function sendUpdatedClientCount() {
    io.emit('clientCount', joinedUsers.size);
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
        broadcastEmitToJoinedClients('chat message', {text: msg, nickname: users.get(socket.id) || 'Unknown User'}, socket.id); //Sends to all clients who have joined except the initiating socket
    });

    socket.on('choose name', (name) => {
        socket.broadcast.emit('new user', {nickname: name, text: 'has joined the chat'}) //sends to all but the initiating socket
        users.set(socket.id, name)
        joinedUsers.add(socket.id)
        sendUpdatedClientCount()
    });    

    socket.on('disconnect', () => {
        joinedUsers.delete(socket.id)
        sendUpdatedClientCount()
        emitToJoinedClients('disconnected', {nickname: users.get(socket.id) || 'Unknown User', text: 'has left the chat'}) //sends to all but the initiating socket
        
    })

    socket.on('useDefaultName', () => {
        joinedUsers.add(socket.id)
        socket.broadcast.emit('new user', {nickname: users.get(socket.id), text: 'has joined the chat'}) //sends to all but the initiating socket
        sendUpdatedClientCount()
    })

});  

server.listen(3000, () => {
  console.log('listening on *:3000');
});