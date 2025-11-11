# 🎮 Roblox Friend Tracker

A beautiful, real-time friend tracker for Roblox that shows which of your friends are online and what games they're playing. Built with vanilla JavaScript and designed to work on GitHub Pages.

![Roblox Friend Tracker](https://img.shields.io/badge/Roblox-Friend%20Tracker-00a2ff?style=for-the-badge)

## ✨ Features

- 🔐 **OAuth2.0 Authentication** - Secure login with your Roblox account
- 👥 **Friends List** - View all your Roblox friends in one place
- 🟢 **Real-time Status** - See who's online, offline, or in-game
- 🎮 **Game Tracking** - Know exactly which games your friends are playing
- 🔄 **Auto-refresh** - Automatic updates every 30 seconds
- 📱 **Responsive Design** - Works great on desktop and mobile
- 🌙 **Dark Theme** - Easy on the eyes with a modern dark interface

## 🚀 Demo

Visit the live demo: [Your GitHub Pages URL]

## 📋 Prerequisites

To use this application, you need:

1. A Roblox account
2. A GitHub account (for hosting on GitHub Pages)
3. A Roblox OAuth2.0 application (see setup instructions below)

## 🛠️ Setup Instructions

### Step 1: Fork and Clone

1. Fork this repository to your GitHub account
2. Clone it to your local machine (optional, can edit on GitHub)

### Step 2: Create a Roblox OAuth2.0 Application

1. Go to [Roblox Creator Dashboard](https://create.roblox.com/credentials)
2. Click "Create OAuth2.0 App"
3. Fill in the application details:
   - **Name**: Roblox Friend Tracker
   - **Description**: Track friends' online status
   - **Redirect URIs**: `https://YOUR_USERNAME.github.io/roblox-friend-tracker/callback.html`
     - Replace `YOUR_USERNAME` with your GitHub username
     - Replace `roblox-friend-tracker` if you renamed the repository
4. Select the required scopes:
   - `openid`
   - `profile`
5. Save your application and copy the **Client ID**

### Step 3: Configure the Application

1. Open `config.js` in the repository
2. Replace `YOUR_CLIENT_ID_HERE` with your actual Roblox OAuth2.0 Client ID
3. Update the `REDIRECT_URI` if you're using a custom domain or different repository name

```javascript
const CONFIG = {
    CLIENT_ID: 'your-actual-client-id-here',
    // ... rest of config
};
```

### Step 4: Enable GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select the branch you want to deploy (usually `main` or `master`)
4. Click "Save"
5. Your site will be published at `https://YOUR_USERNAME.github.io/roblox-friend-tracker/`

### Step 5: Test the Application

1. Visit your GitHub Pages URL
2. Click "Login with Roblox"
3. Authorize the application
4. View your friends and their online status!

## ⚠️ Important Notes

### OAuth2.0 Token Exchange

This application is designed for client-side use, but Roblox OAuth2.0 typically requires a server-side component for secure token exchange. There are two approaches:

#### Option 1: Backend Server (Recommended for Production)

For a production environment, you should:

1. Set up a backend server to handle the OAuth token exchange
2. Keep your client secret secure on the server
3. Proxy the token requests through your backend

Example backend endpoint structure:
```
POST /api/oauth/token
- Receives: authorization code
- Returns: access token
```

#### Option 2: PKCE (If Supported)

If Roblox supports PKCE (Proof Key for Code Exchange), you can use it for a more secure client-side flow without a backend.

### API Rate Limits

Be aware of Roblox API rate limits:
- The app auto-refreshes every 30 seconds
- Avoid excessive manual refreshes
- Consider increasing the refresh interval for larger friend lists

### Browser Compatibility

This application works best on modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari 13+

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #00a2ff;  /* Main accent color */
    --success-color: #10b981;   /* Online status */
    --warning-color: #f59e0b;   /* In-game status */
    /* ... more variables */
}
```

### Changing Refresh Interval

In `app.js`, modify the interval (in milliseconds):

```javascript
this.refreshInterval = setInterval(() => this.refreshFriends(), 30000); // 30 seconds
```

## 🔧 Development

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

3. Visit `http://localhost:8000`

### File Structure

```
roblox-friend-tracker/
├── index.html          # Main application page
├── callback.html       # OAuth callback handler
├── app.js             # Application logic
├── config.js          # OAuth configuration
├── styles.css         # Styling
└── README.md          # Documentation
```

## 🐛 Troubleshooting

### "OAuth Client ID not configured" warning

- Make sure you've updated `config.js` with your actual Client ID

### "Authentication failed" error

- Verify your redirect URI matches exactly in both the Roblox app settings and `config.js`
- Check that your Client ID is correct

### "Failed to load friends list" error

- Check browser console for detailed error messages
- Verify your access token is valid
- Try logging out and logging in again

### Friends not showing up

- Make sure your Roblox privacy settings allow friends to be visible
- Try refreshing the friends list manually
- Check if you have any friends (the list will be empty if you don't)

## 📝 License

This project is provided as-is for educational purposes. Feel free to modify and use it as you wish.

## ⚠️ Disclaimer

This application is not affiliated with, maintained, authorized, endorsed, or sponsored by Roblox Corporation. All product and company names are trademarks™ or registered® trademarks of their respective holders.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 💖 Support

If you find this project helpful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting improvements
- 🔀 Contributing code

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ for the Roblox community