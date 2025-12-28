const user = JSON.parse(localStorage.getItem("loggedUser"));
const sessionToken = localStorage.getItem("sessionToken");

// Redirect if not logged in
if (!user || !sessionToken) {
  window.location.href = "login.html";
}

// Load playlists from server
const playlistKey = `playlists_${user.username}`;
let playlists = {};

// Load playlists from server
async function loadPlaylistsFromServer() {
  try {
    const response = await fetch('/api/playlists', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Session expired, redirect to login
        alert('Session expired. Please login again.');
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("loggedUser");
        window.location.href = "login.html";
        return;
      }
      throw new Error('Failed to load playlists');
    }
    
    const data = await response.json();
    playlists = data.playlists;
    
    // Also save to localStorage as backup
    localStorage.setItem(playlistKey, JSON.stringify(playlists));
  } catch (error) {
    console.error('Error loading playlists:', error);
    // Fallback to localStorage
    playlists = JSON.parse(localStorage.getItem(playlistKey)) || {
      "My Favorites": [],
      "Watch Later": [],
      "Music": []
    };
  }
}

// Save playlists to server
async function savePlaylistsToServer() {
  try {
    const response = await fetch('/api/playlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ playlists })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = "login.html";
        return;
      }
      throw new Error('Failed to save playlists');
    }
    
    // Also save to localStorage as backup
    localStorage.setItem(playlistKey, JSON.stringify(playlists));
  } catch (error) {
    console.error('Error saving playlists:', error);
    // Still save to localStorage as fallback
    localStorage.setItem(playlistKey, JSON.stringify(playlists));
  }
}

// Track current sort method
let currentSort = 'none'; // 'none', 'az', or 'rating'

function renderSidebar() {
  plList.innerHTML = "";
  Object.keys(playlists).forEach(p => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    // Highlight current playlist
    if (p === current) {
      li.classList.add("active");
    }
    li.textContent = p;
    li.onclick = () => load(p);
    plList.appendChild(li);
  });
}

function load(name) {
  // Validate playlist exists
  if (!playlists[name]) {
    console.warn(`Playlist "${name}" not found, loading first available playlist`);
    name = Object.keys(playlists)[0] || "My Favorites";
  }
  
  current = name;
  plTitle.textContent = name;
  songs.innerHTML = "";

  // Update URL to reflect current playlist
  params.set("pl", encodeURIComponent(name));
  history.replaceState(null, "", "?" + params.toString());

  // Re-render sidebar to update active state
  renderSidebar();

  // Reset sort when loading a NEW playlist (not when reloading current)
  if (name !== current || currentSort === 'none') {
    currentSort = 'none';
    updateSortLabel();
  }

  // Clear search filter when switching playlists
  if (filterInput) {
    filterInput.value = '';
  }

  renderSongs();
}

// Render songs without resetting sort
function renderSongs() {
  songs.innerHTML = "";
  
  // Get filter value if any
  const filterValue = filterInput ? filterInput.value.toLowerCase() : '';
  
  playlists[current]?.forEach((s, i) => {
    // Apply filter - skip songs that don't match
    if (filterValue && !s.title.toLowerCase().includes(filterValue)) {
      return; // Skip this song
    }
    
    const div = document.createElement("div");
    div.className = "col-md-3";
    
    // Create star rating display (0-5 scale)
    const rating = s.rating || 0;
    const starsHtml = generateClickableStars(rating, i);
    
    // Check if it's an MP3 file or YouTube video
    const isMP3 = s.type === 'mp3';
    const clickAction = isMP3 ? `playMP3('${s.url}', '${s.title}')` : `playVideo('${s.id}')`;
    
    div.innerHTML = `
      <div class="card mb-3">
        <div class="position-relative">
          <img src="${s.img}" class="card-img-top" style="cursor:pointer" onclick="${clickAction}">
          ${isMP3 ? '<span class="badge bg-success position-absolute top-0 start-0 m-2">MP3</span>' : ''}
        </div>
        <div class="card-body">
          <small class="song-title" title="${s.title}">${s.title}</small>
          
          <!-- Rating Display -->
          <div class="rating-section mt-2">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <small class="text-muted">Rating:</small>
              <span class="badge bg-primary">${rating}/5</span>
            </div>
            <div class="star-rating-interactive" id="stars-${i}">
              ${starsHtml}
            </div>
          </div>
          
          <button class="btn btn-sm btn-danger w-100 mt-2" onclick="remove(${i})">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>`;
    songs.appendChild(div);
  });
  
  // Show message if no results found
  if (filterValue && songs.children.length === 0) {
    songs.innerHTML = `
      <div class="col-12 text-center mt-5">
        <i class="fas fa-search fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">No songs found matching "${filterInput.value}"</h5>
        <p class="text-muted">Try a different search term</p>
      </div>`;
  }
}

