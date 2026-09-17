# MCPShield 100% Free Deployment Guide ($0 Cost)

This guide shows you how to host MCPShield for **free of cost** without needing a paid cloud server or credit card. When you start getting paid customers, you can seamlessly scale and upgrade.

---

## Method 1: Live from Your PC Right Now ($0)

Your PC is currently hosting MCPShield live on the internet:

- **Public HTTPS URL**: `https://curvy-jokes-wait.loca.lt`
- **Local Port**: `8000` (FastAPI Gateway + Web Console UI)
- **Localtunnel Password (if opened in browser)**: `42.108.86.204`

### How External AI Clients Connect:
In Claude Desktop, ChatGPT, or your custom AI agent:
- Endpoint: `https://curvy-jokes-wait.loca.lt/mcp/prod/stripe`
- Protocol: `MCP 2026-07-28`
- Header: `Bypass-Tunnel-Reminder: true`

---

## Method 2: Deploy to Render.com (100% Free Cloud Web Service)

Render provides **750 free hours every month** with free automatic SSL/HTTPS, no credit card required to start:

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Deploy MCPShield to production"
   git remote add origin https://github.com/<YOUR_USERNAME>/mcpshield.git
   git push -u origin main
   ```
2. **Go to [render.com](https://render.com)** and sign up for free.
3. Click **"New +"** → **"Web Service"**.
4. Connect your GitHub repository `mcpshield`.
5. Select **Environment**: `Python 3` (or `Docker`).
   - **Build Command**: `pip install -r requirements.txt && cd apps/web && npm install && npm run build && cd ../..`
   - **Start Command**: `python -m uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT`
6. Under **Instance Type**, select **Free ($0/month)**.
7. Click **"Deploy Web Service"**.

Render will give you a permanent URL like `https://mcpshield.onrender.com` that works 24/7 for free!

---

## Method 3: Deploy to Hugging Face Spaces (100% Free Docker Hosting)

Hugging Face provides **16 GB RAM and 2 vCPUs completely free forever** for Docker apps:

1. Create a free account on [huggingface.co](https://huggingface.co).
2. Click **New Space** → Name it `mcpshield`.
3. Select **Space SDK**: **Docker** (Blank).
4. Clone the space repo or push this codebase:
   ```bash
   git remote add hf https://huggingface.co/spaces/<YOUR_USERNAME>/mcpshield
   git push hf main
   ```
5. Hugging Face will automatically build the `infra/docker/Dockerfile.api` and host it at `https://<YOUR_USERNAME>-mcpshield.hf.space` with free HTTPS!

---

## Method 4: Cloudflare Tunnel from Your PC (Permanent & Free)

If you prefer running from your PC but want a permanent custom domain with enterprise protection:
1. Download `cloudflared` from Cloudflare (100% free).
2. Run:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
Cloudflare gives you a permanent, high-speed HTTPS link directly into your PC without opening router ports or paying server costs.
