# Search Result Caching System

## Overview
The search page now caches search results in localStorage to avoid making repeated API calls and hitting quota limits.

## How It Works

### 1. **First Search**
When you search for something (e.g., "Queen"):
1. API call is made to YouTube
2. Results are displayed
3. Results are saved to localStorage as `lastSearchResults`
4. Search query is saved as `lastSearch`

### 2. **Returning to Search Page**
When you come back to the search page:
- The page checks if there's a `lastSearch` and `lastSearchResults` in localStorage
- If found, it displays the cached results **without making an API call**
- The search box is pre-filled with your last search

### 3. **New Search**
When you type a new search query:
- A new API call is made
- Old cached results are replaced with new ones

### 4. **After Adding to Playlist**
When you add a video to a playlist:
- The page refreshes the display using **cached results** (no API call)
- This updates the "Already in Favorites" badges without consuming API quota

## Benefits

✅ **Faster Loading** - No waiting for API on page reload  
✅ **API Quota Saving** - Reduces unnecessary API calls  
✅ **Better User Experience** - Instant results when returning to page  
✅ **Offline-like Behavior** - Can view last search even if API is down  

## localStorage Keys Used

| Key | Description | Example |
|-----|-------------|---------|
| `lastSearch` | The last search query | `"Queen Bohemian Rhapsody"` |
| `lastSearchResults` | Full JSON of search results | `[{...}, {...}]` |
| `playlists_${username}` | User's playlists | `{"My Favorites": [...]}` |

## Cache Invalidation

The cache is updated when:
- User performs a new search (different query)
- User manually searches again (same query, clicks search button)

The cache persists until:
- Browser data is cleared
- A new search is performed

## Testing

1. **Search for something** (e.g., "Queen")
2. **Navigate away** (go to Playlists page)
3. **Come back** to Search page
4. Results should appear **instantly** without API call
5. Check browser console - you'll see: `"Using cached results from last session"`

## API Quota Management

This system helps manage YouTube API quota by:
- Only calling API when necessary (new searches)
- Reusing results when appropriate (page reload, adding to playlist)
- Allowing continued use even after quota is exceeded (for last search)

## Notes

- Each user sees their own cached results (not shared between users)
- Cache is browser-specific (different browsers = different caches)
- Cache is cleared when user clears browser data

