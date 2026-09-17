# Zero-Local-Storage Cloud Production Architecture

MCPShield is architected for **zero local storage dependencies**, eliminating local disk corruption, container restart data loss, and multi-node synchronization issues.

By leveraging top-tier **Serverless Free Tiers**, you can run production-grade MCPShield infrastructure at **$0.00 / month** with zero compromise on enterprise performance, ACID compliance, or high availability.

---

## 1. Cloud Architecture & Cost Breakdown

| Component | Cloud Service | Free Tier Allowance | Typical Egress Fee | MCPShield Role |
|---|---|---|---|---|
| **Relational Database** | [Neon Serverless Postgres](https://neon.tech) or [Supabase](https://supabase.com) | 0.5 GB storage, 300 compute hrs/mo, instant branching, autoscaling | $0 | Multi-tenant RBAC, policies, agent registries, live audit chains, enterprise leads |
| **Object / Blob Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) | 10 GB storage/mo, 1M Class A ops, 10M Class B ops | **$0.00 (Zero Egress Everywhere)** | Immutable cryptographic audit archives, scanner SARIF reports, SOC2 exports |
| **Distributed Cache & State** | [Upstash Serverless Redis](https://upstash.com) | 10,000 commands / day free forever | $0 | Cross-node sliding-window rate limiting, sub-millisecond Kill Switch synchronization |
| **Total Monthly Cost** | — | — | — | **$0.00 / month** |

---

## 2. 5-Minute Cloud Setup Guide

### Step 1: Set Up Serverless PostgreSQL (Neon)
1. Sign up at [neon.tech](https://neon.tech) (Free).
2. Create a project named `mcpshield-prod`.
3. Copy the async PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql+asyncpg://neondb_owner:PASSWORD@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *(Note: MCPShield automatically normalizes `postgres://` into `postgresql+asyncpg://` and enables serverless connection pooling).*

### Step 2: Set Up Cloudflare R2 ($0 Egress Object Storage)
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **R2**.
2. Click **Create Bucket** -> Name it `mcpshield-cloud-vault`.
3. Under **Manage R2 API Tokens**, click **Create API Token** (Permissions: Object Read & Write).
4. Add credentials to your environment:
   ```env
   CLOUDFLARE_R2_ACCOUNT_ID=<your_cloudflare_account_id>
   R2_ACCESS_KEY_ID=<your_r2_access_key>
   R2_SECRET_ACCESS_KEY=<your_r2_secret_key>
   R2_BUCKET_NAME=mcpshield-cloud-vault
   ```

### Step 3: Set Up Upstash Serverless Redis (Distributed Cache)
1. Go to [upstash.com](https://upstash.com) and create a free Redis database.
2. Under Database details, copy the **`REDIS_URL`** (starts with `rediss://` for TLS):
   ```env
   REDIS_URL=rediss://default:YOUR_TOKEN@gusc1-db.upstash.io:6379
   ```

### Step 4: Run MCPShield in Pure Cloud Mode
Run MCPShield with your cloud environment variables:
```bash
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
```

---

## 3. Verification & Cloud Health Observability

You can verify that zero data touches local disk by querying the Cloud Status API:

### Check Multi-Tier Cloud Health
```bash
curl http://127.0.0.1:8000/api/v1/cloud/overview \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Sample Response:**
```json
{
  "architecture": "Serverless Multi-Cloud (Zero Local Storage)",
  "estimated_monthly_cost": "$0.00 / month",
  "cloud_tiers": {
    "relational_database": {
      "type": "cloud_postgres",
      "provider": "Neon Serverless",
      "host": "ep-solitary-river-123456.us-east-2.aws.neon.tech",
      "serverless": true,
      "ssl": true,
      "cost": "$0.00 / month (Free Tier)"
    },
    "object_storage": {
      "status": "connected",
      "provider": "Cloudflare R2 ($0 Egress)",
      "bucket": "mcpshield-cloud-vault",
      "zero_egress_fee": true,
      "free_tier": "10 GB Storage / Month",
      "cost": "$0.00 / month"
    },
    "distributed_cache": {
      "status": "connected",
      "provider": "Upstash Serverless Redis",
      "serverless": true,
      "free_tier": "10,000 commands/day",
      "cost": "$0.00 / month"
    }
  }
}
```

### Archive Audits Directly to Cloudflare R2
```bash
curl -X POST http://127.0.0.1:8000/api/v1/cloud/archive-audits \
  -H "Authorization: Bearer <your_jwt_token>"
```
This streams cryptographic audit events directly to your Cloudflare R2 bucket (`audit_archives/prod/arch_...json.gz`) with zero local temporary disk writes.
