const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Session storage (in-memory for simplicity)
const sessions = new Map();

// Helper function to read users from JSON file
async function readUsers() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to write users to JSON file
async function writeUsers(users) {
  await fs.writeFile(
    path.join(__dirname, 'data', 'users.json'),
    JSON.stringify(users, null, 2)
  );
}

// Generate session token
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware to check authentication
function requireAuth(req, res, next) {
  const sessionToken = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!sessionToken || !sessions.has(sessionToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = sessions.get(sessionToken);
  next();
}

// ===== AUTH ROUTES =====

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, privateName, imageUrl } = req.body;
    
    // Validation
    if (!username || !password || !privateName || !imageUrl) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one letter, one number, and one symbol' 
      });
    }
    
    // Image URL validation
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    if (!urlRegex.test(imageUrl)) {
      return res.status(400).json({ 
        error: 'Please enter a valid image URL (must start with http:// or https://)' 
      });
    }
    
    // Read existing users
    const users = await readUsers();
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Create new user
    const newUser = { username, password, privateName, imageUrl };
    users.push(newUser);
    
    // Save to file
    await writeUsers(users);
    
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Read users
    const users = await readUsers();
    
    // Find user
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, {
      username: user.username,
      privateName: user.privateName,
      imageUrl: user.imageUrl
    });
    
    // Return session token and user data
    res.json({
      sessionToken,
      user: {
        username: user.username,
        privateName: user.privateName,
        imageUrl: user.imageUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
  const sessionToken = req.headers['authorization']?.replace('Bearer ', '');
  sessions.delete(sessionToken);
  res.json({ message: 'Logout successful' });
});

// Get current user endpoint (to verify session)
app.get('/api/user', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ===== PLAYLIST ROUTES (Protected) =====

// Get user's playlists
app.get('/api/playlists', requireAuth, async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data', 'playlists.json'), 'utf8');
    const playlistsData = JSON.parse(data);
    
    const userPlaylists = playlistsData.user_playlists[req.user.username] || 
                         JSON.parse(JSON.stringify(playlistsData.default_playlists));
    
    res.json({ playlists: userPlaylists });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save user's playlists
app.post('/api/playlists', requireAuth, async (req, res) => {
  try {
    const { playlists } = req.body;
    
    // Read existing data
    const data = await fs.readFile(path.join(__dirname, 'data', 'playlists.json'), 'utf8');
    const playlistsData = JSON.parse(data);
    
    // Update user's playlists
    if (!playlistsData.user_playlists) {
      playlistsData.user_playlists = {};
    }
    playlistsData.user_playlists[req.user.username] = playlists;
    
    // Save back to file
    await fs.writeFile(
      path.join(__dirname, 'data', 'playlists.json'),
      JSON.stringify(playlistsData, null, 2)
    );
    
    res.json({ message: 'Playlists saved successfully' });
  } catch (error) {
    console.error('Save playlists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Authentication endpoints:');
  console.log('  POST /api/register - Register new user');
  console.log('  POST /api/login - Login user');
  console.log('  POST /api/logout - Logout user');
  console.log('  GET /api/user - Get current user');
  console.log('  GET /api/playlists - Get user playlists');
  console.log('  POST /api/playlists - Save user playlists');
});

