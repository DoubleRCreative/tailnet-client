# Tailscale GUI Docker

A Docker image combining the official `tailscale/tailscale` base with a lightweight Node.js web GUI for controlling the Tailscale client via a browser.

## Structure

```
tailscale-gui/
├── Dockerfile
├── docker-compose.yml
├── scripts/
│   ├── supervisord.conf   # Runs tailscaled + node app together
│   └── start.sh           # Entrypoint
└── app/
    ├── package.json
    ├── server.js          # Express API — shells out to tailscale CLI
    └── public/
        └── index.html     # Web GUI
```

## How it works

| Component | Role |
|---|---|
| `tailscale/tailscale` | Base image; provides `tailscaled` daemon + `tailscale` CLI |
| `supervisord` | Process manager — starts both `tailscaled` and the Node app |
| `node server.js` | Express server on port 3000; exposes REST endpoints that run CLI commands |
| `index.html` | Single-page GUI; polls `/api/status` every 15s |

## Quick Start

```bash
# Build and run
docker compose up --build

# Open the GUI
open http://localhost:3000
```

Then in the GUI:
1. Paste your **Auth Key** (from https://login.tailscale.com/admin/settings/keys)
2. Click **Connect**
3. Your container is now on your tailnet

## Build without compose

```bash
docker build -t tailscale-gui .

docker run -d \
  --name tailscale-gui \
  -p 127.0.0.1:3000:3000 \
  --cap-add NET_ADMIN \
  --cap-add SYS_MODULE \
  --device /dev/net/tun \
  -v tailscale-state:/var/lib/tailscale \
  tailscale-gui
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/status` | Full `tailscale status --json` |
| GET | `/api/ip` | Container's Tailscale IP |
| GET | `/api/version` | Tailscale version |
| GET | `/api/netcheck` | Network check (DERP, latency) |
| POST | `/api/up` | `tailscale up` with optional body params |
| POST | `/api/down` | `tailscale down` |
| POST | `/api/logout` | `tailscale logout` |
| POST | `/api/ping` | `tailscale ping <host>` |

### POST /api/up body params
```json
{
  "authkey": "tskey-auth-...",
  "hostname": "my-container",
  "acceptRoutes": true,
  "shields": false
}
```

## Security Notes

- The GUI binds to `127.0.0.1:3000` — not accessible from outside the host
- CLI commands are validated against an allowlist; args are sanitized
- Auth keys are scrubbed of special characters before being passed to the CLI
- For production use, consider adding basic auth to the Express server
