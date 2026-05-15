# Deployment Guide - ManpowerOS

This guide covers deploying ManpowerOS to production and staging environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Production Deployment (Render.com)](#production-deployment-rendercom)
- [Staging Environment Setup](#staging-environment-setup)
- [Database Setup](#database-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 20.x (LTS)
- MongoDB Atlas account or MongoDB instance
- Cloudinary account (optional, for cloud file storage)
- Google Cloud Vision API key (optional, for passport OCR)
- Render.com account (for hosting)

## Environment Variables

### Required Variables

Copy `.env.example` to `.env` in both `server/` and `client/` directories and configure:

#### Server (.env)

```bash
# Application
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/manpoweros?retryWrites=true&w=majority

# Security
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# CORS & Client
CORS_ORIGINS=https://manpoweros.onrender.com,https://staging.manpoweros.onrender.com
API_BASE_URL=https://manpoweros.onrender.com

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Vision (Optional)
GOOGLE_VISION_KEY_FILE=/path/to/key.json
```

#### Client (.env.production)

```bash
# Leave empty for same-origin deployment
VITE_SERVER_URL=
```

## Production Deployment (Render.com)

### 1. Create a New Web Service

1. Go to [Render.com Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `manpoweros` (production)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Instance Type**: Choose based on expected traffic

### 2. Set Environment Variables

In the Render dashboard, add all environment variables from the `.env.example` file.

**Critical Variables**:
- `NODE_ENV=production`
- `JWT_SECRET` (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `MONGODB_URI` (from MongoDB Atlas)
- `CORS_ORIGINS` (your Render app URL)
- `API_BASE_URL` (your Render app URL)

### 3. Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy
3. Monitor the logs for any errors

### 4. Configure Custom Domain (Optional)

1. Go to **Settings** → **Custom Domains**
2. Add your domain and configure DNS

## Staging Environment Setup

Create a separate staging environment to test changes before production:

### 1. Create Staging Web Service

Follow the same steps as production, but:
- **Name**: `manpoweros-staging`
- **Branch**: `staging` or `dev`
- **Environment Variables**: Use separate staging database and credentials

### 2. Staging-Specific Configuration

```bash
# Server .env for staging
NODE_ENV=staging
MONGODB_URI=mongodb+srv://...staging-db...
CORS_ORIGINS=https://staging.manpoweros.onrender.com
API_BASE_URL=https://staging.manpoweros.onrender.com
```

### 3. Create Staging Database

In MongoDB Atlas:
1. Create a new database cluster or database for staging
2. Configure network access for Render's IP ranges
3. Create a database user with appropriate permissions

### 4. Automated Staging Deploys

Add a GitHub Actions workflow for staging deploys:

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging, dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Render Deploy
        run: curl -X POST ${{ secrets.RENDER_STAGING_DEPLOY_HOOK }}
```

Store the Render deploy hook URL in GitHub Secrets.

## Database Setup

### MongoDB Atlas Configuration

1. **Create Cluster**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster (M0 free tier for staging)
   - Note the connection string

2. **Network Access**:
   - Add `0.0.0.0/0` to allow connections from Render
   - Or add specific Render IP ranges for better security

3. **Database User**:
   - Create a user with `readWrite` permissions
   - Use a strong password

4. **Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/manpoweros?retryWrites=true&w=majority
   ```

### Indexes

Indexes are automatically created by Mongoose on first connection. To manually verify:

```bash
mongosh "mongodb+srv://..."
use manpoweros
db.candidates.getIndexes()
db.passports.getIndexes()
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

### Workflow Phases

1. **Phase 1 - Install**: Dependencies are cached for faster builds
2. **Phase 2 - Tests**: Run server and client tests
3. **Phase 3 - Build**: Create production bundle and upload artifacts

### Manual Deploy

To deploy manually:

```bash
# Production
git push origin main

# Staging
git checkout staging
git merge main
git push origin staging
```

## Health Checks

The application includes three health check endpoints:

### 1. Health Check
```bash
curl https://your-app.onrender.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-27T17:00:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "database": {
    "connected": true,
    "state": "connected",
    "latency": "ok"
  }
}
```

### 2. Readiness Check
```bash
curl https://your-app.onrender.com/ready
```

### 3. Liveness Check
```bash
curl https://your-app.onrender.com/live
```

### Configure Render Health Checks

In Render dashboard:
1. Go to **Settings** → **Health & Alerts**
2. Set Health Check Path: `/health`
3. Save changes

## Troubleshooting

### Build Fails on Render

**Error**: `vite: not found`
- **Fix**: Ensure `npm install --include=dev` is in the build command
- Build command: `cd server && npm install && npm run build`

**Error**: `MONGODB_URI not set`
- **Fix**: Check environment variables in Render dashboard
- Ensure no trailing spaces in values

### Database Connection Issues

**Error**: `MongoServerError: Authentication failed`
- **Fix**: Verify database user credentials
- Check network access settings in MongoDB Atlas
- Ensure connection string is properly encoded

**Error**: `connection timed out`
- **Fix**: Add `0.0.0.0/0` to network access in MongoDB Atlas
- Check if Render service has internet connectivity

### CORS Errors

**Error**: `Access-Control-Allow-Origin` missing
- **Fix**: Add frontend URL to `CORS_ORIGINS` environment variable
- Format: Comma-separated URLs without trailing slashes
- Example: `https://app1.com,https://app2.com`

### WebSocket Connection Failures

**Error**: `WebSocket connection failed`
- **Fix**: Ensure `VITE_SERVER_URL` is empty or correct in client `.env.production`
- Check that Socket.IO is properly initialized on the server
- Verify JWT token is valid

### File Upload Issues

**Error**: `CLOUDINARY_* not configured`
- **Fix**: Add Cloudinary credentials to environment variables
- Or files will be stored locally (not recommended for Render)

### High Memory Usage

- **Fix**: Increase instance size in Render
- Optimize database queries (use `.lean()` for read-only operations)
- Enable connection pooling (already configured)

## Performance Optimization

### 1. Database

- Indexes are automatically created (see `models/*.js`)
- Use `.lean()` for read-only queries
- Connection pooling is configured:
  - Production: `maxPoolSize: 10, minPoolSize: 2`
  - Development: `maxPoolSize: 5, minPoolSize: 1`

### 2. Client Build

- Code splitting is configured in `vite.config.js`
- React, vendor libraries, and app code are split into separate chunks
- Build artifacts are cached in CI/CD

### 3. Rate Limiting

- Global API limit: 5000 requests / 15 minutes
- Auth endpoints: 5-10 requests / 15 minutes - 1 hour
- Prevents abuse and ensures fair usage

## Security Checklist

Before deploying to production:

- [ ] `JWT_SECRET` is set to a strong random value (minimum 32 characters)
- [ ] `MONGODB_URI` uses a secure password
- [ ] `NODE_ENV=production`
- [ ] Cloudinary API keys are set (if using)
- [ ] CORS origins are restricted to your domains only
- [ ] Database user has minimal required permissions
- [ ] MongoDB Atlas network access is restricted
- [ ] Health check endpoints are working
- [ ] HTTPS is enabled (Render provides this automatically)
- [ ] Sensitive files (`.env`, credentials) are in `.gitignore`

## Monitoring

### Logs

View real-time logs in Render dashboard:
1. Go to your service
2. Click **Logs** tab
3. Filter by severity (info, warn, error)

### Alerts

Configure alerts in Render:
1. Go to **Settings** → **Health & Alerts**
2. Add email notifications for deploy failures
3. Set up Slack/Discord webhooks (optional)

### Database Monitoring

In MongoDB Atlas:
1. Go to **Monitoring** tab
2. Check connection count, operation execution times
3. Set up alerts for high CPU/memory usage

## Rollback Procedure

If a deployment causes issues:

1. **Immediate Rollback**:
   - Go to Render dashboard → **Manual Deploy**
   - Select a previous successful deploy
   - Click **Deploy Selected Commit**

2. **Git Revert**:
   ```bash
   git revert <bad-commit-hash>
   git push origin main
   ```

3. **Emergency Fix**:
   - Create hotfix branch from last good commit
   - Apply fix
   - Deploy directly to production

## Support

For issues not covered in this guide:
- Check Render documentation: https://render.com/docs
- MongoDB Atlas docs: https://www.mongodb.com/docs/atlas/
- GitHub Issues: https://github.com/your-repo/issues

---

Last updated: April 27, 2026
