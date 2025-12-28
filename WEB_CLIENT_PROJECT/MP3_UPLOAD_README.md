# MP3 Upload Feature

## Overview
Users can now upload MP3 files directly to the server and add them to their playlists alongside YouTube videos.

## Features

### 🎵 MP3 Upload
- ✅ Upload MP3 files up to 10MB
- ✅ Add custom song titles
- ✅ Add to existing or new playlists
- ✅ Files stored on server
- ✅ Progress indicator during upload
- ✅ Error handling

### 🎧 MP3 Playback
- ✅ Play MP3 files directly in browser
- ✅ Audio player modal with controls
- ✅ Visual badge showing "MP3" on thumbnails
- ✅ Mixed playlists (YouTube + MP3)

### 📊 Integration
- ✅ MP3s appear in playlists with YouTube videos
- ✅ Can rate MP3 files (0-5 stars)
- ✅ Can sort MP3s with other songs
- ✅ Can search/filter MP3s
- ✅ Can delete MP3s from playlists

## How to Use

### Upload MP3 File

1. **Go to Search Page**
   - Click the **"Upload MP3"** button (green button next to search)

2. **Upload Modal Opens**
   - Select an MP3 file from your computer
   - Enter a song title
   - Choose existing playlist or create new one
   - Click **"Upload & Add to Playlist"**

3. **Progress Indicator**
   - Shows upload progress
   - Displays success message
   - Automatically added to selected playlist

4. **View in Playlist**
   - Go to Playlists page
   - MP3 files show green "MP3" badge
   - Click thumbnail to play

### Play MP3 File

**From Playlists Page:**
1. Navigate to playlist containing MP3
2. Click on MP3 thumbnail
3. Audio player modal opens
4. Use controls to play/pause/seek

## Technical Details

### File Storage
```
WEB_CLIENT_PROJECT/
└── uploads/
    ├── 1234567890-song1.mp3
    ├── 1234567891-song2.mp3
    └── ...
```

### Filename Format
```
timestamp-sanitized_filename.mp3
Example: 1701234567890-My_Song.mp3
```

### Data Structure
MP3 files in playlists:
```json
{
  "id": "1701234567890-My_Song.mp3",
  "title": "My Awesome Song",
  "img": "https://via.placeholder.com/320x180/667eea/ffffff?text=MP3",
  "rating": 0,
  "type": "mp3",
  "url": "/uploads/1701234567890-My_Song.mp3",
  "originalName": "My Song.mp3"
}
```

YouTube videos in playlists:
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "img": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  "rating": 0
}
```

### API Endpoint

**POST /api/upload-mp3**
- **Authentication:** Required (Bearer token)
- **Method:** multipart/form-data
- **Field:** `mp3file` (file upload)
- **Max Size:** 10MB
- **Accepted:** .mp3, audio/mpeg

**Request:**
```javascript
const formData = new FormData();
formData.append('mp3file', file);

fetch('/api/upload-mp3', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  body: formData
});
```

**Response (Success):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "filename": "1701234567890-My_Song.mp3",
    "originalName": "My Song.mp3",
    "size": 3145728,
    "url": "/uploads/1701234567890-My_Song.mp3"
  }
}
```

**Response (Error):**
```json
{
  "error": "Only MP3 files are allowed"
}
```

## File Upload Validation

### Client-Side
- ✅ File type check (accept=".mp3,audio/mpeg")
- ✅ Title validation (required)
- ✅ Playlist validation (required)

### Server-Side
- ✅ MIME type check (audio/mpeg)
- ✅ File extension check (.mp3)
- ✅ Size limit (10MB)
- ✅ Authentication required

## Security Features

### Upload Security
- ✅ Authentication required for uploads
- ✅ File type validation (server-side)
- ✅ File size limits
- ✅ Unique filenames (timestamp-based)
- ✅ Sanitized filenames (spaces replaced)
- ✅ Files stored outside web root access

### Access Control
- ✅ Only authenticated users can upload
- ✅ Only authenticated users can access uploads
- ✅ Files linked to user's playlists
- ✅ Server-side session validation

## Visual Indicators

### MP3 vs YouTube
- **MP3 Files:** Green "MP3" badge on top-left of thumbnail
- **YouTube Videos:** No badge
- **Default MP3 Image:** Purple placeholder with "MP3" text

### Playback Differences
- **MP3:** Opens audio player modal with controls
- **YouTube:** Opens YouTube in new tab

## Example Usage

### Upload Example
```javascript
// 1. User clicks "Upload MP3" button
openUploadModal();

// 2. User selects file and fills form
// 3. User clicks "Upload & Add to Playlist"
uploadMP3();

// 4. File uploads to server
// 5. Added to user's playlist
// 6. Synced to server
// 7. Success toast displayed
```

### Playback Example
```javascript
// When user clicks MP3 thumbnail
playMP3('/uploads/1234567890-song.mp3', 'My Song');

// Creates modal with HTML5 audio player
<audio controls autoplay>
  <source src="/uploads/1234567890-song.mp3" type="audio/mpeg">
</audio>
```

## Mixed Playlist Example

```json
{
  "My Favorites": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "img": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      "rating": 5
    },
    {
      "id": "1701234567890-My_Song.mp3",
      "title": "My Awesome Song",
      "img": "https://via.placeholder.com/320x180/667eea/ffffff?text=MP3",
      "rating": 4,
      "type": "mp3",
      "url": "/uploads/1701234567890-My_Song.mp3"
    },
    {
      "id": "9bZkp7q19f0",
      "title": "PSY - GANGNAM STYLE",
      "img": "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg",
      "rating": 5
    }
  ]
}
```

## Troubleshooting

### Upload Fails
- **Check file type:** Must be .mp3
- **Check file size:** Max 10MB
- **Check server:** Must be running
- **Check authentication:** Must be logged in

### Can't Play MP3
- **Check browser:** HTML5 audio support required
- **Check file:** Make sure file uploaded successfully
- **Check URL:** File accessible at `/uploads/filename.mp3`

### File Not Found
- **Server restart:** Uploads stored in memory during development
- **Check uploads folder:** Files should exist in `uploads/` directory
- **Check permissions:** Server needs write access to uploads folder

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

### Required Features
- HTML5 audio support
- File API support
- FormData API support
- Fetch API support

## Advantages

✅ **Personal Music Library** - Upload your own music  
✅ **Unified Playlists** - Mix YouTube + personal MP3s  
✅ **Server Storage** - Access from any device  
✅ **Ratings** - Rate both YouTube and MP3 files  
✅ **Sorting** - Sort mixed playlists  
✅ **Search** - Search across all songs  
✅ **Portable** - Take your music anywhere  

## Future Enhancements

Possible improvements:
- [ ] Album art upload
- [ ] ID3 tag reading
- [ ] Playlist export/import
- [ ] Batch upload multiple files
- [ ] Audio format conversion
- [ ] Waveform visualization
- [ ] File size optimization
- [ ] Cloud storage integration (S3, etc.)
- [ ] Download MP3 from playlist
- [ ] Share MP3 with other users

