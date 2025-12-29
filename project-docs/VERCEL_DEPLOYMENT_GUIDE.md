# Vercel Deployment Guide

This guide walks through deploying the Stock Management System to Vercel with a Supabase PostgreSQL database.

---

## Prerequisites

Before deploying, ensure you have:

1. A [Vercel account](https://vercel.com/signup) (free tier works)
2. A [Supabase account](https://supabase.com) with a project created
3. A GitHub account with this repository pushed
4. All environment variables ready (see `.env.example`)

---

## Step 1: Create Vercel Project

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Connect your GitHub account if not already connected
4. Select the `stock-management-system` repository
5. Vercel will auto-detect the Nuxt framework
6. **Do NOT deploy yet** - first configure environment variables

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link the project (run from project root)
vercel link
```

---

## Step 2: Configure Environment Variables

In the Vercel dashboard, go to **Settings > Environment Variables** and add the following:

### Database Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma connection string (Transaction pooler, port 6543) | `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Direct connection for migrations (port 5432) | `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require` |

**Getting these values from Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings > Database**
3. Copy the **Transaction** connection string for `DATABASE_URL`
4. Copy the **Direct** connection string for `DIRECT_URL`

### Supabase Configuration

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Project URL | Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Anonymous key (public) | Settings > API > anon public |
| `SUPABASE_SERVICE_KEY` | Service role key (secret!) | Settings > API > service_role secret |

### Authentication

| Variable | Description | How to generate |
|----------|-------------|-----------------|
| `AUTH_SECRET` | JWT signing secret (32+ chars) | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NUXT_SESSION_PASSWORD` | Session encryption (32+ chars) | `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` |

### Application Settings

| Variable | Value |
|----------|-------|
| `NUXT_PUBLIC_SITE_URL` | Your Vercel domain (e.g., `https://stock-management.vercel.app`) |
| `NUXT_PUBLIC_CURRENCY` | `SAR` |

---

## Step 3: Run Database Migrations

Before deploying, ensure your database schema is up to date:

### From Local Machine

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to production database
pnpm db:push
```

**Note:** If `db:push` fails with connection errors:
1. Ensure your Supabase project is not paused (check dashboard)
2. If behind a firewall, you may need the IPv4 add-on in Supabase
3. Try running from a different network

### Alternative: Seed Production Data

After schema is ready:

```bash
pnpm db:seed
```

---

## Step 4: Deploy

### First Deployment

1. In Vercel dashboard, click **"Deploy"**
2. Wait for the build to complete (typically 2-3 minutes)
3. Once deployed, you'll get a URL like `https://stock-management-xxx.vercel.app`

### Subsequent Deployments

Vercel automatically deploys when you push to the `main` branch:

- **Production**: Pushes to `main` deploy to production
- **Preview**: Pull requests create preview deployments

---

## Step 5: Verify Deployment

After deployment, verify everything works:

### Checklist

- [ ] Visit the production URL - homepage loads
- [ ] Login page works
- [ ] API endpoints respond (e.g., `/api/health`)
- [ ] PWA installs correctly on mobile
- [ ] Database operations work (try logging in)

### Test API Health

```bash
curl https://your-app.vercel.app/api/health
```

---

## Step 6: Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings > Domains** in Vercel
2. Add your domain (e.g., `stock.yourcompany.com`)
3. Update DNS records as instructed:
   - Add a CNAME record pointing to `cname.vercel-dns.com`
4. Update `NUXT_PUBLIC_SITE_URL` to your custom domain
5. Vercel automatically provisions SSL certificate

---

## Monitoring & Logs

### Vercel Analytics

- Go to **Analytics** tab for performance metrics
- View Core Web Vitals scores
- Monitor visitor traffic

### Function Logs

- Go to **Logs** tab for server-side logs
- Filter by function (API routes)
- Search for errors

### Supabase Monitoring

In Supabase dashboard:
- **Database > Query Performance** - Slow query analysis
- **Logs > Postgres** - Database logs
- **Settings > Database** - Connection pool status

---

## Troubleshooting

### Build Fails

**Prisma client errors:**
```
"promisify" is not exported by "__vite-browser-external"
```
- Ensure Prisma is only imported in `/server/` directories
- Check that no client components import Prisma

**Module not found:**
- Run `pnpm install` locally first
- Check `package.json` dependencies

### Database Connection Fails

**Error: Can't reach database server**
1. Check Supabase project is not paused
2. Verify connection string format (port 6543 for pooler)
3. Enable IPv4 add-on if behind restrictive firewall

### API Returns 500

1. Check function logs in Vercel dashboard
2. Verify all environment variables are set
3. Check database schema matches Prisma schema

---

## Security Checklist

Before going live:

- [ ] All secrets are in environment variables (not in code)
- [ ] `SUPABASE_SERVICE_KEY` is only used server-side
- [ ] `AUTH_SECRET` is unique and not reused
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] Database uses SSL (`sslmode=require`)

---

## Rollback

If a deployment causes issues:

1. Go to **Deployments** tab in Vercel
2. Find the last working deployment
3. Click the **...** menu > **Promote to Production**

This instantly rolls back to the previous version.

---

## Environment-Specific Settings

| Setting | Development | Production |
|---------|-------------|------------|
| `NUXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |
| Database | Can use same Supabase or local | Production Supabase |
| PWA | Disabled in dev | Enabled |
| SSL | Optional | Required |

---

## Cost Considerations

### Vercel (Free Tier)
- 100GB bandwidth/month
- Serverless function invocations: 100,000/month
- Suitable for small-medium workloads

### Supabase (Free Tier)
- 500MB database storage
- 2GB bandwidth/month
- Pauses after 1 week of inactivity

For production use, consider:
- Vercel Pro ($20/user/month)
- Supabase Pro ($25/month)

---

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Nuxt Deployment Guide**: https://nuxt.com/docs/getting-started/deployment
