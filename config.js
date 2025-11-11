// Roblox OAuth2.0 Configuration
// To use this application, you need to:
// 1. Create an OAuth2.0 app at https://create.roblox.com/credentials
// 2. Replace the CLIENT_ID below with your app's client ID
// 3. Add your GitHub Pages URL to the redirect URIs in your Roblox app settings

const CONFIG = {
    // Replace this with your actual Roblox OAuth2.0 client ID
    CLIENT_ID: '5978660604237428347',

    // OAuth2.0 endpoints
    AUTHORIZE_URL: 'https://apis.roblox.com/oauth/v1/authorize',
    TOKEN_URL: 'https://apis.roblox.com/oauth/v1/token',

    // Required scopes for friend tracking
    SCOPES: ['openid', 'profile'],

    // Redirect URI - Update this to match your GitHub Pages URL
    // For GitHub Pages: https://USERNAME.github.io/REPO_NAME/callback.html
    REDIRECT_URI: window.location.href + 'callback.html',

    // API endpoints
    API_BASE_URL: 'https://apis.roblox.com',
    USERS_API: 'https://users.roblox.com',
    FRIENDS_API: 'https://friends.roblox.com',
    PRESENCE_API: 'https://presence.roblox.com',
    THUMBNAILS_API: 'https://thumbnails.roblox.com',
    GAMES_API: 'https://games.roblox.com',

    // Backend server configuration
    // Replace this with your backend server IP/URL (e.g., 'http://192.168.1.100:3001' or 'http://localhost:3001')
    BACKEND_URL: 'http://205.137.245.182:3001',
    // URL to start OAuth via backend. Frontend should open a popup to this URL with query params
    // Example: `${BACKEND_URL}/auth/start?client_id=...&redirect_uri=...`
    AUTH_START_URL: 'http://205.137.245.182:3001/auth/start',
    // Set to true to enable WebSocket connection for real-time friend tracking
    ENABLE_BACKEND_TRACKING: false
};

console.log("Redirect URL: " + CONFIG.REDIRECT_URI)

// Check if configuration is set up
if (CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
    console.warn('⚠️ OAuth Client ID not configured. Please update config.js with your Roblox OAuth2.0 credentials.');
}
