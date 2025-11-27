# Deployment Guide

This document provides comprehensive instructions for deploying the Stock Management System to production.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Prerequisites](#prerequisites)
- [Supabase Database Setup](#supabase-database-setup)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment Steps](#post-deployment-steps)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Database Migrations](#database-migrations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Deployment Overview

The Stock Management System uses a modern serverless architecture:

**Architecture:**
- **Frontend & API**: Vercel (Nuxt 4 SPA + serverless functions)
- **Database**: Supabase (PostgreSQL 15+)
- **Auth**: JWT tokens in httpOnly cookies
- **PWA**: Service worker with offline awareness

**Deployment Flow:**

1. Code pushed to `main` branch → Automatic deployment to Vercel production
2. Code pushed to feature branches → Automatic preview deployments
3. Database migrations → Manual execution via CLI

## Prerequisites

Before deploying, ensure you have:

- [x] **GitHub account** with repository access
- [x] **Vercel account** (free tier sufficient for MVP)
- [x] **Supabase account** (free tier sufficient for MVP)
- [x] **pnpm** installed locally (for database migrations)
- [x] **Git** configured with SSH keys or HTTPS access
- [x] All required environment variables documented (see [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md))

## Supabase Database Setup

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: Stock Management System (Production)
   - **Database Password**: Generate strong password (save securely!)
   - **Region**: Choose closest to your users (e.g., `ap-southeast-2` for Asia Pacific)
   - **Pricing Plan**: Free (or Pro for production workloads)
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Configure Database Connection

1. Navigate to **Project Settings → Database**
2. Copy the **Connection String > Transaction pooler**:
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```
3. **Important**: Note the **port 6543** (Transaction mode required by Prisma)
4. Save this as your `DATABASE_URL` environment variable

### Step 3: Get API Keys

1. Navigate to **Project Settings → API**
2. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** (click "Reveal") → `SUPABASE_SERVICE_KEY`

**⚠️ Security Warning:**
- Keep `SUPABASE_SERVICE_KEY` secret (never commit to Git)
- Store securely in password manager
- Only use in server-side code

### Step 4: Run Database Migrations

From your local machine:

```bash
# 1. Set up environment variables
cp .env.example .env.production
# Edit .env.production with production DATABASE_URL

# 2. Run migrations
export DATABASE_URL="<your-production-database-url>"
pnpm db:migrate deploy

# 3. Verify migration success
pnpm prisma db pull
```

**Expected output:**
```
✓ Migrations applied successfully
✓ Prisma schema is in sync with database
```

### Step 5: Seed Initial Data (Optional)

For first-time setup, seed essential data:

```bash
# Seed admin user, locations, items, suppliers
pnpm db:seed

# Or manually via Prisma Studio
pnpm db:studio
```

**Initial Seed Data:**
- Admin user (email: `admin@example.com`, password: change on first login)
- Default locations (Kitchen, Store, Central, Warehouse)
- Sample items and suppliers
- First period (current month)

## Vercel Deployment

### Step 1: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New → Project"**
3. Import your Git repository:
   - Select **GitHub/GitLab/Bitbucket**
   - Authorize Vercel to access your repository
   - Select the `stock-management-system` repository
4. Configure project:
   - **Framework Preset**: Nuxt.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build` (default)
   - **Output Directory**: `.output` (default)
   - **Install Command**: `pnpm install` (default)

### Step 2: Configure Environment Variables

1. In Vercel project settings, navigate to **Settings → Environment Variables**
2. Add all required variables for **Production** environment:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` (from Supabase) | Production |
| `SUPABASE_URL` | `https://[PROJECT].supabase.co` | Production |
| `SUPABASE_ANON_KEY` | `eyJ...` | Production |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | Production |
| `AUTH_SECRET` | Strong random string (min 32 bytes) | Production |
| `NUXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production |
| `NUXT_PUBLIC_CURRENCY` | `SAR` | Production |

**Generate AUTH_SECRET:**
```bash
# On your local machine
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copy output to Vercel
```

**Important:**
- Use **different** `AUTH_SECRET` for production vs development
- Ensure `NUXT_PUBLIC_SITE_URL` matches your actual domain
- Click **"Save"** after adding each variable

### Step 3: Deploy

1. Click **"Deploy"** in Vercel
2. Vercel will:
   - Clone your repository
   - Install dependencies with `pnpm install`
   - Run `pnpm build`
   - Deploy to production URL
3. Monitor deployment logs for errors
4. Deployment typically takes 2-5 minutes

**Expected output:**
```
✓ Deployment successful
✓ Production: https://stock-management-system.vercel.app
```

### Step 4: Configure Custom Domain (Optional)

1. In Vercel project, navigate to **Settings → Domains**
2. Add your custom domain:
   - Example: `stock.yourdomain.com`
3. Configure DNS:
   - Add CNAME record: `stock.yourdomain.com` → `cname.vercel-dns.com`
   - Or A record: `@` → Vercel IP (provided in settings)
4. Wait for DNS propagation (5-30 minutes)
5. Update `NUXT_PUBLIC_SITE_URL` to use custom domain
6. Redeploy to apply changes

## Post-Deployment Steps

### Step 1: Verify Deployment

**Test critical functionality:**

1. **Health Check**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```
   Expected: `{"status":"ok","database":"connected"}`

2. **Database Connection**
   - Login to app
   - Create test delivery
   - Verify data in Supabase dashboard

3. **PWA Installation**
   - Visit app on mobile device
   - Click "Install" prompt
   - Verify app installs and opens

### Step 2: Create Initial Users

**Option A: Via API (if registration endpoint is public)**

```bash
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@example.com",
    "password": "SecurePassword123!",
    "full_name": "Supervisor User",
    "role": "SUPERVISOR"
  }'
```

**Option B: Via Database (Prisma Studio)**

```bash
# Local connection to production database
export DATABASE_URL="<production-url>"
pnpm db:studio
```

1. Open Prisma Studio (http://localhost:5555)
2. Navigate to `users` table
3. Create new user with hashed password

**Option C: Via Seed Script**

```bash
# Run seed script with production DATABASE_URL
pnpm db:seed
```

### Step 3: Assign Users to Locations

1. Login as Admin user
2. Navigate to **Locations** page
3. For each location:
   - Click location → **Manage Users**
   - Assign operators/supervisors with appropriate access levels
   - Set access level: VIEW, POST, or MANAGE

### Step 4: Set Up First Period

1. Login as Admin
2. Navigate to **Periods** page
3. Create first period:
   - **Name**: Current month (e.g., "January 2025")
   - **Start Date**: First day of month
   - **End Date**: Last day of month
4. Set item prices for the period
5. Open period for transactions

### Step 5: Test End-to-End Workflow

**Test Scenario: Delivery → Issue → Transfer → Period Close**

1. **Post Delivery** (Operator)
   - Create delivery with 2-3 items
   - Verify stock increases
   - Verify WAC calculation
   - Check for auto-generated NCR if price variance

2. **Post Issue** (Operator)
   - Create issue consuming some stock
   - Verify stock decreases
   - Verify WAC unchanged (uses current WAC)

3. **Create Transfer** (Operator)
   - Transfer between two locations
   - Verify status: PENDING_APPROVAL

4. **Approve Transfer** (Supervisor)
   - Approve pending transfer
   - Verify stock moved atomically

5. **Period Close** (Admin)
   - Mark all locations as READY
   - Initiate period close
   - Verify reconciliations calculated
   - Verify next period created

## Environment-Specific Configuration

### Development Environment

**Purpose:** Local development and testing

**Configuration:**
```bash
# .env (local)
DATABASE_URL="postgresql://postgres.dev:devpass@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://devproject.supabase.co"
AUTH_SECRET="dev-secret-not-for-production"
NUXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Database:** Separate Supabase project for development
**Data:** Test/dummy data, safe to reset
**Deployments:** Run locally with `pnpm dev`

### Staging Environment (Optional)

**Purpose:** Pre-production testing with production-like data

**Configuration:**
```bash
# Vercel staging environment variables
DATABASE_URL="postgresql://postgres.staging:stagingpass@..."
NUXT_PUBLIC_SITE_URL="https://staging-stock.vercel.app"
```

**Database:** Separate Supabase project for staging
**Data:** Sanitized copy of production data
**Deployments:** Automatic from `staging` branch

### Production Environment

**Purpose:** Live application for end users

**Configuration:**
```bash
# Vercel production environment variables
DATABASE_URL="postgresql://postgres.prod:strongpass@..."
AUTH_SECRET="<strong-random-32-byte-secret>"
NUXT_PUBLIC_SITE_URL="https://stock.yourdomain.com"
```

**Database:** Supabase production project
**Data:** Real user data, backup critical
**Deployments:** Automatic from `main` branch

## Database Migrations

### Development Migrations

When developing new features with schema changes:

```bash
# 1. Edit schema
nano prisma/schema.prisma

# 2. Create migration
pnpm db:migrate dev --name add-new-feature

# 3. Test migration
pnpm db:migrate reset  # Reset DB and re-run all migrations
pnpm test:api          # Run tests
```

### Production Migrations

**⚠️ Critical: Always test migrations in staging first!**

```bash
# 1. Backup production database
# Via Supabase Dashboard: Database → Backups → Create backup

# 2. Run migration on production
export DATABASE_URL="<production-url>"
pnpm db:migrate deploy

# 3. Verify migration success
pnpm prisma db pull
pnpm prisma validate

# 4. If issues, rollback (see Rollback Procedures)
```

**Best Practices:**

- Run migrations during low-traffic periods
- Test migrations on staging environment first
- Backup database before migrations
- Monitor application logs after deployment
- Have rollback plan ready

### Migration Checklist

Before running production migrations:

- [ ] Schema changes tested locally
- [ ] Migration tested on staging environment
- [ ] Database backup created
- [ ] Low-traffic time scheduled
- [ ] Team notified of maintenance window
- [ ] Rollback procedure documented
- [ ] Monitoring dashboard open

## Monitoring and Maintenance

### Vercel Monitoring

**Built-in Monitoring:**

1. **Deployment Logs**
   - View in Vercel Dashboard → Project → Deployments
   - Check build logs for errors
   - Monitor deployment duration

2. **Function Logs**
   - View in Vercel Dashboard → Project → Logs
   - Real-time API route logs
   - Filter by function, time range

3. **Analytics** (Pro plan)
   - Page views, user sessions
   - Performance metrics
   - Real User Monitoring (RUM)

### Supabase Monitoring

**Database Monitoring:**

1. **Database Health**
   - Dashboard → Project → Database
   - CPU usage, memory, connections
   - Slow query log

2. **API Analytics**
   - Dashboard → Project → API
   - Request counts, errors
   - Response times

3. **Backups**
   - Automatic daily backups (Pro plan)
   - Point-in-time recovery
   - Manual backups: Database → Backups

### Application Health Checks

**Set up monitoring service (optional):**

- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Pingdom](https://www.pingdom.com) - Advanced monitoring
- [New Relic](https://newrelic.com) - APM with Vercel integration

**Monitor endpoints:**
- `GET /api/health` - Health check (every 5 minutes)
- `GET /` - Homepage availability

**Alert thresholds:**
- Response time > 3s
- Downtime > 2 minutes
- Error rate > 5%

### Database Backups

**Automated Backups (Supabase Pro):**

- Daily automated backups
- 7-day retention
- Point-in-time recovery

**Manual Backups:**

```bash
# Via pg_dump
export DATABASE_URL="<production-url>"
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup-20250115.sql
```

**Backup Schedule:**

- **Daily**: Automated (Supabase)
- **Before migrations**: Manual
- **Before major releases**: Manual
- **Monthly**: Archive off-site

## Troubleshooting

### Deployment Fails

**Issue:** Vercel deployment fails during build

**Diagnosis:**
```bash
# Check Vercel deployment logs
# Common issues:
# - TypeScript errors
# - Missing environment variables
# - Build timeout
```

**Solutions:**

1. **TypeScript errors:**
   ```bash
   # Run locally
   pnpm typecheck
   # Fix all errors before deploying
   ```

2. **Missing environment variables:**
   - Check Vercel → Settings → Environment Variables
   - Ensure all required variables are set
   - Verify no typos in variable names

3. **Build timeout:**
   - Check build logs for slow operations
   - Optimize build configuration
   - Contact Vercel support for timeout increase

### Database Connection Errors

**Issue:** "Can't reach database server"

**Diagnosis:**
```bash
# Test connection
pnpm prisma db pull
```

**Solutions:**

1. **Wrong port:**
   - Ensure using **port 6543** (Transaction pooler)
   - Not port 5432 (Direct connection)

2. **Invalid credentials:**
   - Verify DATABASE_URL in Vercel environment variables
   - Check password hasn't changed in Supabase

3. **Connection pool exhausted:**
   - Restart Vercel functions (redeploy)
   - Check for connection leaks in code

### Application Errors

**Issue:** 500 Internal Server Error

**Diagnosis:**
1. Check Vercel function logs
2. Look for stack traces
3. Identify error source (API route, database query)

**Solutions:**

1. **Database query errors:**
   - Check schema matches database
   - Run `pnpm prisma generate`
   - Redeploy

2. **Missing dependencies:**
   - Verify `package.json` includes all dependencies
   - Check `pnpm-lock.yaml` is committed

3. **Environment variable errors:**
   - Verify all required variables set
   - Check for typos in variable names

## Rollback Procedures

### Rollback Deployment

**If deployment causes issues:**

1. **Via Vercel Dashboard:**
   - Go to Deployments
   - Find last working deployment
   - Click **"..."** → **"Promote to Production"**

2. **Via Git:**
   ```bash
   # Revert last commit
   git revert HEAD
   git push origin main
   # Vercel auto-deploys reverted code
   ```

### Rollback Database Migration

**⚠️ Only if migration causes critical issues**

**Option A: Restore from backup**

```bash
# 1. Download backup from Supabase
# Dashboard → Database → Backups → Download

# 2. Restore backup
export DATABASE_URL="<production-url>"
psql $DATABASE_URL < backup.sql

# 3. Verify data integrity
pnpm prisma db pull
```

**Option B: Rollback migration (if recent)**

```bash
# WARNING: May cause data loss
# Only use if no data created since migration

# 1. Identify migration to rollback
pnpm prisma migrate status

# 2. Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back [migration-name]

# 3. Revert schema changes
git revert [migration-commit]
pnpm db:migrate deploy
```

### Emergency Procedures

**If application is completely down:**

1. **Immediate Actions:**
   - Rollback to last working deployment (Vercel)
   - Restore database from backup (if needed)
   - Notify users of service disruption

2. **Post-Incident:**
   - Investigate root cause
   - Document incident and resolution
   - Implement preventive measures
   - Update runbook

## Deployment Checklist

Use this checklist for each production deployment:

### Pre-Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Code formatted (`pnpm format:check`)
- [ ] Database migrations tested on staging
- [ ] Environment variables documented
- [ ] Backup created (if database changes)
- [ ] Team notified of deployment
- [ ] Rollback plan prepared

### Deployment

- [ ] Merge to `main` branch
- [ ] Monitor Vercel deployment logs
- [ ] Wait for successful deployment
- [ ] Verify deployment preview

### Post-Deployment

- [ ] Health check passes (`/api/health`)
- [ ] Login works
- [ ] Critical user journeys tested
- [ ] PWA installs correctly
- [ ] No errors in logs (first 10 minutes)
- [ ] Performance acceptable (Lighthouse score)
- [ ] Team notified of completion

---

**Deployment Guide Version:** 1.0
**Last Updated:** 2025-11-27
**Maintained By:** Development Team
