var socket = io();

var messages = document.getElementById('messages');
var chatForm = document.getElementById('chatForm');
var chatMessage = document.getElementById('chatMessage');
var nickname = document.getElementById('nickname');
var defaultNicknameText = document.getElementById('defaultNickname');
var nameForm = document.getElementById('nameForm');
var nameFormContainer = document.getElementById('nameFormContainer')
var themePicker = document.getElementById('themePicker')
let defaultNickname = '';
var theme = 'light'

window.onload = () => {
    socket.emit('new user');
    nickname.focus();
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        console.log('Using dark theme')
        initDarkMode();
    } else {
        console.log('Using light theme')
        initLightMode();
    }
}

window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
        console.log('Using dark theme')
        initDarkMode()
    } else {
        console.log('Using light theme')
        initLightMode()
    }
})

function changePageTheme() {
    if (theme === 'dark') {
        initLightMode()
    } else {
        initDarkMode()
    }
}

function initDarkMode() {
    theme = 'dark'
    document.body.classList.add('darkMode')
    themePicker.className = 'fa-solid fa-sun';
}

function initLightMode() {
    theme = 'light'
    document.body.classList.remove('darkMode')
    themePicker.className = 'fa-solid fa-moon'
}

function printMsg(msg, msgClasses = []) { //after socket recieves information for chat message
    var item = document.createElement('span');
    if (msg.nickname && msgClasses.includes('leftChat')) {
        var nickname = document.createElement('span')
        nickname.className = 'nickname'
        nickname.textContent = msg.nickname
        messages.append(nickname)
        item.textContent = msg.text
    } else {
        item.textContent = msg.text ? msg.nickname ? msg.nickname + ': ' + msg.text : msg.text : msg
    }
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
    } else {
        useDefaultNickname()
    }
});

function useDefaultNickname() {
    nameFormContainer.className = 'hidden' //remove name form once chosen
    chatForm.className = '' //and show chat form by removing hidden class
    socket.emit('useDefaultName')
    chatMessage.focus()
}

socket.on('new user', (msg) => {printMsg(msg, ['newUser', 'middleChat']) })
socket.on('disconnected', (msg) => {printMsg(msg, ['userDisconnected', 'middleChat'])})
socket.on('chat message', (msg) => {printMsg(msg, ['leftChat'])})
socket.on('defaultName', (name) => {
    defaultNicknameText.textContent = name;
    defaultNickname = name;
})
socket.on('clientCount', updateUserCount)