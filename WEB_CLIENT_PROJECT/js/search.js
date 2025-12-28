const user = JSON.parse(localStorage.getItem("loggedUser"));
const sessionToken = localStorage.getItem("sessionToken");

// Redirect if not logged in
if (!user || !sessionToken) {
  window.location.href = "login.html";
}

// Load playlists from server
const playlistKey = `playlists_${user.username}`;
let userPlaylists = {};

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
        alert('Session expired. Please login again.');
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("loggedUser");
        window.location.href = "login.html";
        return;
      }
      throw new Error('Failed to load playlists');
    }
    
    const data = await response.json();
    userPlaylists = data.playlists;
    
    // Also save to localStorage as backup
    localStorage.setItem(playlistKey, JSON.stringify(userPlaylists));
  } catch (error) {
    console.error('Error loading playlists:', error);
    // Fallback to localStorage
    userPlaylists = JSON.parse(localStorage.getItem(playlistKey)) || {
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
      body: JSON.stringify({ playlists: userPlaylists })
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
    localStorage.setItem(playlistKey, JSON.stringify(userPlaylists));
  } catch (error) {
    console.error('Error saving playlists:', error);
    // Still save to localStorage as fallback
    localStorage.setItem(playlistKey, JSON.stringify(userPlaylists));
  }
}

const YOUTUBE_API_KEY = "AIzaSyBntAKflManq3YtazoZVdb7j8Qq1yrRNQY";

// Load user info in navbar
document.getElementById('userName').textContent = user.privateName;
document.getElementById('userImg').src = user.imageUrl;

// DOM element references
const query = document.getElementById('query');
const searchBtn = document.getElementById('searchBtn');
const results = document.getElementById('results');
const player = document.getElementById('player');
const playerModal = document.getElementById('playerModal');

// Initialize the page
async function initializePage() {
  // Load playlists first
  await loadPlaylistsFromServer();
  
  // Restore from QueryString or localStorage
  const params = new URLSearchParams(location.search);
  if (params.get("q")) {
    query.value = params.get("q");
    // Try to load cached results first
    const cachedResults = localStorage.getItem("lastSearchResults");
    const lastSearch = localStorage.getItem("lastSearch");
    
    if (cachedResults && lastSearch === params.get("q")) {
      // Use cached results
      console.log('Using cached results');
      showResults(JSON.parse(cachedResults));
    } else {
      // Make new API call
      search();
    }
  } else {
    // Check for last search in localStorage
    const lastSearch = localStorage.getItem("lastSearch");
    const cachedResults = localStorage.getItem("lastSearchResults");
    
    if (lastSearch && cachedResults) {
      query.value = lastSearch;
      // Display cached results without making API call
      console.log('Using cached results from last session');
      showResults(JSON.parse(cachedResults));
    }
  }
}

// Start initialization
initializePage();

searchBtn.onclick = search;

// Add Enter key support for search input
query.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent form submission if in a form
    search();
  }
});

function search() {
  const q = query.value;
  if (!q) return;

  const params = new URLSearchParams(location.search);
  params.set("q", q);
  history.replaceState(null, "", "?" + params.toString());

  // Show loading message
  results.innerHTML = '<div class="col-12 text-center"><h4>Loading...</h4></div>';

  fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=7&q=${q}&key=${YOUTUBE_API_KEY}`)
    .then(r => {
      console.log('Search API Response:', r);
      return r.json();
    })
    .then(data => {
      console.log('Search API Data:', data);
      
      // Check for API errors
      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }
      
      // Check if we have results
      if (!data.items || data.items.length === 0) {
        results.innerHTML = '<div class="col-12 text-center"><h4>No results found</h4></div>';
        return;
      }
      
      // Get video IDs for detailed info
      const videoIds = data.items.map(item => item.id.videoId).join(',');

      // Get detailed video information
      return fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`)
        .then(r => r.json())
        .then(details => {
          console.log('Video Details:', details);
          
          // Combine search results with detailed info
          const combinedData = data.items.map(searchItem => {
            const detailItem = details.items.find(d => d.id === searchItem.id.videoId);
            return {
              ...searchItem,
              statistics: detailItem?.statistics || {},
              contentDetails: detailItem?.contentDetails || {}
            };
          });
          return combinedData;
        });
    })
    .then(data => {
      // Save results to localStorage for caching
      if (data && data.length > 0) {
        localStorage.setItem("lastSearchResults", JSON.stringify(data));
      }
      showResults(data);
    })
    .catch(error => {
      console.error('Search Error:', error);
      results.innerHTML = `<div class="col-12 text-center"><div class="alert alert-danger">Error: ${error.message}</div></div>`;
    });

  localStorage.setItem("lastSearch", q);
}

