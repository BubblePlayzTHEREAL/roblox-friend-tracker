const express = require('express');
const fetch = require('node-fetch');
const { randomBytes } = require('crypto');

const router = express.Router();

// In-memory short-lived token store: id -> { tokens, expiresAt }
// This is intentionally simple for demo purposes. For production use a persistent store.
const tokenStore = new Map();

function generateState() {
    return randomBytes(16).toString('hex');
}

function generateId() {
    return randomBytes(12).toString('hex');
}

// Start OAuth: redirect user to Roblox authorize endpoint
router.get('/start', (req, res) => {
    const { client_id, redirect_uri, scope } = req.query;
    if (!client_id || !redirect_uri) {
        return res.status(400).send('Missing client_id or redirect_uri');
    }

    const state = generateState();
    // store state in a short-lived cookie to validate on callback
    res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax' });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id,
        redirect_uri,
        scope: scope || 'openid profile',
        state
    });

    const authorizeUrl = `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`;
    res.redirect(authorizeUrl);
});

// Callback endpoint: Roblox will redirect here with code and state
// This endpoint exchanges the code for tokens server-side and then renders a tiny HTML page
// that posts a message back to the opener window containing a short id the frontend can use
// to fetch tokens from /auth/token/:id
router.get('/callback', express.urlencoded({ extended: false }), async (req, res) => {
    try {
        const { code, state } = req.query;
        const cookieState = req.cookies && req.cookies.oauth_state;
        if (!code || !state || !cookieState || state !== cookieState) {
            return res.status(400).send('Invalid state or missing code');
        }

        // Exchange code for tokens
        const clientId = process.env.OAUTH_CLIENT_ID;
        const clientSecret = process.env.OAUTH_CLIENT_SECRET;
        const redirectUri = process.env.OAUTH_REDIRECT_URI; // must match what was registered

        if (!clientId || !clientSecret || !redirectUri) {
            return res.status(500).send('OAuth server not configured');
        }

        const tokenResp = await fetch('https://apis.roblox.com/oauth/v1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!tokenResp.ok) {
            const text = await tokenResp.text();
            console.error('Token exchange failed:', text);
            return res.status(502).send('Token exchange failed');
        }

        const tokens = await tokenResp.json();

        // store tokens with an id and short expiry (e.g., 90 seconds)
        const id = generateId();
        const expiresAt = Date.now() + 90 * 1000;
        tokenStore.set(id, { tokens, expiresAt });

        // render HTML that posts message back to opener
        const html = `
      <!doctype html>
      <html>
      <head><meta charset="utf-8"><title>OAuth Complete</title></head>
      <body>
      <script>
        (function() {
          try {
            const payload = { auth_id: '${id}' };
            if (window.opener && typeof window.opener.postMessage === 'function') {
              window.opener.postMessage(payload, '*');
            }
          } catch (e) {
            // ignore
          }
          // close the popup after short delay
          setTimeout(() => window.close(), 500);
        })();
      </script>
      OAuth complete. You can close this window.
      </body>
      </html>`;

        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('OAuth callback error', err);
        res.status(500).send('Server error');
    }
});

// Token retrieval: frontend can fetch tokens by id. Tokens are single-use and short-lived.
router.get('/token/:id', (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const entry = tokenStore.get(id);
    if (!entry) return res.status(404).json({ error: 'Token not found or expired' });
    if (Date.now() > entry.expiresAt) {
        tokenStore.delete(id);
        return res.status(410).json({ error: 'Token expired' });
    }
    // optionally delete to make single-use
    tokenStore.delete(id);
    res.json({ tokens: entry.tokens });
});

module.exports = router;
