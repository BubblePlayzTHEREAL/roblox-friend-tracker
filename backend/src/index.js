const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const trackedRouter = require('./routes/tracked');
const store = require('./store');
const roblox = require('./services/roblox');
const http = require('http');
const WebSocket = require('ws');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const POLL_INTERVAL_SECONDS = process.env.POLL_INTERVAL_SECONDS ? parseInt(process.env.POLL_INTERVAL_SECONDS, 10) : 60;
const VERBOSE = process.env.VERBOSE_LOG === 'true';

app.use('/', trackedRouter);

// create an HTTP server so we can attach WebSocket server to the same port
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// helper to broadcast a JSON message to all connected clients
function broadcastMessage(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(msg);
      } catch (e) {
        console.error('WebSocket send error', e);
      }
    }
  });
}

wss.on('connection', (ws, req) => {
  if (VERBOSE) console.log('WebSocket client connected');
  // optionally, send current tracked list on connect
  try {
    const tracked = store.getTracked();
    ws.send(JSON.stringify({ type: 'tracked-list', tracked }));
  } catch (e) {
    // ignore
  }

  ws.on('message', message => {
    // echo or handle client messages if needed
    if (VERBOSE) console.log('WS recv:', message.toString());
    // Example: clients may request to list tracked users
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed && parsed.type === 'get-tracked') {
        ws.send(JSON.stringify({ type: 'tracked-list', tracked: store.getTracked() }));
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    if (VERBOSE) console.log('WebSocket client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Roblox Friend Tracker backend listening on http://localhost:${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
});

// Poller: periodically check tracked users' friend lists and record added/removed events
async function checkAllTracked() {
  const tracked = store.getTracked();
  if (!Array.isArray(tracked) || tracked.length === 0) return;

  const updated = [];
  for (const t of tracked) {
    try {
      const currentFriends = await roblox.getFriendsForUserId(t.userId);
      const oldFriends = Array.isArray(t.friends) ? t.friends : [];

      const oldIds = new Set(oldFriends.map(f => String(f.id)));
      const newIds = new Set(currentFriends.map(f => String(f.id)));

      // find added
      const added = currentFriends.filter(f => !oldIds.has(String(f.id)));
      const removed = oldFriends.filter(f => !newIds.has(String(f.id)));

      if (added.length > 0 || removed.length > 0) {
        t.events = t.events || [];
        const now = new Date().toISOString();
        for (const a of added) {
          t.events.push({ when: now, type: 'added', friend: a });
          if (VERBOSE) console.log(`User ${t.userId} added friend ${a.id} (${a.name})`);
        }
        for (const r of removed) {
          t.events.push({ when: now, type: 'removed', friend: r });
          if (VERBOSE) console.log(`User ${t.userId} removed friend ${r.id} (${r.name})`);
        }
        // update stored friends
        t.friends = currentFriends;
        t.lastChecked = now;

        // broadcast the change to websocket clients
        try {
          broadcastMessage({
            type: 'friend-change',
            userId: t.userId,
            username: t.username || null,
            when: now,
            added,
            removed
          });
        } catch (e) {
          console.error('Failed to broadcast friend-change', e);
        }
      } else {
        t.lastChecked = new Date().toISOString();
      }
    } catch (err) {
      console.error(`Error checking user ${t.userId}:`, err.message || err);
      // leave t as-is
    }
    updated.push(t);
  }

  store.setTracked(updated);
}

setInterval(() => {
  checkAllTracked().catch(err => console.error('Poller error', err));
}, Math.max(1000, POLL_INTERVAL_SECONDS * 1000));

// run one immediately on startup
checkAllTracked().catch(err => console.error('Initial poller error', err));

// graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
