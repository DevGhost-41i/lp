# Worker Debug Instructions

## What We Found

The database shows:
- ✅ `risk_score`: 0.00 (exists, very small)
- ❌ `mfa_probability`: NULL
- ❌ `risk_level`: NULL  
- ✅ `ai_report`: exists

The worker code SHOULD be saving these values, but they're coming through as NULL.

## Debug Changes Made

Added logging to `worker-runner.js` (lines 235-295) to show:
1. What the scorer actually outputs
2. What gets extracted from scorerData
3. What gets saved to database

## Next Steps

### 1. Restart Worker
```bash
# In worker directory
docker-compose restart worker
# OR if running locally
pm2 restart worker
```

### 2. Trigger New Audit
- Go to MFA Buster page
- Click "Audit All" button
- Wait for completion

### 3. Check Worker Logs
```bash
# View logs
docker logs -f <worker_container> --tail 100
# OR
pm2 logs worker
```

**Look for lines like:**
```
[DEBUG] Scorer Data Structure: {
  hasRiskScore: true/false,
  hasMfaProbability: true/false,
  hasExplanation: true/false,
  riskScoreValue: 0.00857,
  mfaProbability Value: 0.00224,
  riskLevelValue: 'LOW'
}

[DEBUG] Saving to database: {
  risk_score: 0.00857,
  mfa_probability: 0.00224,
  risk_level: 'LOW'
}
```

### 4. Share Results
Copy the debug output and share it. This will tell us:

**If values are TRUE/present:**
→ Worker is outputting correctly, database save is the issue

**If values are FALSE/undefined:**
→ Scorer isn't outputting correctly, need to fix scorer

## Solution Options

### Option A: Scorer Not Outputting
If debug shows `hasMfaProbability: false`:
- Fix scorer to properly output these values
- Check risk-engine.js line 265 and 282

### Option B: Database Save Issue  
If debug shows values present but database has NULL:
- Check Supabase column types
- Check for RLS policy blocking writes
- Check if supabase.update() is failing silently

## Expected Fix Timeline

Once we know which scenario, fix should take 5-10 minutes.
