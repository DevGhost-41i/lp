import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, useRecentPublishers, useRecentAlerts } from '../hooks/useDashboard';
import { supabase, Publisher, Alert } from '../lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MCMInsightsCard from '../components/MCMInsightsCard';
import MFAAnalyticsCard from '../components/MFAAnalyticsCard';
import StatCardSkeleton from '../components/StatCardSkeleton';
import ListItemSkeleton from '../components/ListItemSkeleton';
import {
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

export default function Dashboard() {
  const { appUser } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query hooks for data fetching with caching
  const { data: stats, isLoading: statsLoading } = useDashboardStats(appUser?.id, appUser?.role);
  const { data: recentPublishers = [], isLoading: publishersLoading } = useRecentPublishers(appUser?.id, appUser?.role);
  const { data: recentAlerts = [], isLoading: alertsLoading } = useRecentAlerts(appUser?.id, appUser?.role);

  // Mutation for dismissing alerts
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch alerts
      queryClient.invalidateQueries({ queryKey: ['recentAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const handleDismissAlert = (alertId: string) => {
    dismissAlertMutation.mutate(alertId);
  };

  const loading = statsLoading || publishersLoading || alertsLoading;

  if (loading) {
    return (
      <div className="space-y-6 relative">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-5 border border-[#48a77f]/20 animate-pulse">
          <div className="h-8 bg-[#2C2C2C] rounded w-48 mb-2"></div>
          <div className="h-4 bg-[#2C2C2C]/60 rounded w-64"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Lists Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-4 border border-[#48a77f]/10">
            <div className="h-6 bg-[#2C2C2C] rounded w-40 mb-4 animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-4 border border-[#48a77f]/10">
            <div className="h-6 bg-[#2C2C2C] rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-4 border border-[#48a77f]/20">
        <h1 className="text-xl font-semibold text-white mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400">
          Welcome back, <span className="text-[#48a77f] font-medium">{appUser?.full_name || appUser?.email}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Total Publishers</p>
            <p className="text-3xl font-bold text-white">{stats?.totalPublishers || 0}</p>
          </div>
          <div className="bg-[#48a77f]/20 p-3 rounded-lg">
            <svg className="w-6 h-6 text-[#48a77f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Pending Review</p>
            <p className="text-3xl font-bold text-white">{stats?.pendingPublishers || 0}</p>
          </div>
          <div className="bg-[#48a77f]/20 p-3 rounded-lg">
            <svg className="w-6 h-6 text-[#48a77f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-white">
              ${(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#48a77f]/20 p-3 rounded-lg">
            <svg className="w-6 h-6 text-[#48a77f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">MFA Issues</p>
            <p className="text-3xl font-bold text-white">{stats?.mfaIssues || 0}</p>
          </div>
          <div className="bg-[#48a77f]/20 p-3 rounded-lg">
            <svg className="w-6 h-6 text-[#48a77f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recent Publishers and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-4 border border-[#48a77f]/10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#48a77f] to-transparent opacity-50"></div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#48a77f] rounded-full animate-pulse"></span>
            Recent Publishers
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {recentPublishers.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <p className="text-xs text-gray-400">No publishers yet</p>
              </div>
            ) : (
              recentPublishers.map((publisher: Publisher) => (
                <div
                  key={publisher.id}
                  className="group/item"
                >
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-[#0E0E0E] to-[#161616]/50 rounded-lg border border-[#2C2C2C]/50 group-hover/item:border-[#48a77f]/30 transition-all duration-300">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium mb-0.5">{publisher.name}</p>
                      <p className="text-xs text-gray-400">{publisher.domain}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${publisher.gam_status === 'accepted' ? 'bg-[#48a77f]/20 text-[#5BBF94] border border-[#48a77f]/30' :
                        publisher.gam_status === 'pending' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' :
                          publisher.gam_status === 'approved' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' :
                            publisher.gam_status === 'invited' ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' :
                              publisher.gam_status === 'rejected' ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                                publisher.gam_status === 'withdrawn' ? 'bg-[#2C2C2C]/20 text-gray-400 border border-[#2C2C2C]/30' :
                                  publisher.gam_status === 'policy_issues' ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' :
                                    publisher.gam_status === 'ivt_issues' ? 'bg-pink-600/20 text-pink-400 border border-pink-600/30' :
                                      'bg-[#1E1E1E]/20 text-gray-400 border border-[#2C2C2C]/30'
                        }`}>
                        {publisher.gam_status}
                      </span>
                      {publisher.service_key_status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-[#48a77f]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500/70" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-4 border border-[#48a77f]/10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#48a77f] to-transparent opacity-50"></div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#48a77f] rounded-full animate-pulse"></span>
            Active Alerts
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {recentAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <p className="text-xs text-gray-400">No active alerts</p>
              </div>
            ) : (
              recentAlerts.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className="group/alert"
                >
                  <div className="p-3 bg-gradient-to-br from-[#0E0E0E] to-[#161616]/50 rounded-lg border-l-4 border-[#48a77f] overflow-hidden hover:border-[#48a77f]/80 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${alert.severity === 'critical' ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                            alert.severity === 'high' ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' :
                              alert.severity === 'medium' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' :
                                'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                            }`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-400">
                            {alert.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed mb-1.5">{alert.message}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="w-1 h-1 bg-[#48a77f] rounded-full"></span>
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="flex-shrink-0 p-1 hover:bg-[#2C2C2C] rounded transition-colors group/dismiss"
                        title="Dismiss alert"
                      >
                        <X className="w-4 h-4 text-gray-500 group-hover/dismiss:text-white transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MFA and MCM Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-4 border border-[#48a77f]/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              MFA Security Posture
            </h2>
            <MFAAnalyticsCard />
          </div>
        </div>

        <div>
          <div className="bg-gradient-to-br from-[#0E0E0E] via-[#161616] to-[#0E0E0E] rounded-xl p-4 border border-[#48a77f]/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              MCM Program Insights
            </h2>
            <MCMInsightsCard />
          </div>
        </div>
      </div>

    </div>
  );
}
