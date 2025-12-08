//get HTML DOM element references
const form = document.getElementById("songForm");
const list = document.getElementById("songList");
const submitBtn = document.getElementById("submitBtn");

//if playlist doesn't exist in loacl storage, get empty array
//else get json tetx and convert it to json object
let songs = JSON.parse(localStorage.getItem("playlist")) || [];

// View mode: 'table' or 'cards' (persisted in localStorage)
let viewMode = localStorage.getItem('viewMode') || 'table';

const viewToggleBtn = document.getElementById('viewToggleBtn');
const viewToggleIcon = document.getElementById('viewToggleIcon');
const cardContainer = document.getElementById('cardContainer');

// Function to extract YouTube video ID from URL
function getYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Function to get YouTube thumbnail URL
function getYouTubeThumbnail(url) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return null;
}

// Function to play video in modal
function playVideo(url, title) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        document.getElementById("videoPlayer").src = embedUrl;
        document.getElementById("videoTitle").textContent = title;

        // Show the modal
        const videoModal = new bootstrap.Modal(document.getElementById("videoModal"));
        videoModal.show();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Load existing songs from local storage and render
    // Wire up controls (sort, search, view toggle)
    document.getElementById("sort").addEventListener("change", renderSongs);
    document.getElementById("search").addEventListener("input", renderSongs);

    // Initialize view toggle button and icon
    if (viewToggleBtn) {
        updateViewToggleIcon();
        viewToggleBtn.addEventListener('click', () => {
            viewMode = (viewMode === 'table') ? 'cards' : 'table';
            localStorage.setItem('viewMode', viewMode);
            updateViewToggleIcon();
            renderSongs();
        });
    }

    renderSongs();
});

//user click "add" button
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const url = document.getElementById("url").value;
    const rank = document.getElementById("rank").value;
    const id = document.getElementById("songId").value;

    if (id) {
        // UPDATE an existing song
        updateSong(Number(id), title, url, rank);
    } else {
        // ADD a new song
        const song = {
            id: Date.now(),
            title,
            url,
            rank: Number(rank),
            dateAdded: Date.now(),
        };
        songs.push(song);
    }

    saveAndRender();
    form.reset();
});

//save to local storage and render UI table
function saveAndRender() {
    localStorage.setItem("playlist", JSON.stringify(songs));

    renderSongs();
}

// Function to get sorted and filtered songs
function getSortedAndFilteredSongs() {
    const sortValue = document.getElementById("sort").value;
    const searchValue = document.getElementById("search").value.toLowerCase();

    // Filter songs by search term
    let filtered = songs.filter(song =>
        song.title.toLowerCase().includes(searchValue)
    );

    // Sort songs based on selected option
    let sorted = [...filtered]; // Create a copy to avoid modifying original

    switch (sortValue) {
        case "az":
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case "za":
            sorted.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case "newest":
            sorted.sort((a, b) => b.dateAdded - a.dateAdded);
            break;
        case "oldest":
            sorted.sort((a, b) => a.dateAdded - b.dateAdded);
            break;
        case "top-rated":
            sorted.sort((a, b) => (b.rank || 0) - (a.rank || 0));
            break;
        case "bottom-rated":
            sorted.sort((a, b) => (a.rank || 0) - (b.rank || 0));
            break;
        default:
            sorted.sort((a, b) => b.dateAdded - a.dateAdded);
    }

    return sorted;
}

function updateViewToggleIcon() {
    if (!viewToggleIcon) return;
    // If current view is table, show grid icon (to switch to cards)
    if (viewMode === 'table') {
        viewToggleIcon.className = 'fas fa-th';
    } else {
        // cards view -> show list icon (to switch to table)
        viewToggleIcon.className = 'fas fa-list';
    }
}

function renderSongsTable(songsToDisplay) {
    // Ensure table visible, cards hidden
    const songsTable = document.getElementById('songsTable');
    if (songsTable) songsTable.style.display = '';
    if (cardContainer) cardContainer.style.display = 'none';

    list.innerHTML = ""; // Clear current list
    songsToDisplay.forEach((song) => {
        const row = document.createElement("tr");
        const thumbnailUrl = getYouTubeThumbnail(song.url);

        row.innerHTML = `
            <td>
                ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="Thumbnail" style="max-width: 80px; height: auto; cursor: pointer;" onclick="playVideo('${song.url}', '${song.title}')">` : '<span class="text-muted">No thumbnail</span>'}
            </td>
            <td>${song.title}</td>
            <td><button class="btn btn-sm btn-info" onclick="playVideo('${song.url}', '${song.title}')">Watch</button></td>
            <td>${song.rank || 'N/A'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-warning me-2" onclick="editSong(${song.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSong(${song.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

function renderSongsCards(songsToDisplay) {
    // Show card container, hide table
    const songsTable = document.getElementById('songsTable');
    if (songsTable) songsTable.style.display = 'none';
    if (cardContainer) cardContainer.style.display = '';

    cardContainer.innerHTML = '';
    songsToDisplay.forEach(song => {
        const thumbnailUrl = getYouTubeThumbnail(song.url);
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';

        col.innerHTML = `
            <div class="card h-100">
                ${thumbnailUrl ? `<img src="${thumbnailUrl}" class="card-img-top" alt="${song.title}">` : ''}
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${song.title}</h5>
                    <p class="card-text mb-1"><strong>Rank:</strong> ${song.rank || 'N/A'}</p>
                    <div class="mt-auto d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-info" onclick="playVideo('${song.url}', '${song.title}')">Watch</button>
                        <button class="btn btn-sm btn-warning" onclick="editSong(${song.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSong(${song.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;

        cardContainer.appendChild(col);
    });
}

function renderSongs() {
    // Get sorted and filtered songs
    const songsToDisplay = getSortedAndFilteredSongs();

    if (viewMode === 'cards') {
        renderSongsCards(songsToDisplay);
    } else {
        renderSongsTable(songsToDisplay);
    }
}

function deleteSong(id) {
    if (confirm("Are you sure?")) {
        // Check if the song being deleted is currently being edited
        const currentlyEditingId = document.getElementById("songId").value;

        // Filter out the song with the matching ID
        songs = songs.filter((song) => song.id !== id);

        // If the deleted song was being edited, reset the form
        if (String(currentlyEditingId) === String(id)) {
            form.reset();
            document.getElementById("songId").value = "";
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
            submitBtn.classList.replace("btn-warning", "btn-success");
        }

        saveAndRender();
    }
}

function editSong(id) {
    const songToEdit = songs.find((song) => song.id === id);

    document.getElementById("title").value = songToEdit.title;
    document.getElementById("url").value = songToEdit.url;
    document.getElementById("rank").value = songToEdit.rank || "";
    document.getElementById("songId").value = songToEdit.id; // Set Hidden ID

    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update';
    submitBtn.classList.replace("btn-success", "btn-warning");
}

function updateSong(id, title, url, rank) {
    const index = songs.findIndex((song) => song.id == id);

    songs[index].title = title;
    songs[index].url = url;
    songs[index].rank = Number(rank);

    document.getElementById("songId").value = "";
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
    submitBtn.classList.replace("btn-warning", "btn-success");
}
