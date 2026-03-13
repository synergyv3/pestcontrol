# 🚀 Azure Deployment Guide — PestControl Pro Phase 1

## Prerequisites
- Azure account
- Azure CLI installed (`az login`)
- Node.js 18+ installed locally
- Git installed

---

## Step 1 — Create Azure Resources

```bash
# Login to Azure
az login

# Create a resource group (choose a region close to you)
az group create \
  --name pestcontrol-rg \
  --location canadacentral

# Create an App Service Plan (Basic B1 tier - Linux)
az appservice plan create \
  --name pestcontrol-plan \
  --resource-group pestcontrol-rg \
  --sku B1 \
  --is-linux

# Create the Web App with Node.js 18 LTS
az webapp create \
  --resource-group pestcontrol-rg \
  --plan pestcontrol-plan \
  --name YOUR-UNIQUE-APP-NAME \
  --runtime "NODE:20-lts"
```

> ⚠️ Replace `YOUR-UNIQUE-APP-NAME` with a globally unique name (e.g. `pestcontrol-pro-yourname`).
> Your app will be at: `https://YOUR-UNIQUE-APP-NAME.azurewebsites.net`

---

## Step 2 — Configure Environment Variables

```bash
# Set required environment variables on Azure
az webapp config appsettings set \
  --resource-group pestcontrol-rg \
  --name YOUR-UNIQUE-APP-NAME \
  --settings \
    NODE_ENV=production \
    JWT_SECRET="$(openssl rand -base64 48)" \
    CLIENT_ORIGIN="https://YOUR-UNIQUE-APP-NAME.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

---

## Step 3 — Configure Persistent Storage for SQLite

On Azure Web Apps (Linux), the `/home` directory is persistent across restarts.
You must create the data directory before first run:

```bash
# Enable SSH to your web app
az webapp ssh --resource-group pestcontrol-rg --name YOUR-UNIQUE-APP-NAME

# Inside the SSH session, create the data directory
mkdir -p /home/data
exit
```

---

## Step 4 — Deploy the Application

### Option A: Deploy via ZIP (simplest)

```bash
# From the project root directory:

# Build the React frontend first
cd client && npm install && npm run build && cd ..

# Install backend dependencies
npm install --production

# Create a ZIP of the project (exclude node_modules and client/node_modules)
zip -r deploy.zip . \
  --exclude "*.git*" \
  --exclude "client/node_modules/*" \
  --exclude "*.db" \
  --exclude ".env"

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group pestcontrol-rg \
  --name YOUR-UNIQUE-APP-NAME \
  --src deploy.zip
```

### Option B: Deploy via GitHub Actions (recommended for ongoing development)

1. Push your code to a GitHub repository
2. In Azure Portal → Your Web App → Deployment Center
3. Select GitHub as source
4. Select your repository and branch
5. Azure will auto-configure a GitHub Actions workflow

**Add these secrets to your GitHub repository** (Settings → Secrets):
- `AZURE_WEBAPP_PUBLISH_PROFILE` — Download from Azure Portal → Web App → Overview → Get publish profile

---

## Step 5 — Configure Startup Command

```bash
az webapp config set \
  --resource-group pestcontrol-rg \
  --name YOUR-UNIQUE-APP-NAME \
  --startup-file "node server.js"
```

---

## Step 6 — Verify Deployment

```bash
# Check app logs
az webapp log tail \
  --resource-group pestcontrol-rg \
  --name YOUR-UNIQUE-APP-NAME
```

Then open: `https://YOUR-UNIQUE-APP-NAME.azurewebsites.net`

**Default login credentials (from seed data):**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pestcontrol.local | Admin123! |
| Manager | manager@pestcontrol.local | Manager123! |
| Technician | james@pestcontrol.local | Tech123! |

> ⚠️ **IMPORTANT**: Change all default passwords immediately after first login!

---

## Azure Basic B1 Tier — What You Get

| Resource | B1 Basic |
|----------|----------|
| CPU Cores | 1 |
| RAM | 1.75 GB |
| Storage | 10 GB |
| Custom Domains | ✅ Yes |
| SSL/HTTPS | ✅ Yes (free managed cert) |
| Auto-scaling | ❌ No (upgrade to Standard) |
| Monthly cost | ~$13–$18 USD/month |

**Is B1 sufficient?** Yes, for a small pest control company (< 5 concurrent users, < 500 customers). Upgrade to **Standard S1** when you need auto-scaling or deployment slots.

---

## Adding a Custom Domain (Optional)

```bash
# Add your domain
az webapp custom-hostname set \
  --webapp-name YOUR-UNIQUE-APP-NAME \
  --resource-group pestcontrol-rg \
  --hostname app.yourcompany.com

# Enable free managed SSL certificate
az webapp config ssl bind \
  --name YOUR-UNIQUE-APP-NAME \
  --resource-group pestcontrol-rg \
  --certificate-thumbprint $(az webapp config ssl create \
    --hostname app.yourcompany.com \
    --name YOUR-UNIQUE-APP-NAME \
    --resource-group pestcontrol-rg \
    --query thumbprint -o tsv) \
  --ssl-type SNI
```

---

## Backup Strategy (Important!)

The SQLite database is stored at `/home/data/pestcontrol.db`.
Azure Web Apps persist the `/home` directory, but you should set up regular backups:

```bash
# Enable Azure Web App backups (requires Standard tier or above)
# For Basic tier: manually export via the SSH console periodically
# Or upgrade to Azure SQL Database in Phase 2 for enterprise-grade reliability
```

> 💡 **Phase 2 Recommendation**: Migrate from SQLite to **Azure SQL Database** (serverless tier ~$5/month for small workloads) for proper backup, point-in-time restore, and multi-region replication.

---

## Local Development

```bash
# Clone and install
npm install
cd client && npm install && cd ..

# Create .env file
cp .env.example .env
# Edit .env: set NODE_ENV=development, add a JWT_SECRET

# Start backend (port 8080)
npm run dev

# In another terminal, start frontend (port 3000, proxies to 8080)
cd client && npm start
```

---

## Security Checklist Before Going Live

- [ ] Change all default user passwords
- [ ] Set a strong, unique `JWT_SECRET` (32+ random characters)
- [ ] Enable HTTPS only in Azure Portal (TLS/SSL Settings → HTTPS Only: On)
- [ ] Configure custom domain
- [ ] Review user accounts and roles
- [ ] Set up Azure Monitor alerts for downtime
