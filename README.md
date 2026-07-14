<div align="center">

# 🔄 SyncPad

### A real-time collaborative code editor — like Google Docs, but for code.

Multiple people can open the same editor and type simultaneously, with every keystroke synced live across all connected users — no save button, no conflicts, no lag.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange)](https://yjs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS EC2](https://img.shields.io/badge/Deployed_on-AWS_EC2-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2/)

</div>

---

## ✨ What is this?

SyncPad is a browser-based code editor where anyone with the link can join a shared room, see who else is online, and edit the same file together in real time — every character typed by one person instantly appears for everyone else. It's built on **CRDTs** (Conflict-free Replicated Data Types), which is the same category of technology behind tools like Google Docs and Figma's live collaboration — meaning multiple people can edit the exact same line at the exact same moment without overwriting each other or needing a "lock."

## 🚀 Features

- **Live multi-user editing** — powered by [Yjs](https://yjs.dev/), changes merge automatically with no conflicts, even with simultaneous edits
- **Presence awareness** — a live sidebar shows exactly who's currently in the room
- **Monaco Editor** — the same code editor that powers VS Code, right in the browser (syntax highlighting, familiar keybindings, dark theme)
- **Zero-friction join** — enter a username, land straight in the shared editor, no accounts or sign-up
- **WebSocket-based sync** — real-time updates via Socket.IO, no polling or manual refresh
- **Containerized & cloud-deployed** — packaged with Docker and running live on AWS EC2

## 🧠 How it works

```
┌──────────────┐         WebSocket (Socket.IO)         ┌──────────────┐
│   Browser A  │ ◄────────────────────────────────────► │              │
│ Monaco Editor│                                         │  Node.js /   │
│   + Yjs Doc  │                                         │  Express     │
└──────────────┘                                         │  Server      │
                                                          │              │
┌──────────────┐                                         │  y-socket.io │
│   Browser B  │ ◄────────────────────────────────────► │  (Yjs relay) │
│ Monaco Editor│                                         │              │
│   + Yjs Doc  │                                         └──────────────┘
└──────────────┘
```

Each browser holds its own local **Yjs document** — a special data structure that can merge changes from anywhere without conflicts. The **`y-socket.io`** library keeps every connected browser's Yjs document in sync in real time, using Socket.IO as the transport layer. The **`y-monaco`** binding then wires that synced document directly into the Monaco Editor, so keystrokes flow: `Editor → Yjs Doc → Socket.IO → Server → other clients' Yjs Docs → their Editors`.

Presence (the "Users" sidebar) is handled through Yjs's built-in **awareness** protocol — a lightweight side-channel for sharing ephemeral state like "who's online" without polluting the actual document content.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Real-time sync** | Yjs (CRDT), `y-monaco`, `y-socket.io` |
| **Backend** | Node.js, Express, Socket.IO |
| **Containerization** | Docker (multi-stage build) |
| **Deployment** | AWS EC2 (Amazon Linux 2023) |

## 📦 Project Structure

```
SyncPad/
├── frontend/          # React + Vite app (Monaco Editor UI)
│   └── src/app/App.jsx    # Core editor + real-time sync logic
├── backend/           # Express + Socket.IO server
│   └── server.js          # Serves frontend build + handles Yjs relay
└── dockerfile         # Multi-stage build: compiles frontend, bundles with backend
```

## 🐳 Running with Docker

The included `dockerfile` uses a **multi-stage build**: it compiles the React frontend into static files, then bundles them with the backend into a single lean image — one container serves everything on one port.

```bash
# Build the image
docker build -t backend .

# Run it (maps container's port 3000 to your machine's port 4000)
docker run -d -p 4000:3000 --name syncpad-app backend
```

Then open **`http://localhost:4000`** (or your server's IP if deployed remotely).

> 💡 Multiple people can test this by opening the same URL with different `?username=` query params in separate tabs, e.g. `?username=alice` and `?username=bob`.

## 💻 Running locally (without Docker)

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend (dev mode):**
```bash
cd frontend
npm install
npm run dev
```

## ☁️ Deployment

This project is deployed on an **AWS EC2** instance running Amazon Linux, with Docker installed directly on the server (rather than locally, due to lack of hardware virtualization support on the development machine). The container is set to auto-restart via `docker run --restart unless-stopped`, keeping SyncPad available even after a reboot or crash.

## 🗺️ Roadmap / Ideas

- [ ] HTTPS via reverse proxy (Nginx + Let's Encrypt)
- [ ] Persistent rooms (currently a single shared room)
- [ ] Language selector for Monaco (currently fixed to JavaScript)
- [ ] User cursors/selections visible to others

## 🤝 Contributing

This is a personal learning project exploring real-time collaboration, CRDTs, and cloud deployment — feedback and suggestions are welcome via issues or pull requests.

---

<div align="center">
Built with React, Yjs, Socket.IO, Docker, and a lot of debugging 🐛
</div>