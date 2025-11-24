# MFA Site Monitoring Platform - Production Deployment

## Overview
Enterprise-grade MFA (Made For Advertising) site monitoring and compliance platform with automated auditing, real-time alerts, and comprehensive analytics.

## Prerequisites

- **Node.js**: v18+ (Latest LTS recommended)
- **Supabase**: Project with database access
- **Environment**: Production server with sufficient memory (minimum 2GB RAM recommended)

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Worker Configuration
WORKER_SECRET=your_worker_secret_key
PORT=3000

# AI Configuration (Optional - for enhanced analysis)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=alibaba/tongyi-deepresearch-30b-a3b:free
AI_REQUEST_DELAY_MS=5000

# Security
NODE_ENV=production

# Optional: Rate Limiting
AI_RATE_LIMIT_RPM=10
AI_RATE_LIMIT_CONCURRENT=1
```

### 3. Apply Database Migrations

Apply the consolidated schema migration:

**Via Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251123_consolidated_schema_fix.sql`
4. Paste and run the migration

**Via Supabase CLI:**
```bash
npx supabase db push
```

### 4. Build Frontend
```bash
npm run build
```

### 5. Start Services

**Production Mode:**
```bash
# Start frontend (via static server or hosting platform)
npm run preview

# Start monitoring worker (in separate terminal/process)
cd site-monitoring-worker
node scripts/worker-runner.js

# Start GAM report worker (in separate terminal/process)
cd gam-report-worker
node index.js
```

## Architecture

### Components

1. **Frontend Dashboard** (`src/`)
   - React + TypeScript
   - TailwindCSS + DaisyUI
   - Real-time publisher monitoring
   - Analytics and reporting

2. **Site Monitoring Worker** (`site-monitoring-worker/`)
   - Automated site auditing
   - Content analysis
   - Ad behavior detection
   - Policy compliance checking
   - Technical health checks
   - AI-powered insights

3. **GAM Report Worker** (`gam-report-worker/`)
   - Google Ad Manager data fetching
   - Automated report generation
   - Revenue and performance metrics

### Database Tables

The system uses **Supabase Postgres** with the following key tables:
- `publishers` - Publisher management
- `site_audits` - Audit results and history
- `audit_queue` - Job queue for audits
- `policy_compliance_results` - Compliance data
- `mfa_risk_scores` - MFA detection scores
- `technical_check_results` - Technical health data
- `content_analysis_results` - Content quality metrics
- And many more... (see migrations for complete schema)

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Frontend built (`npm run build`)
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Backup strategy in place

### Security
- [ ] `WORKER_SECRET` is strong and unique
- [ ] Service keys are not exposed in frontend code
- [ ] Rate limiting configured
- [ ] CORS policies reviewed
- [ ] Row Level Security (RLS) policies enabled in Supabase

### Monitoring
- [ ] Error logging configured
- [ ] Health check endpoints tested
- [ ] Alert email configuration verified
- [ ] Database performance monitoring enabled

### Performance
- [ ] Frontend assets optimized
- [ ] CDN configured (if applicable)
- [ ] Database indexes reviewed
- [ ] Worker concurrency limits set appropriately

## Monitoring & Maintenance

### Health Checks

**Worker Health:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "activeJobs": 0,
  "maxConcurrent": 5,
  "timestamp": "2025-11-24T00:00:00.000Z"
}
```

### Logs

Worker logs are output to stdout. In production, use a process manager like PM2 or systemd to capture logs:

```bash
# Using PM2
pm2 logs worker

# Using systemd
journalctl -u site-monitoring-worker -f
```

### Database Maintenance

Run periodic maintenance:
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Analyze tables for query optimization
ANALYZE;
```

## Scaling Recommendations

### Horizontal Scaling
- Deploy multiple worker instances
- Use load balancer for frontend
- Configure worker load distribution

### Database Optimization
- Enable connection pooling (Supabase Pooler)
- Review and optimize slow queries
- Consider read replicas for heavy read workloads

### Caching
- Implement Redis for session caching
- Cache frequently accessed data
- Use CDN for static assets

## Troubleshooting

### Common Issues

**1. Worker not processing jobs:**
- Check `audit_queue` table for pending jobs
- Verify `WORKER_SECRET` matches between frontend and worker
- Check worker logs for errors

**2. Database connection errors:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Check Supabase project status
- Verify IP allowlist if configured

**3. AI rate limiting (429 errors):**
- Increase `AI_REQUEST_DELAY_MS` (default: 5000)
- Reduce `AI_RATE_LIMIT_RPM`
- Consider upgrading to paid AI tier

**4. Missing data in tables:**
- Ensure all migrations are applied
- Check for recent schema changes
- Verify worker is restarted after code changes

## Support & Documentation

For detailed module documentation, see:
- **Worker**: `site-monitoring-worker/README.md`
- **GAM Worker**: `gam-report-worker/README.md`

## License

Proprietary - All rights reserved
