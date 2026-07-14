# SyncPad — Docker + AWS EC2 Deployment Notes

## Why we did it this way
My laptop's CPU doesn't support hardware virtualization (VT-x), so Docker Desktop can't run locally. Solution: install and run Docker directly on a cloud Linux server (AWS EC2) instead of my own machine. Everything Docker-related happens over SSH on the EC2 instance; my laptop is just used to write code, push to GitHub, and connect via SSH.

---

## 1. Launch an EC2 instance (AWS Console)
- Went to **EC2 → Instances → Launch an instance**
- Region: Asia Pacific (Mumbai) `ap-south-1`
- Instance type: `t3.micro` (Free Tier eligible)
- Created/selected a key pair: `docker-key.pem` (downloaded, used for SSH login)
- Result: instance `docker-server` launched with:
  - Public IP: `13.233.206.8`
  - Private IP: `172.31.40.21`

## 2. Connect to the instance via SSH (from Git Bash on laptop)
```bash
ssh -i "docker-key.pem" ec2-user@13.233.206.8
```
- First connection asks to confirm the host fingerprint — type `yes`.
- **Note:** In Git Bash/SSH sessions, use `Shift+Insert` to paste — plain `Ctrl+V` can send a control character that resets the connection.

## 3. Update the system and install Docker
```bash
sudo yum update -y
sudo yum install docker -y
```

## 4. Set up Docker permissions and start the service
```bash
sudo systemctl start docker      # start Docker now
sudo systemctl enable docker     # start Docker automatically on every reboot
sudo usermod -aG docker ec2-user # let ec2-user run docker without sudo
newgrp docker                    # apply the new group in this session
docker --version                 # confirm install
docker ps                        # confirm permissions work (empty table = good)
```

## 5. Install git and clone the project from GitHub
```bash
sudo yum install git -y
git clone https://github.com/MD-NABEEL-T/SyncPad.git
cd SyncPad
```

## 6. Understand the Dockerfile (multi-stage build)
The project uses a **two-stage Dockerfile**:
- **Stage 1 (build):** uses `node:20-alpine`, copies the `frontend` folder, runs `npm install` and `npm run build` — this produces a `/app/dist` folder (the compiled React app).
- **Stage 2 (final/production):** uses a fresh `node:20-alpine`, copies only the built frontend output (`/app/dist`) into a `public` folder, copies the `backend` code, installs production dependencies, and runs `node server.js`.

This keeps the final image small — it doesn't carry all the frontend build tools, just the compiled static files.

```dockerfile
# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY ./frontend .
RUN npm install
RUN npm run build   # produces a /app/dist folder

# ---- Stage 2: Final (production) ----
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./public
COPY ./backend .
RUN npm install --production
CMD ["node", "server.js"]
```

### 🐛 Bug we hit and fixed
Original line:
```dockerfile
COPY --from=build /app/dist ./public   # only copy the built output
```
**Problem:** Docker's `COPY` instruction is parsed directly by Docker (not a shell), so it only treats `#` as a comment if it's the *first character on the line*. A trailing `# comment` after a command gets read as extra literal arguments — Docker tried to copy files literally named `the`, `built`, `output`, which don't exist, causing:
```
ERROR: ... "/the": not found
```
**Fix:** delete or move the trailing comment so `COPY` is the only thing on its line. (Note: `RUN` commands run inside a shell, so trailing `#` comments work fine there — this issue was specific to `COPY`.)

## 7. Build the Docker image
```bash
docker build -t backend .
```
This pulls the base image, builds the frontend, copies files, and tags the final image as `backend`.

## 8. Run the container
```bash
docker run -d -p 4000:3000 --name syncpad-app backend
```
- `-d` → run in the background (detached)
- `-p 4000:3000` → maps port **4000 on the EC2 instance** (external) to port **3000 inside the container** (where the Express/Socket.IO server listens, per `httpServer.listen(3000, ...)` in `server.js`)
- `--name syncpad-app` → friendly name for the container
- `backend` → the image to run

## 9. Verify it's running
```bash
docker ps                     # should show syncpad-app, status "Up"
docker logs syncpad-app       # should show "Server is running on port 3000"
```

## 10. Open the port in the EC2 Security Group
Docker running inside the instance isn't reachable from the internet until the firewall (Security Group) allows it:
1. EC2 Console → Instances → click instance → **Security** tab → click the security group
2. **Edit inbound rules → Add rule**
   - Type: Custom TCP
   - Port: `4000`
   - Source: Anywhere-IPv4 (`0.0.0.0/0`)
3. Save

## 11. Test it
Visit in browser:
```
http://13.233.206.8:4000
```
✅ Confirmed working — opened in two browser tabs with different `?username=` values, saw the Users list sync live and Monaco editor content sync in real time via Yjs + Socket.IO.

## 12. Make the container restart automatically
So it survives reboots or crashes without manual intervention:
```bash
docker update --restart unless-stopped syncpad-app
```
Verify it took effect:
```bash
docker inspect syncpad-app --format='{{.HostConfig.RestartPolicy.Name}}'
# should print: unless-stopped
```

---

## Things to know / do later
- **HTTPS/SSL:** Currently HTTP only ("Not secure" in browser). To add SSL:
  1. Get a domain name, point its DNS A record to `13.233.206.8`
  2. Install Nginx as a reverse proxy in front of the app
  3. Use Certbot (`sudo yum install certbot python3-certbot-nginx`) to get a free auto-renewing Let's Encrypt certificate
  - SSL certs are issued to domain names, not raw IPs — a domain is required first.
- **Elastic IP:** The current public IP changes if the instance is stopped/started. Allocate an Elastic IP if a permanent address is needed (note: unused Elastic IPs can incur small charges).
- **Cost awareness:** `t3.micro` is Free Tier eligible — keep an eye on the AWS Billing dashboard, especially if the instance stays running long-term.
- **Updating the app in future:** on EC2, run:
  ```bash
  cd ~/SyncPad
  git pull
  docker build -t backend .
  docker stop syncpad-app
  docker rm syncpad-app
  docker run -d -p 4000:3000 --name syncpad-app --restart unless-stopped backend
  ```