const express = require('express');
const store = require('../store');
const roblox = require('../services/roblox');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all tracked users
router.get('/tracked', (req, res) => {
  try {
    const tracked = store.getTracked();
    res.json({ tracked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start tracking a user
router.post('/track', async (req, res) => {
  try {
    let { userId, username } = req.body;
    
    if (!userId && !username) {
      return res.status(400).json({ error: 'Must provide userId or username' });
    }

    // If username is provided, resolve to userId
    if (username && !userId) {
      userId = await roblox.getUserIdFromUsername(username);
    }

    // Check if already tracked
    const existing = store.findTrackedByUserId(userId);
    if (existing) {
      return res.json({ message: 'Already tracking this user', tracked: existing });
    }

    // Fetch current friends
    const friends = await roblox.getFriendsForUserId(userId);

    const trackedUser = {
      userId: parseInt(userId, 10),
      username: username || null,
      friends,
      lastChecked: new Date().toISOString(),
      events: []
    };

    store.addTracked(trackedUser);
    res.json({ message: 'Now tracking user', tracked: trackedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop tracking a user
router.delete('/track/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    store.removeTracked(userId);
    res.json({ message: 'Stopped tracking user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get friends for a tracked user
router.get('/friends/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const tracked = store.findTrackedByUserId(userId);
    if (!tracked) {
      return res.status(404).json({ error: 'User not tracked' });
    }
    res.json({ friends: tracked.friends || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get events for a tracked user
router.get('/events/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const tracked = store.findTrackedByUserId(userId);
    if (!tracked) {
      return res.status(404).json({ error: 'User not tracked' });
    }
    res.json({ events: tracked.events || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
