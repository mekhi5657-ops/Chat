const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false
}));

// Fake database (in memory)
let users = [];

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({ username, password: hashedPassword });

  res.redirect("/login.html");
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);

  if (!user) return res.send("User not found");

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.send("Wrong password");

  req.session.user = username;
  res.redirect("/chat.html");
});

// ===== AUTH CHECK =====
app.get("/checkAuth", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

// ===== SOCKET.IO =====
io.on("connection", (socket) => {
  socket.on("joinRoom", (username) => {
    socket.username = username;
    io.emit("message", {
      user: "System",
      text: `${username} joined the chat`
    });
  });

  socket.on("chatMessage", (msg) => {
    io.emit("message", {
      user: socket.username,
      text: msg
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