// Filter songs based on search input (case-insensitive)
function filterSongs(searchTerm) {
  renderSongs(); // Re-render with filter applied
}

// Clear filter input
function clearFilter() {
  if (filterInput) {
    filterInput.value = '';
    renderSongs();
    filterInput.focus(); // Keep focus on input for convenience
  }
}

// Generate clickable star rating
function generateClickableStars(rating, index) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? 'fas fa-star' : 'far fa-star';
    stars += `<i class="${starClass} star-clickable text-warning" 
                 onclick="setRating(${index}, ${i})" 
                 onmouseover="previewRating(${index}, ${i})"
                 onmouseout="restoreRating(${index})"
                 data-rating="${i}"></i>`;
  }
  return stars;
}

// Preview rating on hover
function previewRating(songIndex, rating) {
  const starsContainer = document.getElementById(`stars-${songIndex}`);
  const stars = starsContainer.querySelectorAll('.star-clickable');
  
  stars.forEach((star, index) => {
    if (index < rating) {
      star.className = 'fas fa-star star-clickable text-warning';
    } else {
      star.className = 'far fa-star star-clickable text-warning';
    }
  });
}

// Restore actual rating when mouse leaves
function restoreRating(songIndex) {
  const actualRating = playlists[current][songIndex].rating || 0;
  const starsContainer = document.getElementById(`stars-${songIndex}`);
  const stars = starsContainer.querySelectorAll('.star-clickable');
  
  stars.forEach((star, index) => {
    if (index < actualRating) {
      star.className = 'fas fa-star star-clickable text-warning';
    } else {
      star.className = 'far fa-star star-clickable text-warning';
    }
  });
}

// Set rating when star is clicked
function setRating(songIndex, rating) {
  playlists[current][songIndex].rating = rating;
  savePlaylistsToServer();
  
  // Update only the stars for this song (no full reload)
  updateStarsDisplay(songIndex, rating);
}

// Update stars display without reloading entire playlist
function updateStarsDisplay(songIndex, rating) {
  const starsContainer = document.getElementById(`stars-${songIndex}`);
  const stars = starsContainer.querySelectorAll('.star-clickable');
  
  stars.forEach((star, index) => {
    if (index < rating) {
      star.className = 'fas fa-star star-clickable text-warning';
    } else {
      star.className = 'far fa-star star-clickable text-warning';
    }
  });
  
  // Update the badge
  const card = starsContainer.closest('.card');
  const badge = card.querySelector('.badge');
  badge.textContent = `${rating}/5`;
}

// Play video in modal (optional - enhance existing functionality)
function playVideo(videoId) {
  window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
}

