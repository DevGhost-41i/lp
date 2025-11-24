# Process Publisher Queue Function

Processes the publisher data queue for bulk uploaded publishers, triggering historical GAM data fetch.

## Features

- Fetches oldest pending item from queue
- Marks items as processing → completed/failed
- Calls existing `new-pub-report-and-audit` function
- Automatic retry logic (up to 3 attempts)
- Updates publisher `data_fetch_status`

## Invocation

### Manual Trigger
```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-publisher-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Scheduled (Cron)
Add to your Supabase project dashboard:
```
Schedule: */5 * * * *  # Every 5 minutes
Function: process-publisher-queue
```

### From Code
```typescript
await supabase.functions.invoke('process-publisher-queue')
```

## Environment Variables

Automatically available:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Queue Processing Flow

1. Fetch oldest `pending` item from `publisher_data_queue`
2. Update status to `processing`
3. Call `new-pub-report-and-audit` with publisher ID
4. On success: Mark as `completed`
5. On failure: Increment retry count, mark as `failed` after 3 attempts

## Error Handling

- Retries up to 3 times before marking as failed
- Logs all errors for debugging
- Returns detailed error messages
- Updates publisher status appropriately
