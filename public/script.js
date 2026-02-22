const socket = io();

function joinRoom() {
  const username = document.getElementById("username").value;
  const room = document.getElementById("room").value;

  if (!username || !room) return alert("Enter username and room");

  socket.emit("joinRoom", { username, room });

  document.getElementById("join-container").classList.add("hidden");
  document.getElementById("chat-container").classList.remove("hidden");
}

const form = document.getElementById("chat-form");
const input = document.getElementById("msg");
const messages = document.getElementById("messages");
const usersList = document.getElementById("users");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
});

socket.on("message", (msg) => {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("roomUsers", (users) => {
  usersList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    usersList.appendChild(li);
  });
});
