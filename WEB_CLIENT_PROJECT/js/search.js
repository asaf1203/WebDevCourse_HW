const user = JSON.parse(localStorage.getItem("loggedUser"));

// Load playlists from localStorage for this specific user
const playlistKey = `playlists_${user.username}`;
let userPlaylists = JSON.parse(localStorage.getItem(playlistKey)) || {
  "My Favorites": [],
  "Watch Later": [],
  "Music": []
};

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

  // Save to localStorage for this user
  localStorage.setItem(playlistKey, JSON.stringify(userPlaylists));

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
  sessionStorage.removeItem("currentUser");
  localStorage.removeItem("loggedUser");
  location.href = "index.html";
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
