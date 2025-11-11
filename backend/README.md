# Roblox Friend Tracker — Backend

This is a minimal Node.js backend to track Roblox users' friends and record changes over time. It uses a JSON file for storage so you can run it locally without a database.

## Requirements

- Node.js 16+ (Node 18+ recommended)
- npm

## Install

1. Copy the `backend/` folder into your repository root (or download it).
2. From the `backend/` directory run:

```bash
npm install
```

3. Create a `.env` file (you can copy `.env.example`):

```bash
cp .env.example .env
# Edit .env if needed
```

## Run

Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:PORT` (default 3001).

## WebSocket

A WebSocket server runs on the same port as the HTTP server. Connect to:

```
ws://localhost:3001
```

On connect the server will send a `tracked-list` message with the current tracked users. When friend changes are detected the server broadcasts a `friend-change` message with this shape:

```json
{
  "type": "friend-change",
  "userId": 12345,
  "username": "Username",
  "when": "2025-11-11T00:00:00.000Z",
  "added": [ { "id": 111, "name": "FriendA" } ],
  "removed": [ { "id": 222, "name": "FriendB" } ]
}
```

Clients can also send `{"type":"get-tracked"}` to request the current tracked list and will receive a `tracked-list` reply.

## Endpoints

- GET /health
  - Simple health check.

- POST /track
  - Body: `{ "userId": 12345 }` or `{ "username": "SomeName" }`
  - Starts tracking a user (resolves username to id if needed) and stores their current friend list.

- DELETE /track/:userId
  - Stops tracking a user.

- GET /tracked
  - Returns an array of tracked users and metadata.

- GET /friends/:userId
  - Returns the last stored friend list for the user.

- GET /events/:userId
  - Returns recorded friend-change events for the user.

## Storage

Data is stored in `backend/data/tracked.json`. The structure:

```json
{
  "tracked": [
    {
      "userId": 12345,
      "username": "ResolvedUsername",
      "friends": [ { "id": ..., "name": "..." }, ... ],
      "lastChecked": "2025-11-11T00:00:00.000Z",
      "events": [
        { "when": "2025-11-11T00:01:00.000Z", "type": "added", "friend": { "id": ..., "name": "..." } }
      ]
    }
  ]
}
```

## Notes and next steps

- This uses Roblox public endpoints (no authentication). If you need to track private data or authenticated endpoints, you'll need to add auth handling.
- For production, consider a real database and better concurrency/locking for storage.
- If you'd like, I can:
  - Add more robust backoff/rate-limit handling when calling Roblox APIs.
  - Add authentication and protected endpoints.
  - Add client examples using WebSockets.
