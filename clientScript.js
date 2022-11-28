var socket = io();

var messages = document.getElementById('messages');
var chatForm = document.getElementById('chatForm');
var chatMessage = document.getElementById('chatMessage');
var nickname = document.getElementById('nickname');
var defaultNicknameText = document.getElementById('defaultNickname');
var nameForm = document.getElementById('nameForm');
var nameFormContainer = document.getElementById('nameFormContainer')
let defaultNickname = '';

window.onload = () => {
    socket.emit('new user')
    nickname.focus()
}

function printMsg(msg, msgClasses = []) { //after socket recieves information for chat message
    var item = document.createElement('li');
    item.textContent = msg.text ? msg.nickname ? msg.nickname + ': ' + msg.text : msg.text : msg
    item.classList.add('chatMsg')
    for (let classToAdd of msgClasses) {
        item.classList.add(classToAdd)
    }
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
        printMsg(chatMessage.value, ['rightChat', 'self'])
        socket.emit('chat message', chatMessage.value);
        chatMessage.value = '';
    }
});

nameForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (nickname.value) {
        socket.emit('choose name', nickname.value);
        nameFormContainer.className = 'hidden' //remove name form once chosen
        chatForm.className = '' //and show chat form by removing hidden class
        chatMessage.focus()
    }
});

function useDefaultNickname() {
    nameFormContainer.className = 'hidden' //remove name form once chosen
    chatForm.className = '' //and show chat form by removing hidden class
    socket.emit('useDefaultName')
}

socket.on('new user', (msg) => {printMsg(msg, ['newUser', 'middleChat']) })
socket.on('disconnected', (msg) => {printMsg(msg, ['userDisconnected', 'middleChat'])})
socket.on('chat message', (msg) => {printMsg(msg)})
socket.on('defaultName', (name) => {
    defaultNicknameText.textContent = name;
    defaultNickname = name;
})
socket.on('clientCount', updateUserCount)