const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(username);

    io.to(room).emit("message", {
      user: "System",
      text: `${username} joined the room`,
    });

    io.to(room).emit("roomUsers", rooms[room]);
  });

  socket.on("chatMessage", (msg) => {
    io.to(socket.room).emit("message", {
      user: socket.username,
      text: msg,
    });
  });

  socket.on("disconnect", () => {
    if (socket.room && rooms[socket.room]) {
      rooms[socket.room] = rooms[socket.room].filter(
        (u) => u !== socket.username
      );
      io.to(socket.room).emit("message", {
        user: "System",
        text: `${socket.username} left the room`,
      });
      io.to(socket.room).emit("roomUsers", rooms[socket.room]);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
