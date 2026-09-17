# MCPShield Production Deployment Guide

## 1. Production Architecture Overview

In production, MCPShield serves as the enterprise security gateway and policy enforcement layer between AI Agents (Claude, Cursor, LangChain, custom agents) and upstream MCP servers (Stripe, Filesystem, Database, GitHub):

- **API & Gateway Service (`mcpshield-api`)**: Horizontally scalable FastAPI application running on Uvicorn workers. Serves the REST API, MCP 2026-07-28 stateless reverse proxy, DLP inspection, policy engine, and the built Web Console SPA.
- **Web Console UI**: Pre-compiled static assets served by the gateway at `/` or independently hosted on CDN/S3/Cloudflare Pages.
- **Database**: PostgreSQL 16+ via `asyncpg` (or SQLite `aiosqlite` for single-node / edge environments).
- **Cache & Rate Limiting**: Redis 7+ cluster for distributed sliding-window rate limiting.
- **TLS / Load Balancing**: Cloudflare, AWS ALB, or Traefik terminating TLS and forwarding standard `X-Forwarded-For` and `X-Forwarded-Proto` headers.

---

## 2. Fast Standalone Production Launch (Single Host)

If deploying to a single Linux VM (AWS EC2, GCP Compute Engine, DigitalOcean Droplet, Hetzner):

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Build the production Web Console bundle
cd apps/web && npm install && npm run build && cd ../..

# 3. Configure production environment
cp .env.example .env.production
# Set JWT_SECRET, DATABASE_URL, and production parameters

# 4. Launch production server with multi-worker Uvicorn
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The unified service is immediately accessible:
- **Web Console**: `http://<HOST>:8000/`
- **Health Check**: `http://<HOST>:8000/health`
- **MCP Gateway**: `http://<HOST>:8000/mcp/{workspace}/{server}`
- **REST API**: `http://<HOST>:8000/api/v1/...`

---

## 3. Containerized Deployment (Docker & Compose)

For container orchestration on Docker Swarm, ECS, or Docker Compose:

```bash
# 1. Configure environment
cp .env.example .env

# 2. Launch production stack (Postgres, Redis, API Gateway, and Web UI)
docker compose up -d --build

# 3. Verify running containers
docker compose ps
```

Services:
- **Web Console**: `http://<HOST>:3000` (or `http://<HOST>:8000/` via API)
- **API & Gateway**: `http://<HOST>:8000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 4. Kubernetes Production Deployment

For enterprise Kubernetes clusters, deploy using horizontal pod autoscaling and secret management:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcpshield-gateway
  namespace: security
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcpshield-gateway
  template:
    metadata:
      labels:
        app: mcpshield-gateway
    spec:
      containers:
      - name: gateway
        image: mcpshield/api:1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mcpshield-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: mcpshield-secrets
              key: jwt-secret
        - name: REDIS_URL
          value: "redis://redis-cluster.security.svc.cluster.local:6379/0"
        - name: FAIL_BEHAVIOR
          value: "fail_closed"
        - name: DEFAULT_POLICY_MODE
          value: "deny"
        resources:
          limits:
            cpu: "2000m"
            memory: "2Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 3
          periodSeconds: 5
```

---

## 5. Production Pre-Flight Checklist

Before onboarding live customer traffic:
- [x] **Strict Authentication**: Default demo fallback disabled; all API access requires a valid Bearer token.
- [x] **Header Smuggling Guard**: `Mcp-Method` header checked against JSON-RPC body method to prevent bypass.
- [x] **Inbound & Outbound DLP**: Secrets and credentials sanitized using `[REDACTED_...]` masks; raw data leaks blocked.
- [x] **Agent Kill Switch & Daily Budget**: Inactive and over-budget agents blocked at the gateway.
- [x] **Immutable Audit Trail**: SHA-256 cryptographic hash chaining persisted durably on all actions.
- [x] **SSRF Guard**: Strict validation against private RFC1918, link-local, and cloud metadata (`169.254.169.254`) IP spaces.
- [x] **Fail-Closed Default**: Unknown tools or servers default to `deny`.
- [x] **Liveness & Readiness**: Standard `/health` returns `200 OK` (`{"status": "healthy"}`).

---

## 6. Smoke Testing Live Deployment

Verify a live instance using `curl`:

```bash
# 1. Health check
curl -f http://localhost:8000/health

# 2. Verify unauthenticated endpoints are protected (Must return HTTP 401)
curl -i http://localhost:8000/api/v1/auth/me
curl -i http://localhost:8000/api/v1/policies

# 3. Test Gateway tool invocation through agent policy
curl -X POST http://localhost:8000/mcp/prod/stripe \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -H "x-mcp-agent-id: FinanceAgent" \
  -H "Mcp-Method: tools/call" \
  -d '{
    "jsonrpc": "2.0",
    "id": "prod-smoke-1",
    "method": "tools/call",
    "params": {
      "name": "stripe.customer.read",
      "arguments": {"customer_id": "cus_prod_001"}
    }
  }'
```

