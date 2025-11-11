// Roblox Friend Tracker Application

class RobloxFriendTracker {
    constructor() {
        this.accessToken = null;
        this.userData = null;
        this.friends = [];
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        // Check if we have a stored token
        this.accessToken = localStorage.getItem('roblox_access_token');
        
        if (this.accessToken) {
            this.showAppSection();
            this.loadUserData();
        } else {
            this.showAuthSection();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        const filterOnline = document.getElementById('filter-online');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.initiateLogin());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshFriends());
        }

        if (filterOnline) {
            filterOnline.addEventListener('change', () => this.renderFriends());
        }
    }

    // OAuth2.0 Login Flow
    initiateLogin() {
        // Generate a random state parameter for security
        const state = this.generateRandomString(32);
        localStorage.setItem('oauth_state', state);

        // Construct the authorization URL
        const params = new URLSearchParams({
            client_id: CONFIG.CLIENT_ID,
            redirect_uri: CONFIG.REDIRECT_URI,
            scope: CONFIG.SCOPES.join(' '),
            response_type: 'code',
            state: state
        });

        const authUrl = `${CONFIG.AUTHORIZE_URL}?${params.toString()}`;
        
        // Redirect to Roblox OAuth page
        window.location.href = authUrl;
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    logout() {
        localStorage.removeItem('roblox_access_token');
        localStorage.removeItem('roblox_user_data');
        this.accessToken = null;
        this.userData = null;
        this.friends = [];
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.showAuthSection();
    }

    async loadUserData() {
        try {
            // Try to get cached user data first
            const cachedData = localStorage.getItem('roblox_user_data');
            if (cachedData) {
                this.userData = JSON.parse(cachedData);
                this.updateUserUI();
            }

            // Fetch fresh user data using the access token
            const userInfo = await this.fetchWithAuth(`${CONFIG.API_BASE_URL}/oauth/v1/userinfo`);
            
            if (userInfo) {
                // Get additional user details
                const userDetails = await this.fetchRobloxAPI(`${CONFIG.USERS_API}/v1/users/${userInfo.sub}`);
                
                this.userData = {
                    id: userInfo.sub,
                    username: userInfo.preferred_username || userInfo.name,
                    displayName: userDetails?.displayName || userInfo.name,
                    avatar: userInfo.picture
                };

                localStorage.setItem('roblox_user_data', JSON.stringify(this.userData));
                this.updateUserUI();
                this.loadFriends();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleAuthError();
        }
    }

    async fetchWithAuth(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (response.status === 401) {
            this.handleAuthError();
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async fetchRobloxAPI(url, options = {}) {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    handleAuthError() {
        this.showError('Authentication failed. Please login again.');
        setTimeout(() => this.logout(), 2000);
    }

    updateUserUI() {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userStatus = document.getElementById('user-status');

        if (userAvatar) userAvatar.src = this.userData.avatar || 'https://via.placeholder.com/60';
        if (userName) userName.textContent = this.userData.displayName || this.userData.username;
        if (userStatus) userStatus.textContent = `@${this.userData.username}`;
    }

    async loadFriends() {
        try {
            this.showLoading();

            // Fetch friends list - Note: Roblox API requires authentication
            // Using the public friends API with user ID
            const friendsData = await this.fetchRobloxAPI(
                `${CONFIG.FRIENDS_API}/v1/users/${this.userData.id}/friends`
            );

            if (friendsData && friendsData.data) {
                this.friends = friendsData.data;
                
                // Get presence information for all friends
                await this.loadFriendsPresence();
                
                this.renderFriends();
                this.updateStats();

                // Set up auto-refresh every 30 seconds
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                }
                this.refreshInterval = setInterval(() => this.refreshFriends(), 30000);
            }
        } catch (error) {
            console.error('Error loading friends:', error);
            this.showError('Failed to load friends list. Please try refreshing.');
        }
    }

    async loadFriendsPresence() {
        try {
            // Batch friends into groups of 50 for presence API
            const batchSize = 50;
            const friendIds = this.friends.map(f => f.id);
            
            for (let i = 0; i < friendIds.length; i += batchSize) {
                const batch = friendIds.slice(i, i + batchSize);
                const presenceData = await this.fetchRobloxAPI(
                    `${CONFIG.PRESENCE_API}/v1/presence/users`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userIds: batch })
                    }
                );

                if (presenceData && presenceData.userPresences) {
                    // Update friends with presence info
                    presenceData.userPresences.forEach(presence => {
                        const friend = this.friends.find(f => f.id === presence.userId);
                        if (friend) {
                            friend.presence = presence;
                        }
                    });
                }
            }

            // Load game details for friends in games
            await this.loadGameDetails();
        } catch (error) {
            console.error('Error loading presence:', error);
        }
    }

    async loadGameDetails() {
        const friendsInGames = this.friends.filter(
            f => f.presence && f.presence.userPresenceType === 2 && f.presence.placeId
        );

        if (friendsInGames.length === 0) return;

        try {
            const placeIds = [...new Set(friendsInGames.map(f => f.presence.placeId))];
            
            // Get universe IDs from place IDs
            const universeData = await this.fetchRobloxAPI(
                `${CONFIG.GAMES_API}/v1/games/multiget-place-details?placeIds=${placeIds.join(',')}`
            );

            if (universeData && universeData.length > 0) {
                const universeIds = universeData.map(game => game.universeId);
                
                // Get game details
                const gamesData = await this.fetchRobloxAPI(
                    `${CONFIG.GAMES_API}/v1/games?universeIds=${universeIds.join(',')}`
                );

                // Get thumbnails
                const thumbnailData = await this.fetchRobloxAPI(
                    `${CONFIG.THUMBNAILS_API}/v1/games/icons?universeIds=${universeIds.join(',')}&size=150x150&format=Png`
                );

                // Map game details to friends
                friendsInGames.forEach(friend => {
                    const placeInfo = universeData.find(u => u.placeId === friend.presence.placeId);
                    if (placeInfo) {
                        const gameInfo = gamesData?.data?.find(g => g.id === placeInfo.universeId);
                        const thumbnail = thumbnailData?.data?.find(t => t.targetId === placeInfo.universeId);
                        
                        friend.gameInfo = {
                            name: gameInfo?.name || 'Unknown Game',
                            thumbnail: thumbnail?.imageUrl || ''
                        };
                    }
                });
            }
        } catch (error) {
            console.error('Error loading game details:', error);
        }
    }

    async refreshFriends() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> Refreshing...';
        }

        await this.loadFriendsPresence();
        this.renderFriends();
        this.updateStats();

        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> Refresh Friends';
        }
    }

    renderFriends() {
        const friendsList = document.getElementById('friends-list');
        const filterOnline = document.getElementById('filter-online');
        
        if (!friendsList) return;

        let filteredFriends = [...this.friends];
        
        // Apply online filter
        if (filterOnline && filterOnline.checked) {
            filteredFriends = filteredFriends.filter(f => 
                f.presence && f.presence.userPresenceType > 0
            );
        }

        // Sort: online first, then in-game, then offline
        filteredFriends.sort((a, b) => {
            const aPresence = a.presence?.userPresenceType || 0;
            const bPresence = b.presence?.userPresenceType || 0;
            return bPresence - aPresence;
        });

        if (filteredFriends.length === 0) {
            friendsList.innerHTML = `
                <div class="loading">
                    <p>No friends found${filterOnline?.checked ? ' online' : ''}</p>
                </div>
            `;
            return;
        }

        friendsList.innerHTML = filteredFriends.map(friend => {
            const presenceType = friend.presence?.userPresenceType || 0;
            let statusClass = 'status-offline';
            let statusText = 'Offline';
            
            if (presenceType === 1) {
                statusClass = 'status-online';
                statusText = 'Online';
            } else if (presenceType === 2) {
                statusClass = 'status-in-game';
                statusText = 'In Game';
            }

            const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${friend.id}&width=48&height=48&format=png`;

            let gameHtml = '';
            if (presenceType === 2 && friend.gameInfo) {
                gameHtml = `
                    <div class="game-info">
                        ${friend.gameInfo.thumbnail ? 
                            `<img src="${friend.gameInfo.thumbnail}" alt="Game" class="game-thumbnail">` : 
                            ''
                        }
                        <div class="game-name">Playing: ${friend.gameInfo.name}</div>
                    </div>
                `;
            }

            return `
                <div class="friend-card">
                    <img src="${avatarUrl}" alt="${friend.name}" class="friend-avatar">
                    <div class="friend-info">
                        <div class="friend-name">${friend.displayName || friend.name}</div>
                        <div class="friend-status">
                            <span class="status-indicator ${statusClass}"></span>
                            ${statusText}
                        </div>
                        ${gameHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalFriends = document.getElementById('total-friends');
        const onlineFriends = document.getElementById('online-friends');
        const inGameFriends = document.getElementById('in-game-friends');

        const total = this.friends.length;
        const online = this.friends.filter(f => 
            f.presence && f.presence.userPresenceType > 0
        ).length;
        const inGame = this.friends.filter(f => 
            f.presence && f.presence.userPresenceType === 2
        ).length;

        if (totalFriends) totalFriends.textContent = total;
        if (onlineFriends) onlineFriends.textContent = online;
        if (inGameFriends) inGameFriends.textContent = inGame;
    }

    showLoading() {
        const friendsList = document.getElementById('friends-list');
        if (friendsList) {
            friendsList.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading friends...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const appSection = document.getElementById('app-section');
        if (appSection && !appSection.classList.contains('hidden')) {
            const friendsList = document.getElementById('friends-list');
            if (friendsList) {
                friendsList.innerHTML = `
                    <div class="error-message">
                        ${message}
                    </div>
                `;
            }
        } else {
            const authSection = document.getElementById('auth-section');
            if (authSection) {
                const existing = authSection.querySelector('.error-message');
                if (existing) existing.remove();
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = message;
                authSection.insertBefore(errorDiv, authSection.firstChild);
            }
        }
    }

    showAuthSection() {
        document.getElementById('auth-section')?.classList.remove('hidden');
        document.getElementById('app-section')?.classList.add('hidden');
    }

    showAppSection() {
        document.getElementById('auth-section')?.classList.add('hidden');
        document.getElementById('app-section')?.classList.remove('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.friendTracker = new RobloxFriendTracker();
});