// Play MP3 file
function playMP3(url, title) {
  // Create audio player modal
  const modalHtml = `
    <div class="modal fade" id="mp3PlayerModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fas fa-music me-2"></i>${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <audio controls autoplay class="w-100" style="margin-top: 20px;">
              <source src="${url}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </div>
    </div>`;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('mp3PlayerModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('mp3PlayerModal'));
  modal.show();
  
  // Clean up when modal is closed
  document.getElementById('mp3PlayerModal').addEventListener('hidden.bs.modal', function() {
    this.remove();
  });
}

function remove(i) {
  playlists[current].splice(i, 1);
  savePlaylistsToServer();
  renderSidebar();
  load(current);
}

function newPlaylist() {
  const name = prompt("Name of playlist:");
  if (!name) return;
  playlists[name] = [];
  savePlaylistsToServer();
  renderSidebar();
}

// Sort playlist A-Z by title
function sortAZ() {
  if (!current || !playlists[current]) return;
  
  playlists[current].sort((a, b) => {
    return a.title.localeCompare(b.title);
  });
  
  currentSort = 'az';
  updateSortLabel();
  savePlaylistsToServer();
  renderSongs(); // Just re-render, don't call load()
}

// Sort playlist by rating (highest to lowest)
function sortByRating() {
  if (!current || !playlists[current]) return;
  
  playlists[current].sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    return ratingB - ratingA; // Descending order
  });
  
  currentSort = 'rating';
  updateSortLabel();
  savePlaylistsToServer();
  renderSongs(); // Just re-render, don't call load()
}

// Clear sort (show original order)
function clearSort() {
  if (!current || !playlists[current]) return;
  
  currentSort = 'none';
  updateSortLabel();
  // Reload the playlist from localStorage to get original order
  playlists = JSON.parse(localStorage.getItem(playlistKey)) || playlists;
  renderSongs();
}

// Update the sort label in the dropdown button
function updateSortLabel() {
  const sortLabel = document.getElementById('sortLabel');
  if (!sortLabel) return;
  
  switch(currentSort) {
    case 'az':
      sortLabel.innerHTML = 'Sort by: <strong>A-Z</strong>';
      break;
    case 'rating':
      sortLabel.innerHTML = 'Sort by: <strong>Rating</strong>';
      break;
    default:
      sortLabel.innerHTML = 'Sort by: None';
  }
}

function logout() {
  // Call server logout endpoint
  fetch('/api/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    }
  }).finally(() => {
    // Clear local storage
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("sessionToken");
    location.href = "index.html";
  });
}

// Show profile picture in modal
function showProfilePicture() {
  const profilePictureModalImg = document.getElementById('profilePictureModalImg');
  profilePictureModalImg.src = user.imageUrl;
  const modal = new bootstrap.Modal(document.getElementById('profilePictureModal'));
  modal.show();
}

// Load user info in navbar
document.getElementById('userName').textContent = user.privateName;
document.getElementById('userImg').src = user.imageUrl;

// DOM element references
const plList = document.getElementById('plList');
const songs = document.getElementById('songs');
const plTitle = document.getElementById('plTitle');
const filterInput = document.getElementById('filter');

// Add event listener for search/filter input
filterInput.addEventListener('input', function() {
  filterSongs(this.value);
});

// Initialize: Get playlist from query string or default to first playlist
const params = new URLSearchParams(location.search);
let current;

async function initializePlaylist() {
  // Load playlists from server first
  await loadPlaylistsFromServer();
  
  const playlistFromQuery = params.get("pl") ? decodeURIComponent(params.get("pl")) : null;
  
  // Check if query string playlist exists
  if (playlistFromQuery && playlists[playlistFromQuery]) {
    current = playlistFromQuery;
    console.log(`Loading playlist from query string: "${current}"`);
  } else {
    // Default to first playlist if no valid query string
    const firstPlaylist = Object.keys(playlists)[0];
    current = firstPlaylist || "My Favorites";
    console.log(`Loading default playlist: "${current}"`);
    
    // Update URL to reflect the loaded playlist
    if (firstPlaylist) {
      params.set("pl", encodeURIComponent(current));
      history.replaceState(null, "", "?" + params.toString());
    }
  }
  
  // Render sidebar and load the selected playlist
  renderSidebar();
  load(current);
}

// Initialize the page
initializePlaylist();
