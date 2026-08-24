const express = require("express");
const { exec, spawn } = require("child_process");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const LOGIN_SERVER = process.env.TS_LOGIN_SERVER || "";

const ALLOWED_COMMANDS = {
  status: "tailscale status --json",
  up: (args) => `tailscale up --reset ${sanitizeArgs(args)}`,
  down: "tailscale down",
  logout: "tailscale logout",
  ip: "tailscale ip",
  ping: (args) => `tailscale ping ${sanitizeHostname(args.host)}`,
  netcheck: "tailscale netcheck --format=json",
  version: "tailscale version",
  set: (args) => `tailscale set ${sanitizeSetArgs(args)}`,
};

function sanitizeArgs(args = {}) {
  const flags = [];
  if (LOGIN_SERVER) flags.push(`--login-server=${LOGIN_SERVER}`);
  if (args.acceptDns === false) flags.push("--accept-dns=false");
  if (args.shields) flags.push("--shields-up");
  if (args.authkey) flags.push(`--authkey=${args.authkey.replace(/[^a-zA-Z0-9_\-]/g, "")}`);
  if (args.exitNode) flags.push("--advertise-exit-node");
  if (args.lanAccess) flags.push("--advertise-routes=192.168.0.0/16", "--accept-routes");
  return flags.join(" ");
}

function sanitizeHostname(h = "") {
  return h.replace(/[^a-zA-Z0-9.\-_]/g, "");
}

function sanitizeSetArgs(args = {}) {
  const flags = [];
  if ("shields" in args) flags.push(`--shields-up=${!!args.shields}`);
  if ("exitNode" in args) flags.push(`--advertise-exit-node=${!!args.exitNode}`);
  if ("lanAccess" in args) flags.push(args.lanAccess ? "--advertise-routes=192.168.0.0/16" : "--advertise-routes=");
  return flags.join(" ");
}

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
      if (err) return reject({ error: err.message, stderr });
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

// --- Routes ---

// GET /api/config
app.get("/api/config", (req, res) => {
  res.json({ loginServer: LOGIN_SERVER || null });
});

// GET /api/status
app.get("/api/status", async (req, res) => {
  try {
    const { stdout } = await runCommand(ALLOWED_COMMANDS.status);
    const data = JSON.parse(stdout);

    // Filter peers to same user as self, matching official Tailscale app behaviour
    const selfUserID = data.Self?.UserID;
    if (selfUserID && data.Peer) {
      for (const key of Object.keys(data.Peer)) {
        if (String(data.Peer[key].UserID) !== String(selfUserID)) {
          delete data.Peer[key];
        }
      }
    }

    res.json(data);
  } catch (e) {
    res.status(500).json(e);
  }
});

// GET /api/ip
app.get("/api/ip", async (req, res) => {
  try {
    const { stdout } = await runCommand(ALLOWED_COMMANDS.ip);
    res.json({ ip: stdout });
  } catch (e) {
    res.status(500).json(e);
  }
});

// GET /api/version
app.get("/api/version", async (req, res) => {
  try {
    const { stdout } = await runCommand(ALLOWED_COMMANDS.version);
    res.json({ version: stdout });
  } catch (e) {
    res.status(500).json(e);
  }
});

// POST /api/login — streams output via SSE so the auth URL appears immediately
app.post("/api/login", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const args = ["up"];
  if (LOGIN_SERVER) args.push(`--login-server=${LOGIN_SERVER}`);

  const proc = spawn("tailscale", args);

  const send = (text) => {
    res.write(`data: ${JSON.stringify(text)}\n\n`);
  };

  proc.stdout.on("data", (d) => send(d.toString()));
  proc.stderr.on("data", (d) => send(d.toString()));

  proc.on("close", (code) => {
    send(`\n[process exited with code ${code}]`);
    res.write("event: done\ndata: done\n\n");
    res.end();
  });

  // If client disconnects, kill the process
  req.on("close", () => proc.kill());
});

// POST /api/up
app.post("/api/up", async (req, res) => {
  try {
    const cmd = ALLOWED_COMMANDS.up(req.body || {});
    const result = await runCommand(cmd);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  }
});

// POST /api/set
app.post("/api/set", async (req, res) => {
  const body = req.body || {};
  if (!("shields" in body) && !("exitNode" in body) && !("lanAccess" in body)) {
    return res.status(400).json({ error: "no recognized settings: expected shields, exitNode or lanAccess" });
  }
  try {
    const cmd = ALLOWED_COMMANDS.set(body);
    const result = await runCommand(cmd);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  }
});

// POST /api/down
app.post("/api/down", async (req, res) => {
  try {
    const result = await runCommand(ALLOWED_COMMANDS.down);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  }
});

// POST /api/logout
app.post("/api/logout", async (req, res) => {
  try {
    const result = await runCommand(ALLOWED_COMMANDS.logout);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  }
});

// POST /api/ping
app.post("/api/ping", async (req, res) => {
  try {
    if (!req.body?.host) return res.status(400).json({ error: "host required" });
    const cmd = ALLOWED_COMMANDS.ping(req.body);
    const result = await runCommand(cmd);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  }
});

// GET /api/netcheck
app.get("/api/netcheck", async (req, res) => {
  try {
    const { stdout } = await runCommand(ALLOWED_COMMANDS.netcheck);
    res.json(JSON.parse(stdout));
  } catch (e) {
    res.status(500).json(e);
  }
});

const PORT = process.env.GUI_PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Tailscale GUI running at http://0.0.0.0:${PORT}`);
});
