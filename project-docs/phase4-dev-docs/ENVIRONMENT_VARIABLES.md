# Environment Variables

This document provides a comprehensive guide to all environment variables used in the Stock Management System.

## Table of Contents

- [Overview](#overview)
- [Variable Types](#variable-types)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Stock Management System uses environment variables to configure database connections, authentication, and application settings. Variables are loaded from a `.env` file in the project root.

**Variable Naming Convention:**

- **Private variables**: Server-only, never exposed to client (e.g., `DATABASE_URL`)
- **Public variables**: Exposed to client, prefixed with `NUXT_PUBLIC_` (e.g., `NUXT_PUBLIC_SITE_URL`)

## Variable Types

### Public vs Private Variables

| Type    | Prefix         | Exposure        | Use Case                          | Example                |
| ------- | -------------- | --------------- | --------------------------------- | ---------------------- |
| Private | None           | Server only     | Database URLs, API keys, secrets  | `DATABASE_URL`         |
| Public  | `NUXT_PUBLIC_` | Client & server | Site URL, currency, feature flags | `NUXT_PUBLIC_CURRENCY` |

**Important:** Never put sensitive data in `NUXT_PUBLIC_*` variables as they are bundled in the client-side JavaScript.

## Required Variables

### Database Configuration

#### `DATABASE_URL`

- **Type:** Private
- **Required:** Yes
- **Description:** PostgreSQL connection string for Prisma
- **Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require&pgbouncer=true`

**How to get this:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings → Database**
4. Under **Connection String**, copy the **Transaction pooler** connection string (port 6543)

**Example:**

```bash
DATABASE_URL="postgresql://postgres.abc123:yourpassword@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**Important Notes:**

- Use **port 6543** for Transaction mode pooler (required by Prisma)
- Do NOT use port 5432 (Direct connection) with Prisma
- Always include `sslmode=require` for secure connections
- Include `pgbouncer=true` when using Supabase pooler

### Supabase Configuration

#### `SUPABASE_URL`

- **Type:** Private (used server-side)
- **Required:** Yes
- **Description:** Your Supabase project URL
- **Format:** `https://your-project-ref.supabase.co`

**How to get this:**

1. Go to **Project Settings → API**
2. Copy the **Project URL**

**Example:**

```bash
SUPABASE_URL="https://abc123xyz.supabase.co"
```

#### `SUPABASE_ANON_KEY`

- **Type:** Private (safe to expose on client if needed, but kept private here)
- **Required:** Yes
- **Description:** Supabase anonymous/public key for client-side access
- **Format:** Long JWT token

**How to get this:**

1. Go to **Project Settings → API**
2. Copy the **anon public** key

**Example:**

```bash
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Usage:** This key is safe to use on the client for RLS-protected operations (currently not used in MVP but available for future enhancements).

#### `SUPABASE_SERVICE_KEY`

- **Type:** Private
- **Required:** Yes
- **Description:** Supabase service role key with admin access
- **Format:** Long JWT token

**How to get this:**

1. Go to **Project Settings → API**
2. Copy the **service_role** key (click "Reveal" first)

**Example:**

```bash
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**⚠️ SECURITY WARNING:**

- This key bypasses all Row Level Security (RLS) policies
- **NEVER** expose this key to the client
- **NEVER** commit this to version control
- Store securely in environment variables only

### Authentication Configuration

#### `AUTH_SECRET`

- **Type:** Private
- **Required:** Yes
- **Description:** Secret key for signing JWT tokens
- **Format:** Base64-encoded random string (minimum 32 bytes)

**How to generate:**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using OpenSSL
openssl rand -base64 32
```

**Example:**

```bash
AUTH_SECRET="A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6="
```

**Important Notes:**

- Must be at least 32 bytes of random data
- Keep this secret secure - compromising it allows token forgery
- Different secret for development and production
- Rotate periodically for security

### Application Configuration

#### `NUXT_PUBLIC_SITE_URL`

- **Type:** Public
- **Required:** Yes
- **Description:** The base URL of your application
- **Format:** Full URL with protocol

**Examples:**

```bash
# Development
NUXT_PUBLIC_SITE_URL="http://localhost:3000"

# Production
NUXT_PUBLIC_SITE_URL="https://stock.yourdomain.com"

# Vercel Preview
NUXT_PUBLIC_SITE_URL="https://stock-management-git-feature-branch.vercel.app"
```

**Usage:**

- OAuth redirect URLs
- Email link generation
- API callback URLs
- PWA manifest URLs

## Optional Variables

### Currency Configuration

#### `NUXT_PUBLIC_CURRENCY`

- **Type:** Public
- **Required:** No
- **Default:** `SAR`
- **Description:** Currency code for monetary displays
- **Format:** 3-letter ISO 4217 currency code

**Example:**

```bash
NUXT_PUBLIC_CURRENCY="SAR"  # Saudi Riyal (default)
NUXT_PUBLIC_CURRENCY="USD"  # US Dollar
NUXT_PUBLIC_CURRENCY="EUR"  # Euro
```

**Usage:**

- Price formatting (e.g., "SAR 1,234.56")
- Financial reports
- Invoice generation

## Environment-Specific Configuration

### Development Environment (`.env`)

```bash
# Database (Supabase - Development project)
DATABASE_URL="postgresql://postgres.devproject:devpassword@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Supabase (Development project)
SUPABASE_URL="https://devproject.supabase.co"
SUPABASE_ANON_KEY="eyJ...dev-anon-key...xyz"
SUPABASE_SERVICE_KEY="eyJ...dev-service-key...xyz"

# Auth (Development secret - can be weaker)
AUTH_SECRET="dev-secret-do-not-use-in-production-12345678"

# Application (Localhost)
NUXT_PUBLIC_SITE_URL="http://localhost:3000"
NUXT_PUBLIC_CURRENCY="SAR"
```

### Production Environment (Vercel)

```bash
# Database (Supabase - Production project)
DATABASE_URL="postgresql://postgres.prodproject:strongpassword@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Supabase (Production project)
SUPABASE_URL="https://prodproject.supabase.co"
SUPABASE_ANON_KEY="eyJ...prod-anon-key...xyz"
SUPABASE_SERVICE_KEY="eyJ...prod-service-key...xyz"

# Auth (Production secret - must be strong)
AUTH_SECRET="super-strong-random-secret-base64-encoded-minimum-32-bytes"

# Application (Production domain)
NUXT_PUBLIC_SITE_URL="https://stock.yourdomain.com"
NUXT_PUBLIC_CURRENCY="SAR"
```

## Security Best Practices

### 1. Never Commit Secrets

**Add to `.gitignore`:**

```gitignore
.env
.env.local
.env.*.local
```

**Use `.env.example` template:**

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Separate Environments

- **Development**: Use separate Supabase project with test data
- **Staging**: Optional staging environment with production-like data
- **Production**: Production Supabase project with real data

### 3. Rotate Secrets Regularly

- Rotate `AUTH_SECRET` every 90 days
- Rotate `SUPABASE_SERVICE_KEY` if compromised
- Update all sessions after rotation

### 4. Secure Storage

- **Local development**: `.env` file (in `.gitignore`)
- **Vercel**: Environment variables in project settings
- **Team sharing**: Use password manager or secret management service (1Password, AWS Secrets Manager)

### 5. Principle of Least Privilege

- Only expose variables that need to be public
- Use `SUPABASE_ANON_KEY` for client operations when possible
- Reserve `SUPABASE_SERVICE_KEY` for server-only admin operations

## Troubleshooting

### Common Issues

#### Issue: "Can't reach database server"

**Cause:** Incorrect `DATABASE_URL` or wrong port number

**Solution:**

1. Verify you're using **port 6543** (Transaction pooler), not 5432
2. Check connection string format
3. Ensure `sslmode=require` and `pgbouncer=true` are included

**Test connection:**

```bash
pnpm prisma db pull
```

#### Issue: "Invalid JWT secret"

**Cause:** `AUTH_SECRET` is missing or too short

**Solution:**

1. Generate a new secret with at least 32 bytes:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. Update `.env` with new secret
3. Restart dev server

#### Issue: "Supabase API error 401"

**Cause:** Invalid `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_KEY`

**Solution:**

1. Go to Supabase Dashboard → Project Settings → API
2. Copy the correct keys (reveal service_role key)
3. Update `.env`
4. Restart dev server

#### Issue: Environment variables not loaded

**Cause:** `.env` file not in project root or syntax error

**Solution:**

1. Ensure `.env` is in project root (same level as `package.json`)
2. Check for syntax errors (no quotes around values unless needed)
3. Restart dev server (`pnpm dev`)

**Verify variables are loaded:**

```bash
# In server/api route
console.log(process.env.DATABASE_URL);

# For public variables (client-side)
console.log(useRuntimeConfig().public.siteUrl);
```

### Validation Checklist

Before running the application, verify all required variables:

- [ ] `DATABASE_URL` is set and uses port 6543
- [ ] `SUPABASE_URL` matches your Supabase project
- [ ] `SUPABASE_ANON_KEY` is set correctly
- [ ] `SUPABASE_SERVICE_KEY` is set correctly (and kept secret!)
- [ ] `AUTH_SECRET` is at least 32 bytes of random data
- [ ] `NUXT_PUBLIC_SITE_URL` matches your current environment
- [ ] `.env` file is in `.gitignore`
- [ ] Different secrets for development vs production

### Getting Help

If you continue to experience issues:

1. Check Supabase project status (not paused)
2. Verify network connectivity
3. Review Nuxt server logs for detailed error messages
4. Consult [Nuxt documentation](https://nuxt.com/docs/guide/directory-structure/env) for environment variable configuration
5. Consult [Supabase documentation](https://supabase.com/docs/guides/database/connecting-to-postgres) for connection issues

---

**Last Updated:** 2025-11-27
