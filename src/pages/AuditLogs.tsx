import { useEffect, useState } from 'react';
import { auditDataVerification, DatabaseHealthReport } from '../lib/auditDataVerification';
import { AlertCircle, CheckCircle2, TrendingUp, Activity, History, RefreshCw, Clock, Database } from 'lucide-react';

interface OperationLog {
  id: string;
  timestamp: string;
  level: string;
  operation: string;
  table_name: string;
  status: string;
  message: string;
  duration_ms: number;
  record_count: number;
  error_message?: string;
}

export default function AuditLogs() {
  const [healthReport, setHealthReport] = useState<DatabaseHealthReport | null>(null);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const report = await auditDataVerification.generateHealthReport();
      setHealthReport(report);

      const logs =
        filter === 'all'
          ? await auditDataVerification.getOperationLogsByStatus('success', 50)
          : await auditDataVerification.getOperationLogsByStatus(filter, 50);

      setOperationLogs(logs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const report = await auditDataVerification.generateHealthReport();
        setHealthReport(report);

        const logs =
          filter === 'all'
            ? await auditDataVerification.getOperationLogsByStatus('success', 50)
            : await auditDataVerification.getOperationLogsByStatus(filter, 50);

        setOperationLogs(logs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2C2C2C]">
          <div className="animate-pulse">
            <div className="h-10 bg-[#2C2C2C] rounded w-64 mb-2"></div>
            <div className="h-4 bg-[#2C2C2C]/60 rounded w-96"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-lg p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-[#2C2C2C] rounded w-32"></div>
                <div className="h-5 w-5 bg-[#2C2C2C] rounded"></div>
              </div>
              <div className="h-9 bg-[#2C2C2C] rounded w-20 mb-2"></div>
              <div className="h-4 bg-[#2C2C2C]/60 rounded w-28"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-[#2C2C2C] rounded w-48 animate-pulse"></div>
            <div className="flex gap-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-20 bg-[#2C2C2C] rounded"></div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#2C2C2C] rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2C2C2C]">
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 mt-1">
            Monitor database operations, performance metrics, and system health
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-lg bg-[#2C2C2C] text-white hover:bg-[#383838] transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-red-200">{error}</div>
        </div>
      )}

      {healthReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-lg p-6 group hover:border-[#48a77f]/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Successful Audits</h3>
                <CheckCircle2 className="w-5 h-5 text-[#48a77f]" />
              </div>
              <p className="text-3xl font-bold text-white mb-2 group-hover:scale-105 transition-transform origin-left">
                {healthReport.stats.siteAuditsCount}
              </p>
              <p className="text-xs text-gray-500">
                {healthReport.stats.auditResultsCount} results stored
              </p>
            </div>

            <div className="glass-card rounded-lg p-6 group hover:border-orange-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Failed Audits</h3>
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-2 group-hover:scale-105 transition-transform origin-left">
                {healthReport.stats.auditFailuresCount}
              </p>
              <p className="text-xs text-gray-500">
                {((healthReport.stats.auditFailuresCount / (healthReport.stats.siteAuditsCount + healthReport.stats.auditFailuresCount)) * 100).toFixed(1)}%
                of attempts
              </p>
            </div>

            <div className="glass-card rounded-lg p-6 group hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Success Rate</h3>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-2 group-hover:scale-105 transition-transform origin-left">
                {healthReport.stats.successRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                System reliability metric
              </p>
            </div>

            <div className="glass-card rounded-lg p-6 group hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">System Status</h3>
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <p className={`text-2xl font-bold mb-2 group-hover:scale-105 transition-transform origin-left ${healthReport.status === 'healthy'
                ? 'text-[#48a77f]'
                : healthReport.status === 'warning'
                  ? 'text-orange-500'
                  : 'text-red-500'
                }`}>
                {healthReport.status.charAt(0).toUpperCase() + healthReport.status.slice(1)}
              </p>
              <p className="text-xs text-gray-500">
                {healthReport.status === 'healthy' ? 'All systems operational' : 'Check details below'}
              </p>
            </div>
          </div>

          {healthReport.recentErrors.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Recent Errors ({healthReport.recentErrors.length})
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {healthReport.recentErrors.map((err, idx) => (
                  <div key={idx} className="text-sm text-red-200 bg-red-500/10 p-3 rounded border border-red-500/20">
                    <div className="font-medium">{err.operation} on {err.table}</div>
                    <div className="text-red-300 text-xs mt-1">{err.errorMessage}</div>
                    <div className="text-red-400/70 text-xs mt-1">{new Date(err.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {healthReport.slowQueries.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-orange-300 mb-4">Slow Queries ({healthReport.slowQueries.length})</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {healthReport.slowQueries.map((q, idx) => (
                  <div key={idx} className="text-sm text-orange-200 bg-orange-500/10 p-3 rounded border border-orange-500/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{q.operation} on {q.table}</div>
                        <div className="text-orange-300 text-xs mt-1">
                          Duration: {q.duration_ms}ms
                        </div>
                      </div>
                      <div className="text-orange-400/70 text-xs">{new Date(q.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#48a77f]" />
            Database Operation Logs
          </h2>
          <div className="glass-panel p-1 rounded-lg flex gap-1">
            {(['all', 'success', 'failure'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                  ? 'bg-[#48a77f] text-white shadow-lg shadow-[#48a77f]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2C2C2C]">
                <th className="text-left px-4 py-3 text-gray-400 font-medium uppercase tracking-wider text-xs">Timestamp</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium uppercase tracking-wider text-xs">Operation</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium uppercase tracking-wider text-xs">Table</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium uppercase tracking-wider text-xs">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium uppercase tracking-wider text-xs">Duration</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium uppercase tracking-wider text-xs">Records</th>
              </tr>
            </thead>
            <tbody>
              {operationLogs.length > 0 ? (
                operationLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[#2C2C2C] hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 text-gray-300 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${log.operation === 'INSERT' ? 'bg-green-500' :
                          log.operation === 'UPDATE' ? 'bg-blue-500' :
                            log.operation === 'DELETE' ? 'bg-red-500' :
                              'bg-gray-500'
                          }`}></span>
                        {log.operation}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Database className="w-3 h-3 text-gray-500" />
                        {log.table_name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${log.status === 'success'
                          ? 'bg-[#48a77f]/10 text-[#48a77f] border-[#48a77f]/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-300 font-mono text-xs">
                      {log.duration_ms}ms
                    </td>
                    <td className="px-4 py-4 text-gray-300">
                      {log.record_count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <History className="w-8 h-8 mb-3 opacity-20" />
                      <p>No operation logs found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
