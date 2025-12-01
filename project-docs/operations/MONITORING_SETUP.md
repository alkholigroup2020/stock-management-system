# Monitoring Setup

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Owner:** System Administrator

---

## Table of Contents

1. [Overview](#overview)
2. [Monitoring Architecture](#monitoring-architecture)
3. [Vercel Monitoring](#vercel-monitoring)
4. [Supabase Monitoring](#supabase-monitoring)
5. [Application Performance Monitoring](#application-performance-monitoring)
6. [Database Monitoring](#database-monitoring)
7. [Uptime Monitoring](#uptime-monitoring)
8. [Alert Configuration](#alert-configuration)
9. [Dashboard Setup](#dashboard-setup)
10. [Monitoring Metrics Reference](#monitoring-metrics-reference)

---

## Overview

This document outlines the monitoring setup for the Stock Management System. The monitoring stack ensures system health, performance, and uptime through multiple layers of observability.

### Monitoring Objectives

- **Uptime:** Ensure 99.5% availability (target)
- **Performance:** Detect slow API responses (> 1s)
- **Errors:** Identify and alert on application errors
- **Database:** Monitor query performance and connection health
- **User Experience:** Track page load times and user errors

### Monitoring Stack

| Component           | Tool                                | Purpose                                 |
| ------------------- | ----------------------------------- | --------------------------------------- |
| Application Hosting | Vercel Analytics                    | Page views, performance, Web Vitals     |
| Database            | Supabase Dashboard                  | Query performance, connections, storage |
| Uptime              | UptimeRobot (or Vercel Monitoring)  | HTTP endpoint checks                    |
| Error Tracking      | Built-in logging (optional: Sentry) | JavaScript errors, API errors           |
| Performance         | Built-in middleware                 | API response times, slow queries        |

---

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Monitoring Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Vercel     │  │   Supabase   │  │  UptimeRobot │      │
│  │  Analytics   │  │   Dashboard  │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│                    ┌───────▼────────┐                         │
│                    │  Alert System  │                         │
│                    │  (Email/SMS)   │                         │
│                    └────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Vercel Monitoring

### Vercel Analytics Setup

Vercel Analytics is already enabled for the project and provides:

- **Page views:** Track user navigation
- **Web Vitals:** Core Web Vitals (CWV) metrics
- **Real User Monitoring:** Actual user performance data
- **Top pages:** Most visited pages
- **Referrers:** Traffic sources

#### Access Vercel Analytics

1. Log into Vercel Dashboard: https://vercel.com
2. Select "stock-management-system" project
3. Navigate to "Analytics" tab
4. View real-time and historical data

#### Key Metrics to Monitor

| Metric                             | Target  | Description          |
| ---------------------------------- | ------- | -------------------- |
| **CLS** (Cumulative Layout Shift)  | < 0.1   | Visual stability     |
| **FID** (First Input Delay)        | < 100ms | Interactivity        |
| **LCP** (Largest Contentful Paint) | < 2.5s  | Load performance     |
| **FCP** (First Contentful Paint)   | < 1.8s  | Perceived load speed |
| **TTFB** (Time to First Byte)      | < 600ms | Server response time |

#### Weekly Analytics Review

**Schedule:** Every Monday 10:00 AM

**Checklist:**

- [ ] Review Web Vitals scores (all should be "Good")
- [ ] Check for any performance regressions (compare to previous week)
- [ ] Identify slowest pages (LCP > 3s)
- [ ] Review error rate (should be < 0.1%)
- [ ] Check mobile vs desktop performance

### Vercel Deployment Monitoring

Vercel automatically monitors deployment health:

- **Build status:** Success/failure for each deployment
- **Build time:** Duration of each build
- **Function execution:** Serverless function logs
- **Edge function logs:** API route execution logs

#### Access Deployment Logs

1. Navigate to Vercel Dashboard → Deployments
2. Select a deployment
3. View logs:
   - **Build Logs:** Build process output
   - **Function Logs:** Runtime logs for API routes
   - **Static Logs:** Static asset serving

---

## Supabase Monitoring

### Supabase Dashboard Monitoring

Supabase provides built-in monitoring for the PostgreSQL database:

#### Access Supabase Monitoring

1. Log into Supabase Dashboard: https://app.supabase.com
2. Select production project
3. Navigate to "Database" → "Monitor"

#### Key Database Metrics

| Metric                 | Target         | Alert Threshold                    |
| ---------------------- | -------------- | ---------------------------------- |
| **Active Connections** | < 20           | > 50 (warning), > 80 (critical)    |
| **Database Size**      | Monitor growth | > 8GB (Free tier limit)            |
| **Query Performance**  | < 100ms avg    | > 500ms (warning), > 1s (critical) |
| **Connection Pool**    | < 80% usage    | > 90% (warning)                    |
| **Disk I/O**           | Monitor trends | Sudden spikes                      |

#### Weekly Database Review

**Schedule:** Every Monday 10:30 AM

**Checklist:**

- [ ] Check database size and growth rate
- [ ] Review slow queries (> 500ms)
- [ ] Check connection pool usage
- [ ] Verify backup status (last backup < 24h)
- [ ] Review table row counts for unexpected growth

### Supabase Logs

Access database logs for troubleshooting:

1. Navigate to Supabase Dashboard → Logs
2. Filter by:
   - **Postgres Logs:** Database queries and errors
   - **API Logs:** PostgREST API requests
   - **Auth Logs:** Authentication events

#### Log Retention

- **Free Tier:** 1 day of logs
- **Pro Tier:** 7 days of logs
- **Enterprise:** Custom retention

---

## Application Performance Monitoring

### Built-in Performance Middleware

The application includes custom performance monitoring middleware at `server/middleware/performance.ts`.

#### Features

- **Request duration:** Time each API request
- **Slow request logging:** Log requests > 1s
- **Performance metrics API:** View aggregated stats at `/api/metrics/performance`
- **Last 100 requests:** Track recent request performance

#### Access Performance Metrics

**API Endpoint:** `GET /api/metrics/performance`

**Authentication:** Admin role required

**Response:**

```json
{
  "summary": {
    "totalRequests": 1234,
    "slowRequests": 5,
    "averageDuration": 145.6,
    "maxDuration": 987.3,
    "minDuration": 12.5
  },
  "byEndpoint": {
    "/api/locations/1/deliveries": {
      "count": 45,
      "avgDuration": 234.5,
      "maxDuration": 567.8,
      "slowCount": 2
    }
  }
}
```

#### Daily Performance Check

**Schedule:** Every day 8:00 AM

```bash
# Fetch performance metrics
curl https://stock-management.vercel.app/api/metrics/performance \
  -H "Cookie: auth-token=YOUR_ADMIN_TOKEN"

# Check for slow requests (> 1s)
# If slowRequests > 10, investigate
```

### Performance Alerts

Configure alerts for performance degradation:

**Alert Rules:**

1. **Slow API Requests:** > 10 slow requests per hour
2. **Average Response Time:** > 500ms over 5-minute window
3. **Error Rate:** > 5% of requests failing

---

## Database Monitoring

### Query Performance Monitoring

Monitor database query performance using Supabase dashboard:

#### Slow Query Identification

1. Navigate to Supabase Dashboard → Database → Query Performance
2. Review queries by:
   - **Execution time:** Queries taking > 500ms
   - **Execution count:** Most frequent queries
   - **Total time:** Queries consuming most database time

#### Common Slow Queries

Monitor these common operations:

| Query Type                   | Expected Time | Alert Threshold |
| ---------------------------- | ------------- | --------------- |
| Single location stock query  | < 50ms        | > 200ms         |
| Delivery posting (5 lines)   | < 200ms       | > 1s            |
| Transfer approval            | < 150ms       | > 500ms         |
| Period close (all locations) | < 5s          | > 10s           |
| Dashboard data fetch         | < 300ms       | > 1s            |

### Database Connection Monitoring

Monitor connection pool health:

**Indicators of Connection Issues:**

- High number of idle connections (> 20)
- Connection pool exhaustion errors
- "Too many connections" errors
- Long-running transactions (> 30s)

**Resolution:**

- Review Prisma client connection settings
- Check for connection leaks in code
- Upgrade to Supabase Pro for more connections

---

## Uptime Monitoring

### UptimeRobot Setup (Recommended)

**Service:** https://uptimerobot.com (Free tier available)

#### Configuration

1. **Create account** at UptimeRobot
2. **Add monitor:**
   - **Monitor Type:** HTTPS
   - **URL:** https://stock-management.vercel.app/api/health
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** Admin email, SMS (optional)

3. **Create health check endpoint** (if not exists):

```typescript
// server/api/health.get.ts
export default defineEventHandler(async (event) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    };
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: "Service Unavailable",
      data: { database: "disconnected" },
    });
  }
});
```

#### Alternative: Vercel Monitoring

Vercel Pro plan includes uptime monitoring:

- Navigate to Vercel Dashboard → Monitoring
- Enable uptime checks
- Configure alert notifications

---

## Alert Configuration

### Email Alerts

Configure email alerts for critical events:

#### Supabase Alerts

1. Navigate to Supabase Dashboard → Settings → Alerts
2. Configure alerts for:
   - Database downtime
   - High connection count
   - Storage usage > 80%
   - Backup failures

**Alert Recipient:** admin@yourdomain.com

#### Vercel Alerts

1. Navigate to Vercel Dashboard → Settings → Notifications
2. Enable alerts for:
   - Deployment failures
   - Build errors
   - Function errors (> 10 per hour)

**Alert Recipient:** dev-team@yourdomain.com

#### UptimeRobot Alerts

Configure multi-channel alerts:

- **Email:** admin@yourdomain.com
- **SMS:** +966-XXX-XXXX (optional, paid feature)
- **Webhook:** Slack/Teams integration (optional)

### Alert Priority Levels

| Priority     | Response Time     | Escalation                     |
| ------------ | ----------------- | ------------------------------ |
| **Critical** | 15 minutes        | Page on-call admin immediately |
| **High**     | 1 hour            | Email + SMS to admin           |
| **Medium**   | 4 hours           | Email to admin                 |
| **Low**      | Next business day | Email to dev team              |

**Critical Alerts:**

- Application down (uptime check fails)
- Database unavailable
- Data loss detected

**High Alerts:**

- Slow API responses (> 2s)
- High error rate (> 5%)
- Backup failure

**Medium Alerts:**

- Degraded performance (> 1s response time)
- Storage usage > 80%
- Slow queries detected

**Low Alerts:**

- Code quality issues
- Minor performance regression
- Non-critical warnings

---

## Dashboard Setup

### Monitoring Dashboard Checklist

Create a centralized monitoring dashboard (optional, can use existing tools):

**Option 1: Bookmark Collection**

Create browser bookmarks for quick access:

- Vercel Analytics: https://vercel.com/YOUR_TEAM/stock-management-system/analytics
- Supabase Dashboard: https://app.supabase.com/project/YOUR_PROJECT_ID
- UptimeRobot Dashboard: https://uptimerobot.com/dashboard
- Performance Metrics: https://stock-management.vercel.app/api/metrics/performance

**Option 2: Custom Dashboard (Advanced)**

Build a custom monitoring dashboard page in the application:

```vue
<!-- pages/admin/monitoring.vue -->
<template>
  <div class="p-4 md:p-6">
    <LayoutPageHeader
      title="System Monitoring"
      description="Real-time system health and performance metrics"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <!-- Uptime Status -->
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold" :class="uptimeColor">{{ uptime }}%</div>
          <div class="text-sm text-muted mt-1">Uptime (30 days)</div>
        </div>
      </UCard>

      <!-- Average Response Time -->
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold">{{ avgResponseTime }}ms</div>
          <div class="text-sm text-muted mt-1">Avg Response Time</div>
        </div>
      </UCard>

      <!-- Active Users -->
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold">{{ activeUsers }}</div>
          <div class="text-sm text-muted mt-1">Active Users</div>
        </div>
      </UCard>

      <!-- Database Size -->
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold">{{ dbSize }} MB</div>
          <div class="text-sm text-muted mt-1">Database Size</div>
        </div>
      </UCard>
    </div>
  </div>
</template>
```

---

## Monitoring Metrics Reference

### Application Metrics

| Metric            | Source                 | Target  | How to Access                |
| ----------------- | ---------------------- | ------- | ---------------------------- |
| Page Load Time    | Vercel Analytics       | < 3s    | Vercel Dashboard → Analytics |
| API Response Time | Performance Middleware | < 1s    | `/api/metrics/performance`   |
| Error Rate        | Vercel Functions       | < 0.1%  | Vercel Dashboard → Functions |
| Uptime            | UptimeRobot            | > 99.5% | UptimeRobot Dashboard        |

### Database Metrics

| Metric             | Source   | Target      | How to Access                 |
| ------------------ | -------- | ----------- | ----------------------------- |
| Query Performance  | Supabase | < 100ms avg | Supabase Dashboard → Database |
| Active Connections | Supabase | < 20        | Supabase Dashboard → Database |
| Database Size      | Supabase | Monitor     | Supabase Dashboard → Database |
| Backup Status      | Supabase | Daily       | Supabase Dashboard → Backups  |

### Infrastructure Metrics

| Metric          | Source   | Target    | How to Access                  |
| --------------- | -------- | --------- | ------------------------------ |
| Build Time      | Vercel   | < 2 min   | Vercel Dashboard → Deployments |
| Function Errors | Vercel   | < 10/hour | Vercel Dashboard → Functions   |
| Bandwidth Usage | Vercel   | Monitor   | Vercel Dashboard → Usage       |
| Storage Usage   | Supabase | < 8 GB    | Supabase Dashboard → Settings  |

---

## Monitoring Checklist

### Daily Monitoring Tasks

**Schedule:** Every day 8:00 AM

- [ ] Check uptime status (UptimeRobot dashboard)
- [ ] Review Vercel function errors (should be 0)
- [ ] Check performance metrics API for slow requests
- [ ] Scan Supabase logs for database errors

### Weekly Monitoring Tasks

**Schedule:** Every Monday 10:00 AM

- [ ] Review Vercel Analytics (Web Vitals, performance trends)
- [ ] Check Supabase database health (connections, size, queries)
- [ ] Review alert history (any alerts triggered?)
- [ ] Verify backup completion (database backups present)
- [ ] Check for deployment failures

### Monthly Monitoring Tasks

**Schedule:** First Monday of each month

- [ ] Generate monthly uptime report
- [ ] Review bandwidth and storage usage trends
- [ ] Analyze slow query trends
- [ ] Review alert configuration (any new alerts needed?)
- [ ] Update monitoring documentation if processes change

---

## Troubleshooting Common Issues

### High Response Times

**Symptoms:**

- API requests > 1s
- Performance metrics show degradation
- Users report slow page loads

**Diagnosis:**

1. Check `/api/metrics/performance` for slow endpoints
2. Review Supabase query performance
3. Check Vercel function logs for errors

**Resolution:**

- Optimize slow database queries
- Add database indexes if needed
- Enable caching for frequently accessed data
- Scale up database (Supabase Pro) if needed

### Database Connection Errors

**Symptoms:**

- "Too many connections" errors
- High active connection count
- Connection pool exhausted

**Diagnosis:**

1. Check Supabase Dashboard → Database → Connections
2. Review Prisma connection pool settings
3. Check for connection leaks in code

**Resolution:**

- Close unused connections
- Review Prisma client instantiation
- Upgrade to Supabase Pro for more connections
- Implement connection pooling with PgBouncer

### Application Downtime

**Symptoms:**

- Uptime check fails
- Users cannot access application
- 500 errors on all pages

**Diagnosis:**

1. Check Vercel deployment status
2. Check Supabase database status
3. Review Vercel function logs

**Resolution:**

- Rollback to last known good deployment
- Check environment variables
- Restart database (Supabase support)
- Follow incident response plan (see INCIDENT_RESPONSE_PLAN.md)

---

## Emergency Contacts

**System Administrator:**
Name: [TO BE FILLED]
Email: [TO BE FILLED]
Phone: [TO BE FILLED]

**Vercel Support:**
Email: support@vercel.com
Dashboard: https://vercel.com/support

**Supabase Support:**
Email: support@supabase.com
Dashboard: https://app.supabase.com/support

---

## Document History

| Version | Date       | Author               | Changes               |
| ------- | ---------- | -------------------- | --------------------- |
| 1.0     | 2025-11-27 | System Administrator | Initial documentation |

---

**END OF DOCUMENT**
