const user = JSON.parse(localStorage.getItem("loggedUser"));

// Load playlists from localStorage for this specific user
const playlistKey = `playlists_${user.username}`;
let playlists = JSON.parse(localStorage.getItem(playlistKey)) || {
  "My Favorites": [],
  "Watch Later": [],
  "Music": []
};

function renderSidebar() {
  plList.innerHTML = "";
  Object.keys(playlists).forEach(p => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = p;
    li.onclick = () => load(p);
    plList.appendChild(li);
  });
}

function load(name) {
  current = name;
  plTitle.textContent = name;
  songs.innerHTML = "";

  playlists[name]?.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "col-md-3";
    div.innerHTML = `
      <div class="card mb-3">
        <img src="${s.img}">
        <div class="card-body">
          <small>${s.title}</small>
          <button class="btn btn-sm btn-danger w-100" onclick="remove(${i})">🗑</button>
        </div>
      </div>`;
    songs.appendChild(div);
  });
}

function remove(i) {
  playlists[current].splice(i, 1);
  localStorage.setItem(playlistKey, JSON.stringify(playlists));
  renderSidebar();
  load(current);
}

function newPlaylist() {
  const name = prompt("Name of playlist:");
  if (!name) return;
  playlists[name] = [];
  localStorage.setItem(playlistKey, JSON.stringify(playlists));
  renderSidebar();
}

function logout() {
  sessionStorage.removeItem("currentUser");
  localStorage.removeItem("loggedUser");
  location.href = "index.html";
}

// Load user info in navbar
document.getElementById('userName').textContent = user.privateName;
document.getElementById('userImg').src = user.imageUrl;

// DOM element references
const plList = document.getElementById('plList');
const songs = document.getElementById('songs');
const plTitle = document.getElementById('plTitle');

const params = new URLSearchParams(location.search);
let current = params.get("pl") || Object.keys(playlists)[0];

renderSidebar();
load(current);
