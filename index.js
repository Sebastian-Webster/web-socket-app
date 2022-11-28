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

io.on('connection', (socket) => {
    let totalUser = io.engine.clientsCount;
    socket.emit('defaultName', socket.id)
    users.set(socket.id, socket.id.toString())
    socket.on('new user', () => {;
        //socket.broadcast.emit('new user', 'new user has joined the chat') //sends to all but the initiating socket
        io.emit('new user', {userCount: totalUser, nickname: null, text: `Hello and welcome to this chat!`}) //send to only the initiating socket
    })


    socket.on('chat message', (msg) => {
        io.emit('chat message', {text: msg, nickname: users.get(socket.id) || 'Unknown User'}); //sends to all connected sockets
    });

    socket.on('choose name', (name) => {
        console.log(totalUser)
        socket.emit('new user', {userCount: totalUser, nickname: name, text: 'has joined the chat'}) //sends to all but the initiating socket
        users.set(socket.id, name)
    });    

    socket.on('disconnect', () => {
        totalUser = io.engine.clientsCount;
        io.emit('disconnected', {userCount: totalUser, nickname: users.get(socket.id) || 'Unknown User', text: 'has left the chat'}) //sends to all but the initiating socket
        
    })

});  

server.listen(3000, () => {
  console.log('listening on *:3000');
});