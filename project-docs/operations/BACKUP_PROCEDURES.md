# Backup Procedures

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Owner:** System Administrator

---

## Table of Contents

1. [Overview](#overview)
2. [Backup Strategy](#backup-strategy)
3. [Supabase Database Backups](#supabase-database-backups)
4. [Vercel Deployment Backups](#vercel-deployment-backups)
5. [Configuration Backups](#configuration-backups)
6. [Backup Verification](#backup-verification)
7. [Restoration Procedures](#restoration-procedures)
8. [Recovery Time Objectives](#recovery-time-objectives)
9. [Backup Testing Schedule](#backup-testing-schedule)
10. [Roles and Responsibilities](#roles-and-responsibilities)

---

## Overview

This document outlines the backup and recovery procedures for the Stock Management System. The system uses a multi-layered backup strategy to ensure data integrity and business continuity.

### Critical Data to Backup

- **Database:** All transactional data (Supabase PostgreSQL)
- **Application Code:** Source code and configurations (GitHub)
- **Environment Variables:** Production secrets and API keys (Vercel)
- **User Data:** User accounts and permissions (Supabase Auth)

### Backup Frequency

| Data Type | Frequency | Retention Period |
|-----------|-----------|------------------|
| Database (Automatic) | Daily | 7 days (Free tier) |
| Database (Manual) | Weekly | 30 days |
| Database (Monthly) | Monthly | 12 months |
| Code Repository | On every commit | Unlimited |
| Environment Variables | On every change | Manual versioning |

---

## Backup Strategy

### 3-2-1 Backup Rule

The system follows the 3-2-1 backup strategy:

- **3 copies** of data: Production database + Supabase automatic backups + manual exports
- **2 different media**: Cloud storage (Supabase) + Local exports (admin workstation)
- **1 offsite copy**: Supabase backups stored in AWS regions separate from production

### Backup Types

1. **Automatic Backups:** Supabase automatic daily backups (managed by Supabase)
2. **Manual Backups:** Weekly manual database exports via Supabase dashboard
3. **Point-in-Time Recovery:** Available through Supabase (Pro tier required)
4. **Code Backups:** GitHub repository with full version history

---

## Supabase Database Backups

### Automatic Backups (Daily)

Supabase automatically backs up the database daily. These backups are:

- **Schedule:** Daily at 2:00 AM UTC
- **Retention:** 7 days (Free tier) / 30 days (Pro tier)
- **Location:** AWS S3 in the same region as production
- **Type:** Full database dump

**No action required** - Supabase handles this automatically.

### Manual Backup Procedure

Perform manual backups weekly as an additional safeguard.

#### Weekly Manual Backup (Every Monday 9:00 AM)

1. **Log into Supabase Dashboard:**
   - Navigate to https://app.supabase.com
   - Select the production project

2. **Create Manual Backup:**
   ```bash
   # Option 1: Use Supabase CLI (recommended)
   supabase db dump --project-ref YOUR_PROJECT_REF > backup-$(date +%Y%m%d).sql

   # Option 2: Use pg_dump directly
   pg_dump "postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" \
     --no-owner --no-acl \
     --file=backup-$(date +%Y%m%d).sql
   ```

3. **Verify Backup:**
   ```bash
   # Check file size (should be > 100 KB for production database)
   ls -lh backup-$(date +%Y%m%d).sql

   # Check file contents (should show CREATE TABLE statements)
   head -n 50 backup-$(date +%Y%m%d).sql
   ```

4. **Store Backup:**
   - Save to secure location: `D:\Backups\StockManagement\Database\`
   - Upload to cloud storage (Google Drive / OneDrive)
   - Encrypt sensitive backups using 7-Zip or GPG

#### Monthly Manual Backup (First Monday of each month)

Perform the same procedure as weekly backups but with extended retention:

- **File naming:** `backup-monthly-YYYYMM.sql`
- **Retention:** Keep for 12 months
- **Additional step:** Tag the backup in cloud storage as "Monthly Backup"

---

## Vercel Deployment Backups

### Git Repository Backups

All application code is automatically backed up in GitHub:

- **Repository:** https://github.com/YOUR_ORG/stock-management-system
- **Branches:** `main` (production), `develop` (staging)
- **Backup frequency:** On every commit (automatic)
- **Retention:** Unlimited

**No manual action required** - GitHub handles this automatically.

### Deployment History

Vercel maintains deployment history:

- **Access:** Vercel Dashboard → Deployments
- **Retention:** Last 100 deployments (Free tier) / Unlimited (Pro tier)
- **Rollback:** Available via Vercel dashboard or CLI

### Environment Variables Backup

**CRITICAL:** Environment variables are NOT backed up automatically.

#### Monthly Environment Variables Backup (First Monday of each month)

1. **Export from Vercel:**
   ```bash
   # Using Vercel CLI
   vercel env pull .env.production.backup
   ```

2. **Manual export alternative:**
   - Log into Vercel Dashboard
   - Navigate to Settings → Environment Variables
   - Copy all variables to a secure text file
   - Save as `env-backup-YYYYMMDD.txt`

3. **Secure storage:**
   - Encrypt the file using 7-Zip with AES-256 encryption
   - Store in password manager or secure vault
   - **NEVER commit to Git**

---

## Configuration Backups

### Prisma Schema Backup

Prisma schema is automatically backed up in Git repository:

- **File:** `prisma/schema.prisma`
- **Backup:** On every commit to `main` branch
- **Restoration:** Git checkout or pull from GitHub

### Nuxt Configuration Backup

All configuration files are in Git:

- `nuxt.config.ts`
- `app.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `.prettierrc`

**No manual backup required.**

---

## Backup Verification

### Weekly Verification Checklist

Perform these checks every Monday after manual backup:

- [ ] Supabase dashboard shows latest automatic backup (within last 24 hours)
- [ ] Manual backup file created successfully
- [ ] Manual backup file size is reasonable (> 100 KB)
- [ ] Manual backup file contains valid SQL (spot check with text editor)
- [ ] Backup uploaded to cloud storage successfully
- [ ] GitHub shows recent commits (within last 7 days)
- [ ] Vercel shows recent deployments (within last 7 days)

### Monthly Verification Checklist

Perform these checks on the first Monday of each month:

- [ ] All weekly backups from previous month are stored
- [ ] Monthly backup created and tagged
- [ ] Environment variables exported and encrypted
- [ ] Backup retention policy enforced (delete backups older than retention period)
- [ ] Test restore procedure (see below)

---

## Restoration Procedures

### Database Restoration

#### Restore from Supabase Automatic Backup

1. **Log into Supabase Dashboard:**
   - Navigate to Database → Backups
   - Select the backup to restore (e.g., yesterday's backup)

2. **Restore via Dashboard:**
   - Click "Restore" button
   - Confirm restoration (WARNING: This will overwrite current database)
   - Wait for restoration to complete (5-10 minutes)

3. **Verify restoration:**
   - Check row counts in critical tables
   - Verify latest transactions are present
   - Test application functionality

#### Restore from Manual Backup

1. **Prepare restore:**
   ```bash
   # Download backup file from cloud storage
   # Decrypt if encrypted
   ```

2. **Restore database:**
   ```bash
   # Using psql
   psql "postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" \
     < backup-20250127.sql

   # Or using Supabase CLI
   supabase db push --file backup-20250127.sql
   ```

3. **Verify restoration:**
   - Check row counts: `SELECT COUNT(*) FROM "User";`
   - Check latest data: `SELECT * FROM "Delivery" ORDER BY created_at DESC LIMIT 10;`
   - Test application login and basic operations

### Code Restoration (Rollback)

#### Rollback Vercel Deployment

1. **Via Vercel Dashboard:**
   - Navigate to Deployments
   - Find the last known good deployment
   - Click "..." menu → "Promote to Production"

2. **Via Vercel CLI:**
   ```bash
   # List recent deployments
   vercel ls

   # Promote specific deployment
   vercel promote DEPLOYMENT_URL
   ```

#### Rollback Git Repository

```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit (DANGER: Destructive)
git reset --hard COMMIT_HASH
git push --force
```

### Environment Variables Restoration

1. **Decrypt backup file:**
   ```bash
   # Using 7-Zip or GPG
   ```

2. **Import to Vercel:**
   ```bash
   # Using Vercel CLI
   vercel env add VARIABLE_NAME production < value.txt
   ```

3. **Verify import:**
   - Check Vercel Dashboard → Settings → Environment Variables
   - Redeploy application to apply new variables

---

## Recovery Time Objectives

| Recovery Scenario | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|-------------------|------------------------------|-------------------------------|
| Database restore (automatic backup) | 30 minutes | 24 hours |
| Database restore (manual backup) | 1 hour | 7 days |
| Code rollback | 10 minutes | Last deployment (minutes) |
| Full system recovery | 2 hours | 24 hours |
| Environment variable recovery | 30 minutes | 30 days |

**Definitions:**
- **RTO:** Maximum acceptable time to restore service
- **RPO:** Maximum acceptable data loss (how old can the backup be)

---

## Backup Testing Schedule

### Quarterly Backup Restore Test

**Schedule:** Last Friday of March, June, September, December

**Procedure:**

1. **Test database restore** on a staging environment:
   - Restore from manual backup
   - Verify data integrity
   - Test application functionality

2. **Test code rollback:**
   - Perform rollback on staging
   - Verify application loads correctly
   - Test critical workflows

3. **Test environment variable restore:**
   - Export and re-import variables on staging
   - Verify application starts with restored variables

4. **Document results:**
   - Record any issues encountered
   - Update procedures if needed
   - Report to management

---

## Roles and Responsibilities

### System Administrator

- **Responsibilities:**
  - Perform weekly manual backups
  - Perform monthly manual backups
  - Verify backup completion weekly
  - Test backup restoration quarterly
  - Maintain backup documentation

- **Backup Access:**
  - Supabase dashboard (admin access)
  - Vercel dashboard (owner access)
  - Cloud storage (admin access)
  - GitHub repository (admin access)

### Database Administrator (if separate from System Admin)

- **Responsibilities:**
  - Monitor Supabase automatic backups
  - Perform point-in-time recovery if needed (Pro tier)
  - Optimize database before backups
  - Verify backup integrity

### Development Team Lead

- **Responsibilities:**
  - Maintain Git repository backups (automatic via GitHub)
  - Tag releases for easy rollback
  - Document breaking changes
  - Coordinate with admin for environment variable updates

---

## Emergency Contacts

**System Administrator:**
Name: [TO BE FILLED]
Email: [TO BE FILLED]
Phone: [TO BE FILLED]

**Supabase Support:**
Email: support@supabase.com
Dashboard: https://app.supabase.com/support

**Vercel Support:**
Email: support@vercel.com
Dashboard: https://vercel.com/support

---

## Appendix: Backup Script Examples

### Automated Weekly Backup Script

```bash
#!/bin/bash
# weekly-backup.sh
# Run this script every Monday at 9:00 AM

DATE=$(date +%Y%m%d)
BACKUP_DIR="D:/Backups/StockManagement/Database"
BACKUP_FILE="$BACKUP_DIR/backup-$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup: $BACKUP_FILE"
pg_dump "postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl \
  --file="$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(stat -c%s "$BACKUP_FILE")
  if [ $SIZE -gt 100000 ]; then
    echo "Backup successful: $SIZE bytes"

    # Upload to cloud storage (Google Drive example using rclone)
    # rclone copy "$BACKUP_FILE" gdrive:Backups/StockManagement/

    echo "Backup completed successfully"
  else
    echo "ERROR: Backup file is too small: $SIZE bytes"
    exit 1
  fi
else
  echo "ERROR: Backup file not created"
  exit 1
fi

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "backup-*.sql" -mtime +30 -delete
echo "Old backups cleaned up"
```

### Automated Environment Variables Backup

```bash
#!/bin/bash
# backup-env.sh
# Run this script on the first Monday of each month

DATE=$(date +%Y%m%d)
BACKUP_DIR="D:/Backups/StockManagement/EnvVars"
BACKUP_FILE="$BACKUP_DIR/env-backup-$DATE.txt"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Export from Vercel
echo "Exporting environment variables from Vercel..."
vercel env pull "$BACKUP_FILE"

# Encrypt the backup
echo "Encrypting backup..."
7z a -p -mhe=on "$BACKUP_FILE.7z" "$BACKUP_FILE"

# Delete unencrypted file
rm "$BACKUP_FILE"

echo "Environment variables backed up and encrypted: $BACKUP_FILE.7z"
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-27 | System Administrator | Initial documentation |

---

**END OF DOCUMENT**
