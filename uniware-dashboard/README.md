# Weekly Review Dashboard — Uniware MCP Integration

## Security Model
```
Browser  →  /api/uniware (Vercel serverless)  →  corona-staging.astrotalk.store/mcp
```
The MCP Bearer token lives **only** in Vercel environment variables.
It is never sent to the browser. Never commit `.env.local` to git.

---

## Setup

### 1. Clone / create repo
```bash
mkdir weekly-dashboard && cd weekly-dashboard
# Copy all files here
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create local env file
```bash
cp .env.example .env.local
# Edit .env.local — add your real MCP_TOKEN
```

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)
```bash
npm i -g vercel
vercel
# Follow prompts, then:
vercel env add MCP_URL
vercel env add MCP_TOKEN
vercel env add MCP_FACILITY_CODE
vercel --prod
```

### Option B — GitHub + Vercel UI
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import repo
3. Go to Project Settings → Environment Variables → Add:

| Name | Value |
|------|-------|
| `MCP_URL` | `https://corona-staging.astrotalk.store/mcp` |
| `MCP_TOKEN` | `your-bearer-token-here` |
| `MCP_FACILITY_CODE` | `MSKT_FZP` |

4. Click **Redeploy**

---

## API Endpoints

| Endpoint | Returns |
|----------|---------|
| `GET /api/uniware?type=all` | inventory + POs + GRN (parallel) |
| `GET /api/uniware?type=inventory` | Inventory Snapshot CSV → normalised |
| `GET /api/uniware?type=po` | POs (last 90 days) → PO_BY_SKU map |
| `GET /api/uniware?type=grn` | Astrotalk GRN (last 30 days) |

---

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `initialize` | MCP session handshake |
| `create_export_job` | Triggers Inventory Snapshot / GRN export |
| `get_export_job_status` | Polls until SUCCESSFUL, gets CSV URL |
| `create_sale_order_export` | DRR export (sku_drr preset) |
| `search_purchase_orders` | Lists PO codes (last 90d) |
| `get_purchase_order_details` | Full PO details per code |

---

## Updating the Token

When the MCP Bearer token rotates:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Edit `MCP_TOKEN` → paste new value
3. Redeploy (or it auto-deploys on next push)

**Never** put the token in frontend code, HTML, or git history.
