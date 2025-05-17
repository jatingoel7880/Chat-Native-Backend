const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://10.0.2.2:3000/",
  },
});

const PORT = 4000;
let chatgroups = [];
const chatHistory = {}; // key: 'userA_userB' -> array of messages

function createUniqueId() {
  return Math.random().toString(20).substring(2, 10);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

socketIO.on("connection", (socket) => {
  console.log(`${socket.id} user is just connected`);

  socket.on('loadDirectChat', ({ senderId, receiverId }) => {
    const key = [senderId, receiverId].sort().join('_');
    const messages = chatHistory[key] || [];
    socket.emit('directChatHistory', messages);
  });

  socket.on('sendDirectMessage', (data) => {
    const {
      text,
      senderId,
      receiverId,
      senderName,
      time,
    } = data;

    const message = {
      id: createUniqueId(),
      text,
      senderId,
      receiverId,
      senderName,
      time,
    };

    const key = [senderId, receiverId].sort().join('_');
    if (!chatHistory[key]) chatHistory[key] = [];
    chatHistory[key].push(message);

    // Use socketIO instead of io
    socketIO.to(senderId).emit('receiveDirectMessage', message);
    socketIO.to(receiverId).emit('receiveDirectMessage', message);
  });
});

app.get("/api", (req, res) => {
  res.json(chatHistory);
});

http.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
