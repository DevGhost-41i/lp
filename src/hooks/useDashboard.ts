import { useQuery } from '@tanstack/react-query';
import { supabase, Publisher, Alert } from '../lib/supabase';
import { convertToUSD } from '../lib/currencyService';

interface Stats {
    totalPublishers: number;
    activePublishers: number;
    pendingPublishers: number;
    totalRevenue: number;
    activeAlerts: number;
    mfaIssues: number;
}

// Shared hook to fetch publishers once and reuse across dashboard
export function usePublishers(userId?: string, userRole?: string) {
    return useQuery({
        queryKey: ['publishers', userId, userRole],
        queryFn: async (): Promise<Publisher[]> => {
            const effectiveRole = userRole || 'partner';

            // Select only needed columns for better performance
            let query = supabase
                .from('publishers')
                .select('id, name, domain, gam_status, service_key_status, partner_id');

            if (effectiveRole === 'partner' && userId) {
                query = query.eq('partner_id', userId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data as Publisher[]) || [];
        },
        enabled: !!userRole, // Only run when we have user role
    });
}

// Optimized dashboard stats with parallel queries
export function useDashboardStats(userId?: string, userRole?: string) {
    const { data: publishers = [] } = usePublishers(userId, userRole);

    return useQuery({
        queryKey: ['dashboardStats', userId, userRole, publishers.length],
        queryFn: async (): Promise<Stats> => {
            const effectiveRole = userRole || 'partner';

            // Early return if no publishers
            if (publishers.length === 0) {
                return {
                    totalPublishers: 0,
                    activePublishers: 0,
                    pendingPublishers: 0,
                    totalRevenue: 0,
                    activeAlerts: 0,
                    mfaIssues: 0,
                };
            }

            const publisherIds = publishers.map((p: Publisher) => p.id);
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startDate = firstDayOfMonth.toISOString().split('T')[0];

            // Build queries
            let alertsQuery = supabase
                .from('alerts')
                .select('id, status', { count: 'exact', head: false })
                .in('status', ['active', 'pending']);

            if (effectiveRole === 'partner' && publisherIds.length > 0) {
                alertsQuery = alertsQuery.in('publisher_id', publisherIds);
            }

            // 🚀 OPTIMIZATION: Run all queries in parallel
            const [
                { data: revenueData },
                { data: mfaScores },
                { data: alerts }
            ] = await Promise.all([
                // Revenue query - only select needed columns
                supabase
                    .from('reports_daily')
                    .select('revenue, currency_code, publishers!inner(currency_code)')
                    .in('publisher_id', publisherIds)
                    .gte('date', startDate),
                // MFA scores query
                supabase
                    .from('mfa_composite_scores')
                    .select('overall_mfa_score')
                    .in('publisher_id', publisherIds),
                // Alerts query
                alertsQuery
            ]);

            // Calculate revenue
            let totalRevenue = 0;
            if (revenueData && revenueData.length > 0) {
                const conversionPromises = revenueData.map(async (record: any) => {
                    const revenue = parseFloat(record.revenue) || 0;
                    const currencyCode = record.currency_code || (record.publishers as any)?.currency_code || 'USD';
                    return await convertToUSD(revenue, currencyCode);
                });

                const convertedRevenues = await Promise.all(conversionPromises);
                totalRevenue = convertedRevenues.reduce((sum: number, rev: number) => sum + rev, 0);
            }

            // Calculate stats from publishers data (no additional queries needed)
            const totalPublishers = publishers.length;
            const activePublishers = publishers.filter((p: Publisher) =>
                p.gam_status === 'accepted' && p.service_key_status === 'active'
            ).length;
            const pendingPublishers = publishers.filter((p: Publisher) =>
                p.gam_status === 'pending'
            ).length;
            const mfaIssues = mfaScores?.filter((score: any) =>
                score.overall_mfa_score < 70
            ).length || 0;

            return {
                totalPublishers,
                activePublishers,
                pendingPublishers,
                totalRevenue,
                activeAlerts: alerts?.length || 0,
                mfaIssues,
            };
        },
        enabled: publishers.length > 0, // Only run when we have publishers
    });
}

// Optimized recent publishers - reuses shared publishers data
export function useRecentPublishers(userId?: string, userRole?: string) {
    const { data: publishers = [], isLoading } = usePublishers(userId, userRole);

    return {
        data: publishers.slice(0, 5),
        isLoading,
    };
}

// Optimized recent alerts - reuses shared publishers data
export function useRecentAlerts(userId?: string, userRole?: string) {
    const { data: publishers = [] } = usePublishers(userId, userRole);

    return useQuery({
        queryKey: ['recentAlerts', userId, userRole],
        queryFn: async (): Promise<Alert[]> => {
            const effectiveRole = userRole || 'partner';

            // Select only needed columns
            let alertsQuery = supabase
                .from('alerts')
                .select('id, severity, type, message, created_at, status, publisher_id')
                .in('status', ['active', 'pending'])
                .order('created_at', { ascending: false })
                .limit(5);

            if (effectiveRole === 'partner') {
                const publisherIds = publishers.map((p: Publisher) => p.id);
                if (publisherIds.length > 0) {
                    alertsQuery = alertsQuery.in('publisher_id', publisherIds);
                } else {
                    return []; // No publishers, no alerts
                }
            }

            const { data: alerts, error } = await alertsQuery;
            if (error) throw error;
            return (alerts as Alert[]) || [];
        },
        enabled: publishers.length > 0, // Only run when we have publishers
    });
}