// Helper function to format duration from ISO 8601 to readable format
function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = (match[1] || '').replace('H', '') || 0;
  const minutes = (match[2] || '').replace('M', '') || 0;
  const seconds = (match[3] || '').replace('S', '') || 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to format view count
function formatViews(views) {
  return new Intl.NumberFormat().format(views || 0);
}

// Helper function to check if video is already in favorites
function isVideoInFavorites(videoId) {
  for (const playlistName in userPlaylists) {
    if (userPlaylists[playlistName].some(video => video.id === videoId)) {
      return true;
    }
  }
  return false;
}

function showResults(data) {
  console.log('Showing results:', data);
  results.innerHTML = "";
  
  // Safety check
  if (!data || data.length === 0) {
    results.innerHTML = '<div class="col-12 text-center"><h4>No results found</h4></div>';
    return;
  }

  data.forEach(v => {
    const id = v.id.videoId;
    const title = v.snippet.title;
    const img = v.snippet.thumbnails.medium.url;
    const duration = formatDuration(v.contentDetails.duration || 'PT0S');
    const views = formatViews(v.statistics.viewCount);
    const alreadyInFavorites = isVideoInFavorites(id);

    const card = document.createElement("div");
    card.className = "col-md-4 mb-4";
    card.innerHTML = `
      <div class="card h-100">
        <div class="position-relative">
          <img src="${img}" class="card-img-top" style="cursor:pointer">
          <span class="badge bg-dark position-absolute bottom-0 end-0 m-2">${duration}</span>
          ${alreadyInFavorites ? '<i class="fas fa-check position-absolute top-0 end-0 m-2 text-success" style="font-size: 1.2rem;"></i>' : ''}
        </div>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; height: 2.6em;" title="${title}">${title}</h6>
          <div class="mt-auto">
            <div class="text-muted small mb-2">
              <i class="fas fa-eye me-1"></i>${views} views
            </div>
            <button class="btn btn-sm w-100 addFav ${alreadyInFavorites ? 'btn-secondary' : 'btn-outline-success'}" ${alreadyInFavorites ? 'disabled' : ''}>
              <i class="fas ${alreadyInFavorites ? 'fa-check' : 'fa-star'} me-1"></i>${alreadyInFavorites ? 'Already in Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>`;

    // Play video on image click
    card.querySelector("img").onclick = () => play(id);

    // Play video on title click
    card.querySelector("h6").onclick = () => play(id);

    // Add to favorites (only if not already in favorites)
    if (!alreadyInFavorites) {
      card.querySelector(".addFav").onclick = () => openPlaylistModal(id, title, img);
    }

    results.appendChild(card);
  });
}

function play(id) {
  player.src = `https://www.youtube.com/embed/${id}`;
  new bootstrap.Modal(playerModal).show();
}

// Open playlist modal for adding video
function openPlaylistModal(videoId, title, img) {
  // Store video data for later use
  window.currentVideoData = { id: videoId, title, img };

  // Populate existing playlists dropdown
  const playlistSelect = document.getElementById('playlistSelect');
  playlistSelect.innerHTML = '<option value="">Choose existing playlist...</option>';

  Object.keys(userPlaylists).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    playlistSelect.appendChild(option);
  });

  // Clear new playlist input
  document.getElementById('newPlaylistName').value = '';

  // Show modal
  new bootstrap.Modal(document.getElementById('playlistModal')).show();
}


// Handle adding video to playlist
document.getElementById('confirmAddBtn').onclick = function () {
  const playlistSelect = document.getElementById('playlistSelect');
  const newPlaylistName = document.getElementById('newPlaylistName');
  const videoData = window.currentVideoData;

  if (!videoData) return;

  let playlistName = playlistSelect.value || newPlaylistName.value.trim();

  if (!playlistName) {
    alert('Please select an existing playlist or enter a new playlist name.');
    return;
  }

  // Check if video already exists in the selected playlist
  if (userPlaylists[playlistName] && userPlaylists[playlistName].some(video => video.id === videoData.id)) {
    alert('This video is already in the selected playlist.');
    return;
  }

  // Add video to playlist
  if (!userPlaylists[playlistName]) {
    userPlaylists[playlistName] = [];
  }
  userPlaylists[playlistName].push({ id: videoData.id, title: videoData.title, img: videoData.img, rating: 0 });

  // Save to server
  savePlaylistsToServer();

  // Close playlist modal
  bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();

  // Show success toast notification with the specific playlist name
  showSuccessToast(playlistName);

  // Refresh search results to update the "already in favorites" badges
  // Use cached results if available to avoid API call
  const cachedResults = localStorage.getItem("lastSearchResults");
  if (cachedResults) {
    showResults(JSON.parse(cachedResults));
  } else {
    search();
  }
};

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

