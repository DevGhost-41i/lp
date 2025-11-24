import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Alert } from '../lib/supabase';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '../components/NotificationContainer';
import AlertCardSkeleton from '../components/AlertCardSkeleton';

export default function Alerts() {
  const { appUser } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchAlerts();
  }, [appUser, filter]);

  const fetchAlerts = async () => {
    if (!appUser) return;

    try {
      let query = supabase
        .from('alerts')
        .select(`
          *,
          publishers (name, domain)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.in('status', ['pending', 'active']);
      } else if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (appUser.role === 'partner') {
        const { data: publishers } = await supabase
          .from('publishers')
          .select('id')
          .eq('partner_id', appUser.id);

        const publisherIds = publishers?.map((p) => p.id) || [];
        if (publisherIds.length > 0) {
          query = query.in('publisher_id', publisherIds);
        } else {
          setAlerts([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: appUser?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
      showSuccess('Alert Acknowledged', 'Alert has been acknowledged successfully');
    } catch (error: any) {
      showError('Error Acknowledging Alert', error.message || 'An unexpected error occurred');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_by: appUser?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
      showSuccess('Alert Resolved', 'Alert has been resolved successfully');
    } catch (error: any) {
      showError('Error Resolving Alert', error.message || 'An unexpected error occurred');
    }
  };

  const handleResolveAll = async () => {
    try {
      const activeAlerts = alerts.filter(a => a.status === 'active' || a.status === 'pending');
      if (activeAlerts.length === 0) return;

      const alertIds = activeAlerts.map(a => a.id);

      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_by: appUser?.id,
          resolved_at: new Date().toISOString(),
        })
        .in('id', alertIds);

      if (error) throw error;
      fetchAlerts();
      showSuccess('All Resolved', 'All active alerts have been resolved');
    } catch (error: any) {
      showError('Error Resolving Alerts', error.message || 'An unexpected error occurred');
    }
  };


  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-base-300">
          <div className="animate-pulse">
            <div className="h-9 bg-[#2C2C2C] rounded w-32 mb-2"></div>
            <div className="h-4 bg-[#2C2C2C]/60 rounded w-64"></div>
          </div>
          <div className="tabs tabs-boxed gap-1 rounded-lg animate-pulse" style={{ backgroundColor: '#1a1a1a' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 bg-[#2C2C2C] rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Alert Cards Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AlertCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2C2C2C]">
        <div>
          <h1 className="text-3xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor and manage system alerts</p>
        </div>

        <div className="flex items-center gap-4">
          {filter === 'active' && alerts.length > 0 && (
            <button
              onClick={handleResolveAll}
              className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2C] hover:bg-[#3C3C3C] text-white rounded-lg transition-colors border border-[#2C2C2C] hover:border-[#48a77f]"
            >
              <CheckCircle className="w-4 h-4 text-[#48a77f]" />
              <span>Resolve All</span>
            </button>
          )}
          <div className="glass-panel p-1 rounded-lg flex gap-1">
            {(['all', 'active', 'resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === status
                  ? 'bg-[#48a77f] text-white shadow-lg shadow-[#48a77f]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-[#2C2C2C] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#48a77f]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">All Clear</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            There are no active alerts at the moment. Great job keeping everything running smoothly!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-card rounded-lg p-6 border-l-4 transition-all duration-300 hover:shadow-lg group relative overflow-hidden ${alert.severity === 'critical' ? 'border-l-red-500 hover:shadow-red-500/10' :
                alert.severity === 'high' ? 'border-l-orange-500 hover:shadow-orange-500/10' :
                  alert.severity === 'medium' ? 'border-l-yellow-500 hover:shadow-yellow-500/10' :
                    'border-l-blue-500 hover:shadow-blue-500/10'
                }`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                <AlertTriangle className={`w-24 h-24 ${alert.severity === 'critical' ? 'text-red-500' :
                  alert.severity === 'high' ? 'text-orange-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                  }`} />
              </div>

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-blue-500/10 text-blue-500'
                    }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {alert.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full uppercase tracking-wider ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        alert.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{alert.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {alert.publishers && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                          {alert.publishers.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${alert.status === 'active' ? 'bg-red-500' :
                          alert.status === 'acknowledged' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></span>
                        <span className="capitalize">{alert.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                      title="Acknowledge"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Resolve"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
