const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
// const socketIO = require("socket.io")(http, {
//   cors: {
//     origin: "http://10.0.2.2:3000/",
//   },
// });

const socketIO = require("socket.io")(http, {
  cors: {
    origin: "*", // Allow all origins (safe for mobile apps)
    methods: ["GET", "POST"]
  },
});

const PORT = 4000;
let chatgroups = [];
const chatHistory = {}; // key: 'userA_userB' -> array of messages
const userSocketMap = {};

function createUniqueId() {
  return Math.random().toString(20).substring(2, 10);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(cors());
app.use(cors({ origin: "*" }));


socketIO.on("connection", (socket) => {
  console.log(`${socket.id} user is just connected`);

  socket.on('userConnected', (userId) => {
    // to bind userId with socket.id
  userSocketMap[userId] = socket.id;
  console.log(userId)
  console.log(socket.id)
  console.log(`User connected: ${userId} -> ${socket.id}`);
});

socket.on('disconnect', () => {
  for (const [userId, sockId] of Object.entries(userSocketMap)) {
    if (sockId === socket.id) {
      delete userSocketMap[userId];
      break;
    }
  }
});


  socket.on('loadDirectChat', ({ senderId, receiverId }) => {
    const key = [senderId, receiverId].sort().join('_');
    const messages = chatHistory[key] || [];
    socket.emit('directChatHistory', messages);
  });

  socket.on('sendDirectMessage', (data) => {
 const message = {
    id: createUniqueId(),
    text: data.text,
    senderId: data.senderId,
    receiverId: data.receiverId,
    senderName: data.senderName,
    time: data.time,
  };

  const key = [data.senderId, data.receiverId].sort().join('_');
  if (!chatHistory[key]) chatHistory[key] = [];
  chatHistory[key].push(message);

  // Send to both sender and receiver if they are connected
//   const senderSocketId = userSocketMap[senderId];
//   const receiverSocketId = userSocketMap[receiverId];

//   if (senderSocketId) socketIO.to(senderSocketId).emit('receiveDirectMessage', message);
//   if (receiverSocketId) socketIO.to(receiverSocketId).emit('receiveDirectMessage', message);
// });
 const receiverSocketId = userSocketMap[data.receiverId];
  if (receiverSocketId) {
    socketIO.to(receiverSocketId).emit('receiveDirectMessage', message);
  }
  
  // Send confirmation to sender
  socket.emit('messageDelivered', message);
});

  
  // socket.on('sendDirectMessage', (data) => {
  //   const {
  //     text,
  //     senderId,
  //     receiverId,
  //     senderName,
  //     time,
  //   } = data;

  //   const message = {
  //     id: createUniqueId(),
  //     text,
  //     senderId,
  //     receiverId,
  //     senderName,
  //     time,
  //   };

  //   const key = [senderId, receiverId].sort().join('_');
  //   if (!chatHistory[key]) chatHistory[key] = [];
  //   chatHistory[key].push(message);

  //   // Use socketIO instead of io
  //   socketIO.to(senderId).emit('receiveDirectMessage', message);
  //   socketIO.to(receiverId).emit('receiveDirectMessage', message);
  // });
});

app.get("/api", (req, res) => {
  res.json(chatHistory);
});

http.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
