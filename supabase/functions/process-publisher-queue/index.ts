import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueueItem {
    id: string
    publisher_id: string
    status: string
    fetch_type: string
    retry_count: number
    created_at: string
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('🔄 Processing publisher data queue...')

        // Get next pending item from queue
        const { data: queueItem, error: queueError } = await supabase
            .from('publisher_data_queue')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        if (queueError) {
            if (queueError.code === 'PGRST116') {
                console.log('✅ No pending items in queue')
                return new Response(
                    JSON.stringify({ message: 'No pending items' }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200
                    }
                )
            }
            throw queueError
        }

        const item = queueItem as QueueItem
        console.log(`📋 Processing queue item ${item.id} for publisher ${item.publisher_id}`)

        // Mark as processing
        const { error: updateError } = await supabase
            .from('publisher_data_queue')
            .update({
                status: 'processing',
                started_at: new Date().toISOString()
            })
            .eq('id', item.id)

        if (updateError) throw updateError

        // Update publisher status
        await supabase
            .from('publishers')
            .update({ data_fetch_status: 'fetching' })
            .eq('id', item.publisher_id)

        try {
            console.log(`🎯 Triggering complete publisher setup for ${item.publisher_id}`)

            // Call new-pub-report-and-audit which does BOTH:
            // 1. Fetches 2 months historical GAM data
            // 2. Triggers site monitoring worker for MFA audit
            // This ensures MFA scores are available for approval decisions
            const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/new-pub-report-and-audit`
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    publisherId: item.publisher_id,
                    fetchHistorical: true,
                    historicalMonths: 2
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Publisher setup failed: ${errorText}`)
            }

            console.log(`✅ Complete publisher setup finished for ${item.publisher_id} (GAM data + MFA score)`)

            // Mark as completed
            await supabase
                .from('publisher_data_queue')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', item.id)

            await supabase
                .from('publishers')
                .update({ data_fetch_status: 'completed' })
                .eq('id', item.publisher_id)

            return new Response(
                JSON.stringify({
                    success: true,
                    message: `Processed publisher ${item.publisher_id} - GAM data + MFA score complete`,
                    queueItemId: item.id
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                }
            )

        } catch (fetchError: any) {
            console.error(`❌ Error processing publisher ${item.publisher_id}:`, fetchError)

            // Get current retry count
            const retryCount = item.retry_count + 1
            const maxRetries = 3
            const finalStatus = retryCount >= maxRetries ? 'failed' : 'pending'

            // Mark as failed or retry
            await supabase
                .from('publisher_data_queue')
                .update({
                    status: finalStatus,
                    retry_count: retryCount,
                    error_message: fetchError.message,
                    completed_at: finalStatus === 'failed' ? new Date().toISOString() : null
                })
                .eq('id', item.id)

            // Update publisher status if permanently failed
            if (finalStatus === 'failed') {
                await supabase
                    .from('publishers')
                    .update({ data_fetch_status: 'failed' })
                    .eq('id', item.publisher_id)
            }

            return new Response(
                JSON.stringify({
                    success: false,
                    message: `Failed to process publisher ${item.publisher_id}`,
                    error: fetchError.message,
                    retryCount,
                    willRetry: finalStatus === 'pending'
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 500
                }
            )
        }

    } catch (error: any) {
        console.error('❌ Queue processor error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
