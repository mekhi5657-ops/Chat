const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false
}));

// Serve static files
app.use(express.static("public"));

// In-memory "database"
let users = [];

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(u => u.username === username);
  if (existingUser) return res.send("Username already exists");

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

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

// ===== CHECK AUTH =====
app.get("/checkAuth", (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
  else res.json({ loggedIn: false });
});

// ===== PROTECT CHAT.HTML =====
app.get("/chat.html", (req, res, next) => {
  if (!req.session.user) return res.redirect("/login.html");
  next();
});

// ===== SOCKET.IO =====
io.on("connection", (socket) => {
  socket.on("joinRoom", (username) => {
    socket.username = username;
    io.emit("message", { user: "System", text: `${username} joined the chat` });
  });

  socket.on("chatMessage", (msg) => {
    io.emit("message", { user: socket.username, text: msg });
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
