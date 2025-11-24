import { supabase } from './supabase';

export interface QueueItem {
    id: string;
    publisher_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    fetch_type: string;
    retry_count: number;
    error_message: string | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
}

export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
}

class HistoricalDataQueueService {
    /**
     * Add publisher to historical data fetch queue
     */
    async queuePublisher(publisherId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('publisher_data_queue')
                .insert({
                    publisher_id: publisherId,
                    fetch_type: 'historical_2_months',
                    status: 'pending'
                });

            if (error) {
                // Ignore duplicate key errors (publisher already queued)
                if (error.code === '23505') {
                    return { success: true };
                }
                throw error;
            }

            return { success: true };
        } catch (error: any) {
            console.error('Failed to queue publisher:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add multiple publishers to queue
     */
    async queuePublishers(publisherIds: string[]): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const publisherId of publisherIds) {
            const result = await this.queuePublisher(publisherId);
            if (result.success) {
                success++;
            } else {
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * Get overall queue status
     */
    async getQueueStatus(): Promise<QueueStatus> {
        try {
            const { data, error } = await supabase
                .from('publisher_data_queue')
                .select('status');

            if (error) throw error;

            const status: QueueStatus = {
                pending: 0,
                processing: 0,
                completed: 0,
                failed: 0,
                total: data?.length || 0
            };

            data?.forEach((item: { status: string }) => {
                status[item.status as keyof Omit<QueueStatus, 'total'>]++;
            });

            return status;
        } catch (error) {
            console.error('Failed to get queue status:', error);
            return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
        }
    }

    /**
     * Get queue status for a specific publisher
     */
    async getPublisherQueueStatus(publisherId: string): Promise<QueueItem | null> {
        try {
            const { data, error } = await supabase
                .from('publisher_data_queue')
                .select('*')
                .eq('publisher_id', publisherId)
                .eq('fetch_type', 'historical_2_months')
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return data as QueueItem;
        } catch (error) {
            console.error('Failed to get publisher queue status:', error);
            return null;
        }
    }

    /**
     * Get next pending item from queue
     */
    async getNextPendingItem(): Promise<QueueItem | null> {
        try {
            const { data, error } = await supabase
                .from('publisher_data_queue')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No pending items
                throw error;
            }

            return data as QueueItem;
        } catch (error) {
            console.error('Failed to get next pending item:', error);
            return null;
        }
    }

    /**
     * Mark queue item as processing
     */
    async markAsProcessing(queueId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('publisher_data_queue')
                .update({
                    status: 'processing',
                    started_at: new Date().toISOString()
                })
                .eq('id', queueId);

            return !error;
        } catch (error) {
            console.error('Failed to mark as processing:', error);
            return false;
        }
    }

    /**
     * Mark queue item as completed
     */
    async markAsCompleted(queueId: string, publisherId: string): Promise<boolean> {
        try {
            // Update queue item
            const { error: queueError } = await supabase
                .from('publisher_data_queue')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', queueId);

            if (queueError) throw queueError;

            // Update publisher status
            const { error: publisherError } = await supabase
                .from('publishers')
                .update({ data_fetch_status: 'completed' })
                .eq('id', publisherId);

            if (publisherError) throw publisherError;

            return true;
        } catch (error) {
            console.error('Failed to mark as completed:', error);
            return false;
        }
    }

    /**
     * Mark queue item as failed
     */
    async markAsFailed(queueId: string, publisherId: string, errorMessage: string): Promise<boolean> {
        try {
            const { data: currentItem } = await supabase
                .from('publisher_data_queue')
                .select('retry_count')
                .eq('id', queueId)
                .single();

            const retryCount = (currentItem?.retry_count || 0) + 1;
            const maxRetries = 3;
            const finalStatus = retryCount >= maxRetries ? 'failed' : 'pending';

            // Update queue item
            const { error: queueError } = await supabase
                .from('publisher_data_queue')
                .update({
                    status: finalStatus,
                    retry_count: retryCount,
                    error_message: errorMessage,
                    completed_at: finalStatus === 'failed' ? new Date().toISOString() : null
                })
                .eq('id', queueId);

            if (queueError) throw queueError;

            // Update publisher status if permanently failed
            if (finalStatus === 'failed') {
                const { error: publisherError } = await supabase
                    .from('publishers')
                    .update({ data_fetch_status: 'failed' })
                    .eq('id', publisherId);

                if (publisherError) throw publisherError;
            }

            return true;
        } catch (error) {
            console.error('Failed to mark as failed:', error);
            return false;
        }
    }

    /**
     * Retry a failed queue item
     */
    async retryFailedItem(publisherId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('publisher_data_queue')
                .update({
                    status: 'pending',
                    error_message: null,
                    started_at: null,
                    completed_at: null
                })
                .eq('publisher_id', publisherId)
                .eq('status', 'failed');

            return !error;
        } catch (error) {
            console.error('Failed to retry item:', error);
            return false;
        }
    }
}

export const historicalDataQueueService = new HistoricalDataQueueService();
