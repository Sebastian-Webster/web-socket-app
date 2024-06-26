var socket = io();

var messages = document.getElementById('messages');
var chatForm = document.getElementById('chatForm');
var chatMessage = document.getElementById('chatMessage');
var nickname = document.getElementById('nickname');
var defaultNicknameText = document.getElementById('defaultNickname');
var nameForm = document.getElementById('nameForm');
var nameFormContainer = document.getElementById('nameFormContainer')
var themePicker = document.getElementById('themePicker')
var typingMessageTemplate = document.getElementById('typingMessageTemplate');
var typingUsersMessage = document.getElementById('typing-users')
let defaultNickname = '';
var typingTimeout;
var theme = 'light'

const onlineHeader = document.getElementById('onlineHeader');
const onlineContainer = document.getElementById('onlineContainer');
const exitOnlineListButton = document.getElementById('exit-online-list');
const onlineUserTemplate = document.getElementById('onlineUserTemplate');
const onlineUsersList = document.getElementById('onlineUsersList');
const disconnectedAlert = document.getElementById('disconnectedAlert')
const tryingToReconnectText = document.getElementById('trying-to-reconnect')

let tryingToReconnectTextInterval = null;

let username = ''

const mutedSocketIds = []

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

let lastNickname = null;
let lastKnownUserCount = [];

function printMsg(msg, msgClasses = []) { //after socket recieves information for chat message
    var item = document.createElement('span');
    if (msg.nickname && msgClasses.includes('leftChat')) {
        if (msg.nickname !== lastNickname) {
            let nickname = document.createElement('span')
            nickname.className = 'nickname'
            nickname.textContent = msg.nickname
            messages.append(nickname)
        }
        item.textContent = msg.text
        lastNickname = msg.nickname;
    } else {
        item.textContent = msg.text ? msg.nickname ? msg.nickname + ': ' + msg.text : msg.text : msg
        lastNickname = null;
    }
    item.classList.add('chatMsg')
    for (let classToAdd of msgClasses) {
        item.classList.add(classToAdd)
    }
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}
//updates the count of total user in the chat
function updateUserCount(users) {
    lastKnownUserCount = users;
    console.log('Received online users:', users)
    removeAllChildElements(onlineUsersList)

    const userIds = Object.keys(users) //Will be used later for hiding/showing messages from specific people
    const nicknames = Object.values(users)

    for (let i = 0; i < nicknames.length; i++) {
        const onlineUserItem = onlineUserTemplate.content.cloneNode(true).querySelector('.onlineUserItem')
        onlineUserItem.id = `onlineUserNum-${i}`
        onlineUserItem.querySelector('.onlineUser-Username').textContent = i + 1 + ': ' + nicknames[i]
        onlineUsersList.appendChild(onlineUserItem)
    }

    document.getElementById("userCount").innerHTML = nicknames.length;
}

chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (chatMessage.value) {
        printMsg(chatMessage.value, ['rightChat', 'self'])
        socket.emit('chat message', chatMessage.value);
        clearTimeout(typingTimeout)
        typingTimeout = null;
        chatMessage.value = '';
    }
});

nameForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (nickname.value) {
        socket.emit('choose name', nickname.value);
        username = nickname.value
        nameFormContainer.className = 'hidden' //remove name form once chosen
        chatForm.className = '' //and show chat form by removing hidden class
        chatMessage.focus()
    } else {
        useDefaultNickname()
    }
});

const setTypingTimeout = () => setTimeout(() => {
    typingTimeout = null;
    socket.emit('stopTyping')
}, 2000)

function handleStartTyping() {
    console.log('running')
    if (typingTimeout) {
        clearTimeout(typingTimeout)
        typingTimeout = setTypingTimeout()
        return
    }

    socket.emit('startTyping')
    typingTimeout = setTypingTimeout()
}

function useDefaultNickname() {
    nameFormContainer.className = 'hidden' //remove name form once chosen
    chatForm.className = '' //and show chat form by removing hidden class
    socket.emit('useDefaultName')
    username = defaultNickname
    chatMessage.focus()
}

function updateTypingCount(usersObj) {
    delete usersObj[socket.id]
    console.log('Users Typing:', usersObj)
    const peopleTyping = Object.values(usersObj)

    var typingMessageContainer = document.getElementById('typingMessageContainer')

    if (peopleTyping.length == 0) {
        if (typingMessageContainer != null) {
            typingMessageContainer.remove()
        }
    } else {
        if (typingMessageContainer != null) {
            typingMessageContainer.remove()
        }
        const typingMessageDiv = typingMessageTemplate.content.cloneNode(true).querySelector('div')
        typingMessageDiv.id = 'typingMessageContainer'
        const typingMessage = typingMessageDiv.querySelector('#typing-users')
        if (peopleTyping.length == 1) {
            typingMessage.textContent = `${peopleTyping[0]} is typing...`
    
        } else if (peopleTyping.length == 2) {
            typingMessage.textContent = `${peopleTyping[0]} and ${peopleTyping[1]} are typing...`
        } else if (peopleTyping.length > 2) {
            typingMessage.textContent = `${peopleTyping.length} users are typing...`
        }
        messages.appendChild(typingMessageDiv)
    }
}

socket.on('new user', (msg) => {printMsg(msg, ['newUser', 'middleChat']) })
socket.on('disconnected', (msg) => {printMsg(msg, ['userDisconnected', 'middleChat'])})
socket.on('chat message', (msg) => {printMsg(msg, ['leftChat'])})
socket.on('defaultName', (name) => {
    defaultNicknameText.textContent = name;
    defaultNickname = name;
})
socket.on('clientCount', updateUserCount)
socket.on('usersTyping', updateTypingCount)

socket.on("disconnect", () => {
    disconnectedAlert.style.display = 'flex';

    tryingToReconnectTextInterval = setInterval(() => {
        if (tryingToReconnectText.textContent === 'Trying to reconnect.') {
            tryingToReconnectText.textContent = 'Trying to reconnect..'
        } else if (tryingToReconnectText.textContent === 'Trying to reconnect..') {
            tryingToReconnectText.textContent = 'Trying to reconnect...'
        } else {
            tryingToReconnectText.textContent = 'Trying to reconnect.'
        }
    }, 400)
})

socket.io.on('reconnect', () => {
    disconnectedAlert.style.display = 'none'
    socket.emit('joinAfterDisconnect', username)
    if (tryingToReconnectTextInterval != null) {
        clearInterval(tryingToReconnectTextInterval)
        tryingToReconnectTextInterval = null;
    }
})

function removeAllChildElements(parent) {
    while (parent.firstChild) {
        parent.lastChild.remove()
    }
}

onlineHeader.addEventListener('click', (e) => {
    onlineContainer.style.display = 'flex'
    updateUserCount(lastKnownUserCount)
})

exitOnlineListButton.addEventListener('click', (e) => {
    onlineContainer.style.display = 'none'
    removeAllChildElements(onlineUsersList)
})