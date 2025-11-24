import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Publisher } from '../lib/supabase';
import { Plus, Search, ChevronDown, Globe, ExternalLink, Eye, RefreshCw, Copy, Folder } from 'lucide-react';
import AddPublisherModal from '../components/AddPublisherModal';
import PublisherDetailModal from '../components/PublisherDetailModal';
import { useNotification } from '../components/NotificationContainer';
import TableRowSkeleton from '../components/TableRowSkeleton';

interface PublisherWithPartner extends Publisher {
  partner?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  };
  mcm_parents?: {
    name: string;
    parent_network_code: string;
  };
  mfa_composite_scores?: Array<{
    overall_mfa_score: number;
  }>;
}

export default function Publishers() {
  const { appUser } = useAuth();
  const [publishers, setPublishers] = useState<PublisherWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<PublisherWithPartner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchPublishers = useCallback(async () => {
    if (!appUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('publishers')
        .select(`
          *,
          partner:app_users!partner_id (id, full_name, company_name),
          mcm_parents (name, parent_network_code),
          mfa_composite_scores!mfa_composite_scores_publisher_id_fkey (overall_mfa_score),
          site_audits (is_directory, directory_type, created_at)
        `)
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'site_audits', ascending: false })
        .limit(1, { foreignTable: 'site_audits' });

      if (appUser.role === 'partner') {
        query = query.eq('partner_id', appUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPublishers(data || []);
    } catch (error) {
      console.error('Error fetching publishers:', error);
      setPublishers([]);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  const statusCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    publishers.forEach(p => {
      const status = p.gam_status || 'pending';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [publishers]);

  const uniquePartners = useMemo(() => {
    const partners = new Map();
    publishers.forEach(p => {
      if (p.partner) {
        partners.set(p.partner.id, p.partner);
      }
    });
    return Array.from(partners.values());
  }, [publishers]);

  const partnerCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    publishers.forEach(p => {
      if (p.partner) {
        counts[p.partner.id] = (counts[p.partner.id] || 0) + 1;
      }
    });
    return counts;
  }, [publishers]);

  const filteredPublishers = useMemo(() => {
    let filtered = publishers;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.network_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => (p.gam_status || 'pending') === statusFilter);
    }

    if (partnerFilter !== 'all') {
      filtered = filtered.filter(p => p.partner?.id === partnerFilter);
    }

    return filtered;
  }, [publishers, searchTerm, statusFilter, partnerFilter]);

  useEffect(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  const handlePublisherCreated = useCallback(() => {
    setShowAddModal(false);
    fetchPublishers();
  }, [fetchPublishers]);

  const handlePublisherDeleted = useCallback(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  const handleRefreshServiceKeys = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('check-service-key-status', {
        body: { check_all: true }
      });

      if (error) throw error;

      await fetchPublishers();
      showSuccess('Service Keys Checked', 'All service key statuses have been updated');
    } catch (error: any) {
      console.error('Error checking service keys:', error);
      showError('Error Checking Service Keys', error.message || 'An unexpected error occurred');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPublishers, showSuccess, showError]);

  const handleStatusChange = useCallback(async (publisherId: string, newStatus: string) => {
    try {
      console.log('Calling update_publisher_status with:', {
        publisher_id: publisherId,
        new_status: newStatus,
        approval_notes: null,
        user_id: appUser?.id
      });

      const { data, error } = await supabase.rpc('update_publisher_status', {
        publisher_id: publisherId,
        new_status: newStatus,
        approval_notes: null,
        user_id: appUser?.id
      })

      console.log('Response:', { data, error });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      if (data && !data.success) {
        console.error('Function returned error:', data);
        throw new Error(data.error || 'Failed to update status')
      }

      await fetchPublishers()
      setSelectedPublisher(null)
      showSuccess('Status Updated', 'Publisher status updated successfully')
    } catch (error: any) {
      console.error('Error updating status:', error)
      showError('Error Updating Status', error.message || 'An unexpected error occurred')
    }
  }, [appUser?.id, fetchPublishers, showSuccess, showError]);

  const handleCopyNetworkCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccess('Copied', 'Network code copied to clipboard');
  };



  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-xl animate-pulse">
            <div className="h-12 bg-[#161616] border border-[#2C2C2C] rounded-lg"></div>
          </div>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-36 bg-[#48a77f]/20 rounded-lg"></div>
            <div className="h-10 w-32 bg-[#161616] border border-[#2C2C2C] rounded-lg"></div>
            <div className="h-10 w-32 bg-[#161616] border border-[#2C2C2C] rounded-lg"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-[#161616] rounded-lg border border-[#2C2C2C] overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-[#0E0E0E]/50 border-b border-[#2C2C2C]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/5">
                  Account/Publisher Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[10%]">
                  Network Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[15%]">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[12%]">
                  Site
                </th>
                {appUser?.role !== 'partner' && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[12%]">
                    Partner
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[10%]">
                  GAM Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[10%]">
                  Service Key Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[8%]">
                  MFA Score
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-[8%]">
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[...Array(8)].map((_, i) => (
                <TableRowSkeleton key={i} columns={appUser?.role !== 'partner' ? 9 : 8} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#48a77f] transition-colors w-5 h-5" />
          <input
            type="text"
            placeholder="Search publishers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#48a77f] focus:ring-1 focus:ring-[#48a77f] transition-all"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`flex items-center gap-2 px-4 py-2.5 bg-[#1E1E1E] border rounded-lg text-sm font-medium transition-all ${statusFilter !== 'all'
                ? 'border-[#48a77f] text-[#48a77f] bg-[#48a77f]/10'
                : 'border-[#2C2C2C] text-gray-300 hover:border-gray-500'
                }`}
            >
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
              <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStatusDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowStatusDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${statusFilter === 'all' ? 'text-[#48a77f] bg-[#48a77f]/5' : 'text-gray-300'
                      }`}
                  >
                    All Statuses
                  </button>
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex justify-between items-center ${statusFilter === status ? 'text-[#48a77f] bg-[#48a77f]/5' : 'text-gray-300'
                        }`}
                    >
                      <span className="capitalize">{status}</span>
                      <span className="text-xs text-gray-500 bg-[#0E0E0E] px-1.5 py-0.5 rounded">{count}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {appUser?.role !== 'partner' && (
            <div className="relative">
              <button
                onClick={() => setShowPartnerDropdown(!showPartnerDropdown)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-[#1E1E1E] border rounded-lg text-sm font-medium transition-all ${partnerFilter !== 'all'
                  ? 'border-[#48a77f] text-[#48a77f] bg-[#48a77f]/10'
                  : 'border-[#2C2C2C] text-gray-300 hover:border-gray-500'
                  }`}
              >
                Partner: {partnerFilter === 'all' ? 'All' : uniquePartners.find(p => p.id === partnerFilter)?.full_name || 'Unknown'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showPartnerDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showPartnerDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPartnerDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setPartnerFilter('all');
                        setShowPartnerDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${partnerFilter === 'all' ? 'text-[#48a77f] bg-[#48a77f]/5' : 'text-gray-300'
                        }`}
                    >
                      All Partners
                    </button>
                    {uniquePartners.map((partner) => (
                      <button
                        key={partner.id}
                        onClick={() => {
                          setPartnerFilter(partner.id);
                          setShowPartnerDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex justify-between items-center ${partnerFilter === partner.id ? 'text-[#48a77f] bg-[#48a77f]/5' : 'text-gray-300'
                          }`}
                      >
                        <span className="truncate mr-2">{partner.full_name || partner.company_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-500 bg-[#0E0E0E] px-1.5 py-0.5 rounded flex-shrink-0">
                          {partnerCounts[partner.id] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleRefreshServiceKeys}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 bg-[#1E1E1E] border border-[#2C2C2C] hover:border-[#48a77f] text-gray-300 hover:text-[#48a77f] rounded-lg text-sm font-medium transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh Service Keys"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh Keys</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#48a77f] hover:bg-[#3d9166] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#48a77f]/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Publisher
          </button>
        </div>
      </div>

      <div className="bg-[#1E1E1E] rounded-xl border border-[#2C2C2C] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2C2C2C] bg-[#1E1E1E]">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Publisher</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Network Code</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">MFA Score</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Site</th>
                {appUser?.role !== 'partner' && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Partner</th>
                )}
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C2C]">
              {filteredPublishers.map((publisher) => (
                <tr
                  key={publisher.id}
                  className="hover:bg-[#2C2C2C] transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#48a77f] to-[#3d9166] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#48a77f]/20 mr-3">
                        {publisher.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-white group-hover:text-[#48a77f] transition-colors">{publisher.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 group/code">
                      {publisher.network_code ? (
                        <a
                          href={`https://admanager.google.com/${publisher.network_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#48a77f] hover:text-[#3d9166] flex items-center font-mono transition-colors"
                          title="Open in Google Ad Manager"
                        >
                          {publisher.network_code}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-300 font-mono">N/A</span>
                      )}
                      {publisher.network_code && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyNetworkCode(publisher.network_code!);
                          }}
                          className="p-1 text-gray-500 hover:text-[#48a77f] transition-colors opacity-0 group-hover/code:opacity-100"
                          title="Copy Network Code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${publisher.gam_status === 'approved' ? 'bg-[#48a77f]/10 text-[#48a77f] border-[#48a77f]/20' :
                      publisher.gam_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                      {publisher.gam_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${((publisher as any).mfa_score || 0) >= 80 ? 'bg-green-500' :
                        ((publisher as any).mfa_score || 0) >= 60 ? 'bg-blue-500' :
                          ((publisher as any).mfa_score || 0) >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`} />
                      <span className="text-sm text-gray-300 font-medium">{(publisher as any).mfa_score || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300 max-w-[200px] inline-block truncate" title={publisher.contact_email || ''}>
                      {publisher.contact_email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://${publisher.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#48a77f] hover:text-[#3d9166] flex items-center max-w-[200px] inline-block truncate"
                      title={publisher.domain}
                    >
                      {publisher.domain}
                      <ExternalLink className="w-3 h-3 ml-1 inline-block" />
                    </a>
                    {publisher.site_audits?.[0]?.is_directory && (
                      <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Folder className="w-3 h-3 mr-1" />
                        Directory
                      </span>
                    )}
                  </td>
                  {appUser?.role !== 'partner' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 max-w-[150px] inline-block truncate" title={publisher.partner?.full_name || publisher.partner?.company_name || 'N/A'}>
                        {publisher.partner?.full_name || publisher.partner?.company_name || 'N/A'}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedPublisher(publisher)}
                      className="p-2 rounded-lg bg-[#2C2C2C] text-gray-400 hover:bg-[#48a77f] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md group/btn"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {
          filteredPublishers.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No publishers found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )
        }
      </div >

      {showAddModal && (
        <AddPublisherModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handlePublisherCreated}
          userRole={appUser?.role || 'partner'}
          partnerId={appUser?.id || null}
        />
      )
      }

      {
        selectedPublisher && (
          <PublisherDetailModal
            publisher={selectedPublisher}
            onClose={() => setSelectedPublisher(null)}
            onStatusChange={handleStatusChange}
            onPublisherDeleted={handlePublisherDeleted}
            onPublisherUpdated={fetchPublishers}
            userRole={appUser?.role || 'partner'}
          />
        )
      }
    </div >
  );
}