// Show success toast notification
function showSuccessToast(playlistName) {
  const toastElement = document.getElementById('successToast');
  const toastBody = toastElement.querySelector('.toast-body');
  
  // Update the toast message with the specific playlist link
  const encodedPlaylistName = encodeURIComponent(playlistName);
  toastBody.innerHTML = `
    <i class="fas fa-check-circle me-2"></i>
    Song was added successfully to <strong>${playlistName}</strong>! 
    <a href="playlists.html?pl=${encodedPlaylistName}" class="text-white fw-bold text-decoration-underline">Visit playlist →</a>
  `;
  
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 5000  // 5 seconds
  });
  toast.show();
}

// Open upload modal
function openUploadModal() {
  const uploadPlaylistSelect = document.getElementById('uploadPlaylistSelect');
  uploadPlaylistSelect.innerHTML = '<option value="">Choose existing playlist...</option>';
  
  Object.keys(userPlaylists).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    uploadPlaylistSelect.appendChild(option);
  });
  
  // Clear inputs
  document.getElementById('mp3FileInput').value = '';
  document.getElementById('mp3Title').value = '';
  document.getElementById('uploadNewPlaylistName').value = '';
  document.getElementById('uploadError').classList.add('d-none');
  document.getElementById('uploadProgress').classList.add('d-none');
  
  new bootstrap.Modal(document.getElementById('uploadModal')).show();
}

// Upload MP3 file
async function uploadMP3() {
  const fileInput = document.getElementById('mp3FileInput');
  const titleInput = document.getElementById('mp3Title');
  const playlistSelect = document.getElementById('uploadPlaylistSelect');
  const newPlaylistInput = document.getElementById('uploadNewPlaylistName');
  const uploadBtn = document.getElementById('confirmUploadBtn');
  const errorDiv = document.getElementById('uploadError');
  const progressDiv = document.getElementById('uploadProgress');
  const progressBar = progressDiv.querySelector('.progress-bar');
  
  // Validation
  if (!fileInput.files || !fileInput.files[0]) {
    errorDiv.textContent = 'Please select an MP3 file';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  const title = titleInput.value.trim();
  if (!title) {
    errorDiv.textContent = 'Please enter a song title';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  const playlistName = playlistSelect.value || newPlaylistInput.value.trim();
  if (!playlistName) {
    errorDiv.textContent = 'Please select or create a playlist';
    errorDiv.classList.remove('d-none');
    return;
  }
  
  const file = fileInput.files[0];
  
  // Disable button and show progress
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  errorDiv.classList.add('d-none');
  progressDiv.classList.remove('d-none');
  progressBar.style.width = '0%';
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('mp3file', file);
    
    // Upload file
    const response = await fetch('/api/upload-mp3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      body: formData
    });
    
    progressBar.style.width = '50%';
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }
    
    const data = await response.json();
    progressBar.style.width = '75%';
    
    // Try to get YouTube thumbnail for the song
    let songImage;
    try {
      const youtubeResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(title)}&key=${YOUTUBE_API_KEY}`);
      if (youtubeResponse.ok) {
        const youtubeData = await youtubeResponse.json();
        if (youtubeData.items && youtubeData.items.length > 0) {
          songImage = youtubeData.items[0].snippet.thumbnails.medium.url;
          console.log('Found YouTube thumbnail for:', title);
        }
      }
    } catch (error) {
      console.log('Could not fetch YouTube thumbnail, using default');
    }
    
    // Fallback to SVG icon if YouTube search failed
    if (!songImage) {
      songImage = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
          <rect width="320" height="180" fill="#667eea"/>
          <circle cx="160" cy="90" r="50" fill="rgba(255,255,255,0.2)"/>
          <path d="M140 70 L140 110 C140 115 135 120 130 120 C125 120 120 115 120 110 C120 105 125 100 130 100 C132 100 134 101 135 102 L135 75 L170 70 L170 100 C170 105 165 110 160 110 C155 110 150 105 150 100 C150 95 155 90 160 90 C162 90 164 91 165 92 L165 65 Z" fill="white"/>
          <text x="160" y="155" font-family="Arial" font-size="18" fill="white" text-anchor="middle" font-weight="bold">MP3 AUDIO</text>
        </svg>
      `);
    }
    
    // Add to playlist
    if (!userPlaylists[playlistName]) {
      userPlaylists[playlistName] = [];
    }
    
    userPlaylists[playlistName].push({
      id: data.file.filename,
      title: title,
      img: songImage,
      rating: 0,
      type: 'mp3',
      url: data.file.url,
      originalName: data.file.originalName
    });
    
    // Save to server
    await savePlaylistsToServer();
    progressBar.style.width = '100%';
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
    
    // Show success message
    showSuccessToast(playlistName);
    
  } catch (error) {
    console.error('Upload error:', error);
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('d-none');
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload & Add to Playlist';
    progressDiv.classList.add('d-none');
  }
}
