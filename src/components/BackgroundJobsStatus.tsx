import { useEffect, useState } from 'react';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { historicalDataQueueService, QueueStatus } from '../lib/historicalDataQueueService';

interface BackgroundJobsStatusProps {
    onRefresh?: () => void;
}

export default function BackgroundJobsStatus({ onRefresh }: BackgroundJobsStatusProps) {
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
    });
    const [loading, setLoading] = useState(false);

    const fetchQueueStatus = async () => {
        setLoading(true);
        try {
            const status = await historicalDataQueueService.getQueueStatus();
            setQueueStatus(status);
        } catch (error) {
            console.error('Failed to fetch queue status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueueStatus();

        // Poll every 30 seconds
        const interval = setInterval(fetchQueueStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        fetchQueueStatus();
        onRefresh?.();
    };

    const activeJobs = queueStatus.pending + queueStatus.processing;

    // Don't show banner if no active jobs
    if (activeJobs === 0 && queueStatus.failed === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                        <div>
                            <h3 className="text-sm font-semibold text-white">Background Data Fetch in Progress</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Fetching 2-month historical GAM data for bulk uploaded publishers
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Counts */}
                    <div className="flex items-center gap-4 text-sm">
                        {queueStatus.pending > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <span className="text-gray-300">{queueStatus.pending} Pending</span>
                            </div>
                        )}

                        {queueStatus.processing > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-gray-300">{queueStatus.processing} Processing</span>
                            </div>
                        )}

                        {queueStatus.completed > 0 && (
                            <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-gray-300">{queueStatus.completed} Complete</span>
                            </div>
                        )}

                        {queueStatus.failed > 0 && (
                            <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-gray-300">{queueStatus.failed} Failed</span>
                            </div>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2C2C2C] border border-[#2C2C2C] text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}
