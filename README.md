# Tailnet Client

A Docker image combining the official `tailscale/tailscale` base with a Node.js API and a Vue 3 + Tailwind CSS + Shadcn-vue web GUI for managing a Tailscale/Headscale node via a browser.

## Structure

```
tailnet-client/
├── Dockerfile                          # Multi-stage: builds Vue frontend, then tailscale + node
├── docker-compose.yml
├── scripts/
│   ├── supervisord.conf                # Runs tailscaled + node app
│   └── start.sh                        # Entrypoint
├── app/
│   ├── package.json                    # Express dependencies
│   ├── server.js                       # Express API — shells out to tailscale CLI
│   └── public/                         # Built Vue frontend (auto-generated)
├── frontend/
│   ├── package.json                    # Vue + Vite + Tailwind + Shadcn-vue
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.vue                     # Main layout, state, header
│       ├── components/
│       │   ├── StatusPanel.vue         # Status display (dot, state, network, hostname, IPs)
│       │   ├── ControlsPanel.vue       # Auth key input, toggles (shields, exit node, LAN)
│       │   ├── PeersPanel.vue          # Peer list
│       │   ├── LogPanel.vue            # Streaming log output
│       │   └── ui/                     # Shadcn-vue primitives (Button, Card, Switch, etc.)
│       └── composables/
│           ├── useApi.ts               # API fetch helper
│           ├── useStatus.ts            # Status polling composable
│           └── useLog.ts               # Log management composable
└── data/                               # Tailscale state (persisted)
```

## How it works

| Component | Role |
|---|---|
| `tailscale/tailscale` | Base image; provides `tailscaled` daemon + `tailscale` CLI |
| `supervisord` | Process manager — starts both `tailscaled` and the Node app |
| `node server.js` | Express server on port 3000; exposes REST endpoints that run CLI commands |
| `Vue 3 + Tailwind + Shadcn-vue` | SPA frontend; polls `/api/status` every 15s, SSE login flow |

## Quick Start

```bash
# Build and run
docker compose up --build

# Open the GUI
open http://localhost:3000
```

Then in the GUI:
1. Click **Login** (web auth flow) or enter an **Auth Key** and click **Connect**
2. Toggle **Exit Node** / **Local LAN** as needed
3. Your container is now on your tailnet

## Frontend Development

Run the Vite dev server with hot reload alongside the Dockerized API:

```bash
# Terminal 1: Start the backend
docker compose up --build

# Terminal 2: Start the Vue dev server
cd frontend
npm run dev
```

The Vite dev server proxies `/api/*` requests to `localhost:3000`.

To build the frontend for production:

```bash
cd frontend
npm run build:local     # Builds to dist/ and copies output to ../app/public/
```

## Build without compose

```bash
docker build -t tailnet-client .

docker run -d \
  --name tailnet-client \
  -p 127.0.0.1:3000:3000 \
  --cap-add NET_ADMIN \
  --cap-add SYS_MODULE \
  --device /dev/net/tun \
  -v tailnet-state:/var/lib/tailscale \
  tailnet-client
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/config` | Login server config |
| GET | `/api/prefs` | Advertised settings from `tailscale debug prefs` (routes, shields) |
| GET | `/api/status` | Full `tailscale status --json` |
| GET | `/api/ip` | Container's Tailscale IP |
| GET | `/api/version` | Tailscale version |
| GET | `/api/netcheck` | Network check (DERP, latency) |
| POST | `/api/login` | SSE stream for web auth flow (headscale) |
| POST | `/api/up` | `tailscale up --reset` with optional body params |
| POST | `/api/set` | `tailscale set` for live settings changes (shields, exit node, LAN advertise) |
| POST | `/api/down` | `tailscale down` |
| POST | `/api/logout` | `tailscale logout` |
| POST | `/api/ping` | `tailscale ping <host>` |

### POST /api/up body params

```json
{
  "authkey": "tskey-auth-...",
  "shields": false,
  "exitNode": true,
  "lanAccess": false
}
```

### POST /api/set body params

All keys optional; at least one required. Each maps to a `tailscale set` flag:

```json
{
  "shields": true,
  "exitNode": false,
  "lanAccess": true
}
```

| Key | Flag (true) | Flag (false) |
|---|---|---|
| `shields` | `--shields-up=true` | `--shields-up=false` |
| `exitNode` | `--advertise-exit-node=true` | `--advertise-exit-node=false` |
| `lanAccess` | `--advertise-routes=192.168.0.0/16` | `--advertise-routes=` (clears routes) |

Note: toggling LAN advertise in the GUI only manages `--advertise-routes`; it does not set `--accept-routes`.

## Security Notes

- The GUI binds to `127.0.0.1:3000` — not accessible from outside the host
- CLI commands are validated against an allowlist; args are sanitized
- Auth keys are scrubbed of special characters before being passed to the CLI
- For production use, consider adding basic auth to the Express server
