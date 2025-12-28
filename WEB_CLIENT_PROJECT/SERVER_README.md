# Web Client Project - Server-Side Authentication

## Overview
This project now includes a **Node.js/Express server** with server-side authentication and data management.

## Features

### 🔐 Authentication System
- **Register** - Create new user accounts
- **Login** - Authenticate with username/password
- **Logout** - End user session
- **Session Management** - Token-based authentication
- **Protected Routes** - Only logged-in users can access search and playlists

### 💾 Data Storage
- **Server-Side Storage** - Users stored in `data/users.json`
- **Playlists Storage** - Playlists stored in `data/playlists.json`
- **Per-User Data** - Each user has separate playlists
- **Automatic Backup** - localStorage fallback for offline capability

## Installation & Setup

### 1. Install Dependencies
```bash
cd WEB_CLIENT_PROJECT
npm install
```

### 2. Start the Server
```bash
npm start
```

Server will start on `http://localhost:3000`

### 3. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Authentication Endpoints

#### POST /api/register
Register a new user
```json
{
  "username": "string",
  "password": "string",
  "privateName": "string",
  "imageUrl": "string (URL)"
}
```

**Response:**
- 201: Registration successful
- 400: Validation error
- 500: Server error

#### POST /api/login
Login existing user
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "sessionToken": "string",
  "user": {
    "username": "string",
    "privateName": "string",
    "imageUrl": "string"
  }
}
```

#### POST /api/logout
Logout current user (requires authentication)

**Headers:**
```
Authorization: Bearer {sessionToken}
```

#### GET /api/user
Get current user info (requires authentication)

### Playlist Endpoints (Protected)

#### GET /api/playlists
Get user's playlists

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Response:**
```json
{
  "playlists": {
    "My Favorites": [],
    "Watch Later": [],
    ...
  }
}
```

#### POST /api/playlists
Save user's playlists

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Body:**
```json
{
  "playlists": {
    "My Favorites": [...],
    ...
  }
}
```

## File Structure

```
WEB_CLIENT_PROJECT/
├── server.js              # Express server with authentication
├── package.json           # Node.js dependencies
├── data/
│   ├── users.json        # User accounts (server-side)
│   └── playlists.json    # User playlists (server-side)
├── js/
│   ├── register.js       # Registration with API calls
│   ├── login.js          # Login with API calls
│   ├── search.js         # Search page (protected)
│   └── playlists.js      # Playlists page (protected)
├── register.html
├── login.html
├── search.html
├── playlists.html
└── index.html
```

## Security Features

### Password Requirements
- Minimum 6 characters
- Must contain at least one letter
- Must contain at least one number
- Must contain at least one special character

### Session Management
- Token-based authentication
- Tokens stored server-side
- Automatic session expiration on logout
- Protected routes require valid session

### Data Protection
- Users stored server-side only
- Playlists linked to authenticated users
- localStorage used only as backup/cache

## How It Works

### Registration Flow
1. User fills registration form
2. Client sends POST to `/api/register`
3. Server validates data
4. Server saves user to `users.json`
5. User redirected to login page

### Login Flow
1. User enters credentials
2. Client sends POST to `/api/login`
3. Server validates credentials
4. Server creates session token
5. Client stores token in localStorage
6. User redirected to search page

### Protected Page Access
1. User tries to access search.html or playlists.html
2. JavaScript checks for sessionToken
3. If no token → redirect to login.html
4. If token exists → make API calls with Authorization header
5. Server validates token
6. If invalid → return 401, client redirects to login
7. If valid → serve data

### Logout Flow
1. User clicks logout
2. Client sends POST to `/api/logout` with token
3. Server deletes session
4. Client clears localStorage
5. User redirected to home page

## Advantages of Server-Side Authentication

✅ **Security** - Passwords and user data stored server-side  
✅ **Scalability** - Can add database easily  
✅ **Centralized** - One source of truth for users  
✅ **Session Control** - Server can invalidate sessions  
✅ **Data Sync** - Playlists sync across devices  
✅ **Backup** - localStorage fallback if server unavailable  

## Testing

### Test User Registration
1. Go to `http://localhost:3000/register.html`
2. Create a user account
3. Check `data/users.json` - user should be added

### Test Login
1. Go to `http://localhost:3000/login.html`
2. Login with registered user
3. Should redirect to search page

### Test Protected Routes
1. Try to access `http://localhost:3000/search.html` without logging in
2. Should redirect to login page

### Test Logout
1. Login to the application
2. Click logout button
3. Should redirect to home page
4. Try to access search page again - should redirect to login

## Troubleshooting

### Server Won't Start
```bash
# Make sure dependencies are installed
npm install

# Check if port 3000 is already in use
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000

# Start server again
npm start
```

### Can't Access Pages
- Make sure server is running (`npm start`)
- Access via `http://localhost:3000` not `file://`

### Session Expired
- Login again
- Sessions are stored in memory and lost when server restarts

## Future Enhancements

Possible improvements:
- [ ] Database integration (MongoDB, PostgreSQL)
- [ ] Persistent sessions (Redis, database)
- [ ] Password hashing (bcrypt)
- [ ] Email verification
- [ ] Password reset functionality
- [ ] JWT tokens instead of random tokens
- [ ] Rate limiting for security
- [ ] HTTPS support
- [ ] CORS configuration for production

## Author
Asaf Haberer - 206760381

