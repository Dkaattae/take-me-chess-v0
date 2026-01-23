# Deployment Guide

Choose either Fly.io or Railway for deployment.

## Option 1: Deploy to Fly.io

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login to Fly.io
```bash
fly auth login
```

### Step 3: Create PostgreSQL Database
```bash
fly postgres create --name take-me-chess-db --region sjc
```
This will output a connection string. Save it!

### Step 4: Create fly.toml
Create a file named `fly.toml` in the project root:

```toml
app = "take-me-chess"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  # DATABASE_URL will be set as a secret

[http_service]
  internal_port = 80
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Step 5: Set Database URL Secret
```bash
fly secrets set DATABASE_URL="postgresql://user:password@hostname:5432/dbname"
```
(Use the connection string from Step 3)

### Step 6: Deploy
```bash
fly deploy
```

### Step 7: Open Your App
```bash
fly open
```

---

## Option 2: Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Initialize Project
```bash
railway init
```

### Step 4: Add PostgreSQL Database
```bash
railway add --database postgres
```
Railway will automatically create a `DATABASE_URL` environment variable.

### Step 5: Deploy
```bash
railway up
```

### Step 6: Open Your App
```bash
railway open
```

---

## Important Notes

### Database URL Format
Your `DATABASE_URL` should look like:
```
postgresql://username:password@hostname:5432/database_name
```

### Environment Variables
The Dockerfile already has a default `DATABASE_URL` set, but it will be overridden by:
- Fly.io: `fly secrets set DATABASE_URL=...`
- Railway: Automatically injected when you add Postgres

### Port Configuration
- The app runs on port 80 inside the container
- Both platforms will handle external HTTPS/port mapping automatically

### Health Checks
Both platforms can use `/api/health` for health checks.

---

## Recommended: Railway (Easier)

Railway is simpler because:
1. Automatic DATABASE_URL injection
2. No manual configuration files needed
3. Automatic HTTPS
4. Built-in database management UI

For Railway, you literally just need:
```bash
railway login
railway init
railway add --database postgres
railway up
```

Done! 🚀
