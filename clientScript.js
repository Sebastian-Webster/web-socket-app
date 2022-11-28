var socket = io();

var messages = document.getElementById('messages');
var chatForm = document.getElementById('chatForm');
var chatMessage = document.getElementById('chatMessage');
var nickname = document.getElementById('nickname');
let userCount = 0;

window.onload = () => socket.emit('new user') 

function printMsg(msg, msgClass) { //after socket recieves information for chat message
    var item = document.createElement('li');
    item.textContent = (msg.nickname) ? msg.nickname + ': ' + msg.text : msg.text;
    item.className = msgClass + ((msg.nickname == nickname.value) ? ' self' : '')
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}
//updates the count of total user in the chat
function updateUserCount(userCount) {
    document.getElementById("userCount").innerHTML = userCount;
    
}

chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (chatMessage.value) {
        socket.emit('chat message', { nickname: nickname.value, text: chatMessage.value });
        chatMessage.value = '';
    }
});

nameForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (nickname.value) {
        socket.emit('choose name', nickname.value);
        nameForm.className = 'hidden' //remove name form once chosen
        chatForm.className = '' //and show chat form by removing hidden class
        chatMessage.focus()
    }
});

socket.on('new user', (msg) => {updateUserCount(msg.userCount); printMsg(msg, 'newUser') })
socket.on('disconnected', (msg) => {updateUserCount(msg.userCount); printMsg(msg, 'userDisconnected')})
socket.on('chat message', (msg) => {printMsg(msg, 'chatMsg')})