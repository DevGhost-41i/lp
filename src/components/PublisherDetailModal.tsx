import { Publisher, supabase } from '../lib/supabase'
import { X, CheckCircle, XCircle, Trash2, CreditCard as Edit2, Check, RefreshCw, Zap, Clock, Calendar, ExternalLink, Folder } from 'lucide-react'
import { useState, useEffect } from 'react'
import ConfirmationDialog from './ConfirmationDialog'
import { deletionService } from '../lib/deletionService'
import { useNotification } from './NotificationContainer'
import { useAuth } from '../contexts/AuthContext'
import CustomSelect from './CustomSelect'
import { GAMService } from '../lib/gamService'

import { auditBatchService } from '../lib/auditBatchService'
import DirectoryAuditModal from './DirectoryAuditModal'

interface PublisherDetailModalProps {
  publisher: Publisher & { partners?: any; mcm_parents?: any }
  onClose: () => void
  onStatusChange: (publisherId: string, newStatus: string) => void
  onPublisherDeleted?: () => void
  onPublisherUpdated?: () => void
  userRole: string
}

export default function PublisherDetailModal({
  publisher,
  onClose,
  onStatusChange,
  onPublisherDeleted,
  onPublisherUpdated,
  userRole,
}: PublisherDetailModalProps) {
  const { user } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(publisher.name)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isEditingNetworkCode, setIsEditingNetworkCode] = useState(false)
  const [editedNetworkCode, setEditedNetworkCode] = useState(publisher.network_code || '')
  const [isSavingNetworkCode, setIsSavingNetworkCode] = useState(false)
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(publisher.partner_id)
  const [isUpdatingPartner, setIsUpdatingPartner] = useState(false)
  const [isRefreshingServiceKey, setIsRefreshingServiceKey] = useState(false)
  const [isAuditingAll, setIsAuditingAll] = useState(false)
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false)
  const [lastStatusChange, setLastStatusChange] = useState<string | null>(null)
  const [latestAudit, setLatestAudit] = useState<any>(null)
  const [selectedDirectory, setSelectedDirectory] = useState<{ url: string; data: any } | null>(null)
  const { showSuccess, showError } = useNotification()

  const canChangeStatus = ['admin', 'super_admin'].includes(userRole) ||
    (userRole === 'partner' && ['pending', 'approved', 'invited'].includes(publisher.gam_status || ''));

  const canDelete = ['admin', 'super_admin'].includes(userRole) ||
    (userRole === 'partner' && publisher.partner_id);

  const canEditPartner = ['admin', 'super_admin'].includes(userRole);

  useEffect(() => {
    if (canEditPartner) {
      fetchPartners();
    }
  }, [canEditPartner]);

  useEffect(() => {
    const fetchLastStatusChange = async () => {
      try {
        const { data, error } = await supabase
          .from('approval_logs')
          .select('created_at')
          .eq('publisher_id', publisher.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data) {
          setLastStatusChange(data.created_at)
        }
      } catch (error) {
        console.error('Error fetching last status change:', error)
      }
    }

    fetchLastStatusChange()
  }, [publisher.id])

  useEffect(() => {
    const fetchLatestAudit = async () => {
      try {
        const { data, error } = await supabase
          .from('site_audits')
          .select('*')
          .eq('publisher_id', publisher.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data) setLatestAudit(data)
      } catch (error) {
        console.error('Error fetching latest audit:', error)
      }
    }
    fetchLatestAudit()
  }, [publisher.id])

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, full_name, company_name')
        .eq('role', 'partner')
        .order('full_name');

      if (error) throw error;

      const partnersWithNames = (data || []).map(p => ({
        id: p.id,
        name: p.full_name || p.name || p.company_name || 'Unknown'
      }));

      setPartners(partnersWithNames);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handlePartnerChange = async (newPartnerId: string | null) => {
    if (newPartnerId === selectedPartnerId) return;

    setIsUpdatingPartner(true);
    try {
      const { error } = await supabase
        .from('publishers')
        .update({ partner_id: newPartnerId })
        .eq('id', publisher.id);

      if (error) throw error;

      setSelectedPartnerId(newPartnerId);

      const partnerName = newPartnerId
        ? partners.find(p => p.id === newPartnerId)?.name || 'Unknown'
        : 'N/A';

      showSuccess('Partner Updated', `Publisher partner changed to ${partnerName}`);
      onPublisherUpdated?.();
    } catch (error) {
      console.error('Error updating partner:', error);
      showError('Failed to Update Partner', error instanceof Error ? error.message : 'An unexpected error occurred');
      setSelectedPartnerId(selectedPartnerId);
    } finally {
      setIsUpdatingPartner(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id) {
      showError('Authentication Error', 'You must be logged in to delete publishers')
      return
    }

    setIsDeleting(true)
    try {
      const result = await deletionService.deletePublisher(publisher.id, user.id)

      if (result.success) {
        showSuccess('Publisher Deleted', 'Publisher and related data deleted successfully')
        setShowDeleteDialog(false)
        onPublisherDeleted?.()
        onClose()
      } else {
        showError('Failed to Delete Publisher', result.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showError('Error Deleting Publisher', error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      showError('Validation Error', 'Publisher name cannot be empty')
      return
    }

    if (editedName === publisher.name) {
      setIsEditingName(false)
      return
    }

    setIsSavingName(true)
    try {
      const { error } = await supabase
        .from('publishers')
        .update({ name: editedName.trim() })
        .eq('id', publisher.id)

      if (error) throw error

      showSuccess('Name Updated', 'Publisher name updated successfully')
      publisher.name = editedName.trim()
      setIsEditingName(false)
    } catch (error) {
      console.error('Error updating name:', error)
      showError('Failed to Update Name', error instanceof Error ? error.message : 'An unexpected error occurred')
      setEditedName(publisher.name)
    } finally {
      setIsSavingName(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedName(publisher.name)
    setIsEditingName(false)
  }

  const handleSaveNetworkCode = async () => {
    if (!editedNetworkCode.trim()) {
      showError('Validation Error', 'Network code cannot be empty')
      return
    }

    if (editedNetworkCode === publisher.network_code) {
      setIsEditingNetworkCode(false)
      return
    }

    setIsSavingNetworkCode(true)
    try {
      const verification = await GAMService.verifyServiceAccountAccess(
        editedNetworkCode.trim()
      )

      if (verification.status === 'invalid') {
        showError(
          'GAM Access Verification Failed',
          `The service account does not have permission to access this GAM network. Please ensure the service email is added as an Admin or Reports user. Error: ${verification.error}`
        )
        setEditedNetworkCode(publisher.network_code || '')
        setIsSavingNetworkCode(false)
        setIsEditingNetworkCode(false)
        return
      }

      const { error } = await supabase
        .from('publishers')
        .update({
          network_code: editedNetworkCode.trim(),
          service_key_status: verification.status,
          service_key_verified_at: new Date().toISOString()
        })
        .eq('id', publisher.id)

      if (error) throw error

      showSuccess('Network Code Updated', 'Network code updated and GAM access verified successfully')
      publisher.network_code = editedNetworkCode.trim()
      setIsEditingNetworkCode(false)
      onPublisherUpdated?.()
    } catch (error) {
      console.error('Error updating network code:', error)
      showError('Failed to Update Network Code', error instanceof Error ? error.message : 'An unexpected error occurred')
      setEditedNetworkCode(publisher.network_code || '')
    } finally {
      setIsSavingNetworkCode(false)
    }
  }

  const handleCancelNetworkCodeEdit = () => {
    setEditedNetworkCode(publisher.network_code || '')
    setIsEditingNetworkCode(false)
  }

  const handleRefreshServiceKeyStatus = async () => {
    if (!publisher.network_code) {
      showError('Network Code Required', 'Publisher must have a network code to check service key status')
      return
    }

    setIsRefreshingServiceKey(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(
        `${supabaseUrl}/functions/v1/check-service-key-status?publisherId=${publisher.id}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (result.success) {
        publisher.service_key_status = result.status
        publisher.service_key_last_check = result.checkedAt

        if (result.status === 'active') {
          showSuccess('Service Key Verified', 'Service account has active access to GAM network')
        } else {
          showError('Service Key Invalid', result.error || 'Service account does not have access')
        }

        onPublisherUpdated?.()
      } else {
        showError('Check Failed', result.error || 'Failed to check service key status')
      }
    } catch (error) {
      console.error('Error refreshing service key status:', error)
      showError('Refresh Failed', error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsRefreshingServiceKey(false)
    }
  }

  const handleRefreshMetrics = async () => {
    try {
      setIsRefreshingMetrics(true)

      // Fetch latest report data from report_historical and reports_dimensional
      const { data: reportData, error: reportError } = await supabase
        .from('report_historical')
        .select('revenue, impressions, clicks, ad_requests')
        .eq('publisher_id', publisher.id)
        .order('date', { ascending: false })
        .limit(30) // Last 30 days

      if (reportError) throw reportError

      if (!reportData || reportData.length === 0) {
        // Try reports_dimensional if no historical data
        const { data: dimData, error: dimError } = await supabase
          .from('reports_dimensional')
          .select('revenue, impressions, clicks, ad_requests')
          .eq('publisher_id', publisher.id)
          .order('date', { ascending: false })
          .limit(30)

        if (dimError) throw dimError

        if (!dimData || dimData.length === 0) {
          showError('No Report Data', 'No GAM report data found for this publisher')
          return
        }

        // Calculate metrics from dimensional data
        await updateMetricsFromData(dimData)
      } else {
        // Calculate metrics from historical data
        await updateMetricsFromData(reportData)
      }

      showSuccess('Metrics Refreshed', 'Performance metrics updated from GAM reports')

      // Refresh the page data
      if (onPublisherUpdated) {
        onPublisherUpdated()
      }
    } catch (error: any) {
      console.error('Error refreshing metrics:', error)
      showError('Refresh Failed', error.message || 'Failed to refresh metrics')
    } finally {
      setIsRefreshingMetrics(false)
    }
  }

  const updateMetricsFromData = async (data: any[]) => {
    // Aggregate the data
    const totalRevenue = data.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0)
    const totalImpressions = data.reduce((sum, row) => sum + (parseInt(row.impressions) || 0), 0)
    const totalClicks = data.reduce((sum, row) => sum + (parseInt(row.clicks) || 0), 0)
    const totalAdRequests = data.reduce((sum, row) => sum + (parseInt(row.ad_requests) || 0), 0)

    // Calculate metrics
    const avgRevenue = totalRevenue / data.length
    const avgEcpm = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgFillRate = totalAdRequests > 0 ? (totalImpressions / totalAdRequests) * 100 : 100

    // Update publisher metrics
    const { error: updateError } = await supabase
      .from('publishers')
      .update({
        last_revenue: avgRevenue,
        last_ecpm: avgEcpm,
        last_ctr: avgCtr,
        last_fill_rate: avgFillRate,
        metrics_updated_at: new Date().toISOString()
      })
      .eq('id', publisher.id)

    if (updateError) throw updateError
  }

  const handleQuickAuditAll = async () => {
    if (!user?.id) {
      showError('Authentication Error', 'You must be logged in to start an audit')
      return
    }

    setIsAuditingAll(true)
    try {
      const sites = await auditBatchService.fetchPublisherSiteNames(publisher.id)
      if (sites.length === 0) {
        showError('No Sites', 'No sites found for this publisher to audit')
        setIsAuditingAll(false)
        return
      }

      const siteNames = sites.map((s) => s.site_name)
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session) {
        showError('Authentication Error', 'Session not available')
        setIsAuditingAll(false)
        return
      }

      const result = await auditBatchService.initiateMultiSiteAudit(
        publisher.id,
        siteNames,
        session.access_token
      )

      if (result.success) {
        showSuccess('Audit Started', `Monitoring initiated for ${siteNames.length} site${siteNames.length !== 1 ? 's' : ''} `)
        onPublisherUpdated?.()
      } else {
        showError('Audit Failed', result.error || 'Failed to initiate audit')
      }
    } catch (error) {
      console.error('Error initiating quick audit:', error)
      showError('Error', error instanceof Error ? error.message : 'Failed to start audit')
    } finally {
      setIsAuditingAll(false)
    }
  }


  const getAvailableTransitions = () => {
    if (['admin', 'super_admin'].includes(userRole)) {
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'approved', label: 'Approved' },
        { value: 'invited', label: 'Invited' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'withdrawn', label: 'Withdrawn' },
        { value: 'policy_issues', label: 'Policy Issues' },
        { value: 'ivt_issues', label: 'IVT Issues' },
        { value: 'not_approved', label: 'Not Approved' },
      ];
    }

    if (userRole === 'partner') {
      const currentStatus = publisher.gam_status;

      if (currentStatus === 'pending') {
        return [];
      }

      if (currentStatus === 'approved' || ['invited', 'rejected', 'withdrawn', 'policy_issues', 'ivt_issues', 'not_approved'].includes(currentStatus || '')) {
        return [
          { value: 'pending', label: 'Pending' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'policy_issues', label: 'Policy Issues' },
          { value: 'ivt_issues', label: 'IVT Issues' },
          { value: 'not_approved', label: 'Not Approved' },
        ];
      }
    }

    return [];
  };

  const handleStatusChangeClick = (newStatus: string) => {
    onStatusChange(publisher.id, newStatus);
  };

  const availableTransitions = getAvailableTransitions();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-xl w-full max-w-4xl border border-[#2C2C2C] shadow-2xl max-h-[90vh] flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1E1E1E] border-b border-[#2C2C2C] p-6 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-white">Publisher Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2C2C2C] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#48a77f] rounded-full"></div>
              Basic Information
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-400 mb-1">Name</dt>
                <dd className="text-white font-medium">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="px-3 py-1.5 bg-[#1E1E1E] border border-[#2C2C2C] rounded text-white focus:outline-none focus:border-[#48a77f] flex-1"
                        disabled={isSavingName}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="p-1.5 bg-[#48a77f] hover:bg-[#3d9166] text-white rounded transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSavingName}
                        className="p-1.5 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-white rounded transition-colors disabled:opacity-50"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{publisher.name}</span>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 hover:bg-[#1E1E1E] rounded transition-colors text-gray-400 hover:text-[#48a77f]"
                        title="Edit name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400 mb-1">Domain</dt>
                <dd className="text-white font-medium">{publisher.domain}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400 mb-1">Contact Email</dt>
                <dd className="text-white font-medium">{publisher.contact_email || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400 mb-1">Network Code</dt>
                <dd className="text-white font-medium">
                  {isEditingNetworkCode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedNetworkCode}
                        onChange={(e) => setEditedNetworkCode(e.target.value)}
                        className="px-3 py-1.5 bg-[#1E1E1E] border border-[#2C2C2C] rounded text-white focus:outline-none focus:border-[#48a77f] flex-1"
                        disabled={isSavingNetworkCode}
                        autoFocus
                        placeholder="Enter network code"
                      />
                      <button
                        onClick={handleSaveNetworkCode}
                        disabled={isSavingNetworkCode}
                        className="p-1.5 bg-[#48a77f] hover:bg-[#3d9166] text-white rounded transition-colors disabled:opacity-50"
                        title="Save and verify"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelNetworkCodeEdit}
                        disabled={isSavingNetworkCode}
                        className="p-1.5 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-white rounded transition-colors disabled:opacity-50"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {publisher.network_code ? (
                        <a
                          href={`https://admanager.google.com/${publisher.network_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#48a77f] hover:text-[#3d9166] hover:underline transition-colors flex items-center gap-1"
                          title="Open in Google Ad Manager"
                        >
                          {publisher.network_code}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                      {canEditPartner && (
                        <button
                          onClick={() => setIsEditingNetworkCode(true)}
                          className="p-1.5 hover:bg-[#2C2C2C] rounded-lg transition-colors text-gray-400 hover:text-[#48a77f] ml-1"
                          title="Edit network code"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </dd>
              </div>
              {userRole !== 'partner' && (
                <div>
                  <dt className="text-sm text-gray-400 mb-1">Partner</dt>
                  <dd className="text-white font-medium">
                    {canEditPartner ? (
                      <CustomSelect
                        value={selectedPartnerId || ''}
                        onChange={(value) => handlePartnerChange(value || null)}
                        disabled={isUpdatingPartner}
                        options={[
                          { value: '', label: 'N/A' },
                          ...partners.map((partner) => ({
                            value: partner.id,
                            label: partner.name,
                          })),
                        ]}
                      />
                    ) : (
                      <span>{publisher.partners?.full_name || publisher.partners?.company_name || 'N/A'}</span>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-400 mb-1">Parent MCM</dt>
                <dd className="text-white font-medium">
                  {publisher.mcm_parents?.name
                    ? `${publisher.mcm_parents.name} (${publisher.mcm_parents.parent_network_code || 'N/A'})`
                    : 'Not Assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Date Added
                </dt>
                <dd className="text-white font-medium">
                  {new Date(publisher.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#48a77f] rounded-full"></div>
              Status Information
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-400 mb-1">GAM Status</dt>
                <dd>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${publisher.gam_status === 'accepted' || publisher.gam_status === 'approved' || publisher.gam_status === 'invited'
                      ? 'bg-[#48a77f] text-white'
                      : publisher.gam_status === 'pending'
                        ? 'bg-[#48a77f] text-white'
                        : publisher.gam_status === 'rejected'
                          ? 'bg-red-600 text-white'
                          : publisher.gam_status === 'withdrawn'
                            ? 'bg-yellow-600 text-white'
                            : publisher.gam_status === 'policy_issues'
                              ? 'bg-orange-600 text-white'
                              : publisher.gam_status === 'ivt_issues'
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#1E1E1E] text-white'
                      } `}
                  >
                    {publisher.gam_status}
                  </span>
                </dd>
              </div>
              {publisher.admin_approved !== null && (
                <div>
                  <dt className="text-sm text-gray-400 mb-1">Admin Approved</dt>
                  <dd className="flex items-center space-x-2">
                    {publisher.admin_approved ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-[#48a77f]" />
                        <span className="text-white">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-white">No</span>
                      </>
                    )}
                  </dd>
                </div>
              )}
              {publisher.approved_at && (
                <div>
                  <dt className="text-sm text-gray-400 mb-1">Approved At</dt>
                  <dd className="text-white">
                    {new Date(publisher.approved_at).toLocaleString()}
                  </dd>
                </div>
              )}
              {publisher.approval_notes && (
                <div className="col-span-2">
                  <dt className="text-sm text-gray-400 mb-1">Approval Notes</dt>
                  <dd className="text-white bg-[#1E1E1E] p-3 rounded border">
                    {publisher.approval_notes}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-400 mb-1">Service Key Status</dt>
                <dd className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${publisher.service_key_status === 'active'
                      ? 'bg-[#48a77f] text-white'
                      : publisher.service_key_status === 'invalid'
                        ? 'bg-red-600 text-white'
                        : 'bg-[#1E1E1E] text-gray-400'
                      } `}
                  >
                    {publisher.service_key_status}
                  </span>
                  <button
                    onClick={handleRefreshServiceKeyStatus}
                    disabled={isRefreshingServiceKey || !publisher.network_code}
                    className="p-1.5 hover:bg-[#1E1E1E] rounded transition-colors text-gray-400 hover:text-[#48a77f] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh service key status"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingServiceKey ? 'animate-spin' : ''} `} />
                  </button>
                </dd>
              </div>
              {publisher.service_key_last_check && (
                <div>
                  <dt className="text-sm text-gray-400 mb-1">Last Service Key Check</dt>
                  <dd className="text-white">
                    {new Date(publisher.service_key_last_check).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Performance Metrics Section */}
          <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-6 bg-[#48a77f] rounded-full"></div>
                Performance Metrics
              </h3>
              <button
                onClick={handleRefreshMetrics}
                disabled={isRefreshingMetrics}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#2C2C2C] hover:bg-[#383838] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingMetrics ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C2C]">
                <dt className="text-xs text-gray-400 mb-1">Last Revenue</dt>
                <dd className="text-xl font-bold text-[#48a77f]">
                  ${publisher.last_revenue?.toFixed(2) || '0.00'}
                </dd>
              </div>
              <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C2C]">
                <dt className="text-xs text-gray-400 mb-1">Last eCPM</dt>
                <dd className="text-xl font-bold text-white">
                  ${publisher.last_ecpm?.toFixed(2) || '0.00'}
                </dd>
              </div>
              <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C2C]">
                <dt className="text-xs text-gray-400 mb-1">Last CTR</dt>
                <dd className="text-xl font-bold text-white">
                  {publisher.last_ctr?.toFixed(2) || '0.00'}%
                </dd>
              </div>
              <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C2C]">
                <dt className="text-xs text-gray-400 mb-1">Viewability</dt>
                <dd className="text-xl font-bold text-white">
                  {((publisher as any).last_viewability)?.toFixed(2) || '0.00'}%
                </dd>
              </div>
              <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C2C]">
                <dt className="text-xs text-gray-400 mb-1">Fill Rate</dt>
                <dd className="text-xl font-bold text-white">
                  {publisher.last_fill_rate?.toFixed(2) || '0.00'}%
                </dd>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Metrics Updated At: {publisher.metrics_updated_at ? new Date(publisher.metrics_updated_at).toLocaleString() : 'Never'}
            </p>
          </div>

          {/* Directory Website Section */}
          {latestAudit?.is_directory && (
            <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                Directory Website Detected
              </h3>

              <dl className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <dt className="text-sm text-gray-400 mb-1">Directory Type</dt>
                  <dd className="text-white font-medium capitalize">{latestAudit.directory_type || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400 mb-1">Confidence</dt>
                  <dd className="text-white font-medium">
                    {latestAudit.directory_confidence ? `${(latestAudit.directory_confidence * 100).toFixed(0)}%` : 'N/A'}
                  </dd>
                </div>
              </dl>

              {latestAudit.directory_data?.directories && latestAudit.directory_data.directories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Discovered Directories ({latestAudit.directory_data.directories.length})
                  </h4>
                  <div className="bg-[#1E1E1E] rounded-lg border border-[#2C2C2C] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead className="bg-[#252525] text-gray-400 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Path</th>
                          <th className="px-4 py-2 text-center font-medium">Status</th>
                          <th className="px-4 py-2 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C2C2C]">
                        {latestAudit.directory_data.directories.map((dir: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#252525] transition-colors">
                            <td className="px-4 py-2 text-white font-mono text-xs truncate max-w-[200px]" title={dir.url}>{dir.url}</td>
                            <td className="px-4 py-2 text-center">
                              {dir.success ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#48a77f]/10 text-[#48a77f] border border-[#48a77f]/20">
                                  Audited
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {dir.success && dir.modules && (
                                <button
                                  onClick={() => setSelectedDirectory({ url: dir.url, data: dir.modules })}
                                  className="p-1 hover:bg-[#3C3C3C] rounded text-gray-400 hover:text-white transition-colors"
                                  title="View Details"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Directory Audit Details Modal */}
          <DirectoryAuditModal
            isOpen={!!selectedDirectory}
            onClose={() => setSelectedDirectory(null)}
            url={selectedDirectory?.url || ''}
            data={selectedDirectory?.data}
          />

          <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-1 h-6 bg-[#48a77f] rounded-full"></div>
                MFA Compliance Score
              </h3>
              {['admin', 'super_admin'].includes(userRole) && (
                <button
                  onClick={handleQuickAuditAll}
                  disabled={isAuditingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Trigger monitoring worker for all sites"
                >
                  {isAuditingAll ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Audit Now</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <dt className="text-sm text-gray-400 mb-1">Overall MFA Score</dt>
                <dd className="text-3xl font-bold text-[#48a77f]">
                  {publisher.mfa_score ?? 'N/A'}
                </dd>
              </div>
            </dl>
            <p className="text-sm text-gray-400">MFA scores are calculated from site audits and compliance data. Use "Audit Now" to audit multiple sites.</p>
          </div>


          {canChangeStatus && availableTransitions.length > 0 && (
            <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-[#48a77f] rounded-full"></div>
                Change Status
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableTransitions
                  .filter((t) => t.value !== publisher.gam_status)
                  .map((transition) => (
                    <button
                      key={transition.value}
                      onClick={() => handleStatusChangeClick(transition.value)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm border flex items-center justify-center ${transition.value === 'approved'
                        ? 'bg-[#48A77F]/10 text-[#48A77F] hover:bg-[#48A77F] hover:text-white border-[#48A77F]/20'
                        : transition.value === 'rejected'
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border-red-500/20'
                          : transition.value === 'suspended'
                            ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-600 hover:text-white border-yellow-500/20'
                            : 'bg-[#2C2C2C] hover:bg-[#3C3C3C] text-gray-300 hover:text-white border-transparent hover:border-gray-600'
                        } `}
                    >
                      {transition.label}
                    </button>
                  ))}
              </div>
              {lastStatusChange && (
                <div className="mt-4 pt-4 border-t border-[#2C2C2C] flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Last status change:</span>
                  <span className="text-white font-medium">
                    {new Date(lastStatusChange).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Delete Section */}
          {canDelete && (
            <div className="bg-red-900/20 rounded-[10px] p-6 border border-red-800">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Danger Zone
              </h3>
              <p className="text-red-300 text-sm mb-4">
                Permanently delete this publisher and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[10px] font-medium transition-colors flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Publisher
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-[#2C2C2C] p-6 flex justify-end gap-3 bg-[#1E1E1E] rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2C2C2C] hover:bg-[#3C3C3C] text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div >

      {/* Confirmation Dialog */}
      < ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)
        }
        onConfirm={handleDelete}
        title="Delete Publisher"
        message={`Are you sure you want to permanently delete "${publisher.name}" ? This will remove all associated data including performance reports, alerts, and MFA scans.`}
        entityType="publisher"
        entityName={publisher.name}
        warningLevel="critical"
        affectedData={{
          reports: 0, // TODO: Get actual counts
          alerts: 0,
        }}
        isLoading={isDeleting}
      />
    </div >
  );
}
