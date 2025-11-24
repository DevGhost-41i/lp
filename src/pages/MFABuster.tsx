import { useState, useEffect } from 'react';
import {
  Activity, RefreshCw, AlertCircle, BarChart3, X, Zap, Shield,
  Code, FileText, Brain, Timer, Video,
  Layers, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { SiteAuditResultService, SiteAuditResult } from '../lib/siteAuditResultService';
import { useNotification } from '../components/NotificationContainer';
import { triggerAllAuditsService } from '../lib/triggerAllAuditsService';
import PublisherCardSkeleton from '../components/PublisherCardSkeleton';
import DirectoryAuditModal from '../components/DirectoryAuditModal';

// MFA Detection Indicators Component
interface MFAIndicatorsProps {
  audit: SiteAuditResult;
}

function MFAIndicators({ audit }: MFAIndicatorsProps) {
  const adAnalysis = audit.adAnalysis;
  const detections = {
    adDensity: false,
    adStacking: false,
    rapidRefresh: false,
    videoStuffing: false,
  };

  // Check for Ad Density > 30%
  if ((adAnalysis?.data?.analysis?.density?.metrics?.adDensity || 0) > 30) {
    detections.adDensity = true;
  }

  // Check for Ad Stacking
  if (adAnalysis?.data?.analysis?.density?.stackedAds && adAnalysis.data.analysis.density.stackedAds.length > 0) {
    detections.adStacking = true;
  }

  // Check for Rapid Auto-Refresh (<30s)
  if ((adAnalysis?.data?.analysis?.autoRefresh?.summary?.criticalRefreshCount || 0) > 0) {
    detections.rapidRefresh = true;
  }

  // Check for Video Stuffing (>3 players)
  if (adAnalysis?.data?.analysis?.video?.summary?.videoStuffingDetected ||
    ((adAnalysis?.data?.analysis?.video?.metrics?.videoPlayerCount || 0) > 3)) {
    detections.videoStuffing = true;
  }

  const detectedCount = Object.values(detections).filter(Boolean).length;
  const hasDetections = detectedCount > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-[#48a77f]" />
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          MFA Detection ({detectedCount}/4)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Ad Density */}
        <div className={`rounded-lg p-2 border ${detections.adDensity
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#0a0a0a] border-[#2C2C2C]'
          }`}>
          <div className="flex items-center gap-1.5">
            <BarChart3 className={`w-3 h-3 ${detections.adDensity ? 'text-red-400' : 'text-gray-600'}`} />
            <span className={`text-xs font-medium ${detections.adDensity ? 'text-red-300' : 'text-gray-500'}`}>
              Density
            </span>
            {detections.adDensity && <AlertTriangle className="w-3 h-3 text-red-400 ml-auto" />}
            {!detections.adDensity && <CheckCircle2 className="w-3 h-3 text-gray-600 ml-auto" />}
          </div>
          {detections.adDensity && adAnalysis?.data?.analysis?.density?.metrics?.adDensity && (
            <div className="text-xs text-red-400 mt-1 font-bold">
              {Math.round(adAnalysis.data.analysis.density.metrics.adDensity)}%
            </div>
          )}
        </div>

        {/* Ad Stacking */}
        <div className={`rounded-lg p-2 border ${detections.adStacking
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#0a0a0a] border-[#2C2C2C]'
          }`}>
          <div className="flex items-center gap-1.5">
            <Layers className={`w-3 h-3 ${detections.adStacking ? 'text-red-400' : 'text-gray-600'}`} />
            <span className={`text-xs font-medium ${detections.adStacking ? 'text-red-300' : 'text-gray-500'}`}>
              Stacking
            </span>
            {detections.adStacking && <AlertTriangle className="w-3 h-3 text-red-400 ml-auto" />}
            {!detections.adStacking && <CheckCircle2 className="w-3 h-3 text-gray-600 ml-auto" />}
          </div>
          {detections.adStacking && adAnalysis?.data?.analysis?.density?.stackedAds && (
            <div className="text-xs text-red-400 mt-1 font-bold">
              {adAnalysis.data.analysis.density.stackedAds.length} found
            </div>
          )}
        </div>

        {/* Rapid Refresh */}
        <div className={`rounded-lg p-2 border ${detections.rapidRefresh
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#0a0a0a] border-[#2C2C2C]'
          }`}>
          <div className="flex items-center gap-1.5">
            <Timer className={`w-3 h-3 ${detections.rapidRefresh ? 'text-red-400' : 'text-gray-600'}`} />
            <span className={`text-xs font-medium ${detections.rapidRefresh ? 'text-red-300' : 'text-gray-500'}`}>
              Refresh
            </span>
            {detections.rapidRefresh && <AlertTriangle className="w-3 h-3 text-red-400 ml-auto" />}
            {!detections.rapidRefresh && <CheckCircle2 className="w-3 h-3 text-gray-600 ml-auto" />}
          </div>
          {detections.rapidRefresh && adAnalysis?.data?.analysis?.autoRefresh?.summary?.criticalRefreshCount && (
            <div className="text-xs text-red-400 mt-1 font-bold">
              {adAnalysis.data.analysis.autoRefresh.summary.criticalRefreshCount} &lt;30s
            </div>
          )}
        </div>

        {/* Video Stuffing */}
        <div className={`rounded-lg p-2 border ${detections.videoStuffing
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#0a0a0a] border-[#2C2C2C]'
          }`}>
          <div className="flex items-center gap-1.5">
            <Video className={`w-3 h-3 ${detections.videoStuffing ? 'text-red-400' : 'text-gray-600'}`} />
            <span className={`text-xs font-medium ${detections.videoStuffing ? 'text-red-300' : 'text-gray-500'}`}>
              Video
            </span>
            {detections.videoStuffing && <AlertTriangle className="w-3 h-3 text-red-400 ml-auto" />}
            {!detections.videoStuffing && <CheckCircle2 className="w-3 h-3 text-gray-600 ml-auto" />}
          </div>
          {detections.videoStuffing && adAnalysis?.data?.analysis?.video?.metrics?.videoPlayerCount && (
            <div className="text-xs text-red-400 mt-1 font-bold">
              {adAnalysis.data.analysis.video.metrics.videoPlayerCount} players
            </div>
          )}
        </div>
      </div>

      {hasDetections && (
        <div className="mt-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-300 font-medium">
              {detectedCount} MFA {detectedCount === 1 ? 'tactic' : 'tactics'} detected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface AuditDetailModalProps {
  audit: SiteAuditResult;
  onClose: () => void;
}

function AuditDetailModal({ audit, onClose }: AuditDetailModalProps) {
  if (!audit) return null;

  const style = SiteAuditResultService.getRiskLevelStyle(audit.riskLevel);
  const adMetrics = SiteAuditResultService.getAdMetrics(audit.adAnalysis);
  const contentMetrics = SiteAuditResultService.getContentMetrics(audit.contentAnalysis);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#161616]/95 backdrop-blur-md border-b border-[#2C2C2C] p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-1">{audit.publisherName}</h2>
            <p className="text-sm text-gray-400">{audit.publisherDomain}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk Score */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-2xl font-bold text-white">
                MFA Risk Score: {Math.round(audit.riskScore)}/100
              </h3>
              <div
                className="px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {style.label}
              </div>
            </div>
            <div className="w-full bg-[#2C2C2C] rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="h-3 rounded-full transition-all duration-1000 ease-out relative"
                style={{
                  width: `${Math.min(100, Math.max(0, audit.riskScore))}%`,
                  backgroundColor: style.color,
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2C2C2C] space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Summary</h3>
            </div>

            {/* AI Summary */}
            {(audit.aiReport?.interpretation?.parsedFindings?.summary || audit.aiReport?.interpretation?.summary) && (
              <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> AI Analysis
                </h4>
                <p className="text-sm text-cyan-100/90 leading-relaxed whitespace-pre-wrap">
                  {audit.aiReport.interpretation.parsedFindings?.summary || audit.aiReport.interpretation.summary}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Causes */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" /> Identified Causes
                </h4>
                <ul className="space-y-2">
                  {SiteAuditResultService.extractIssuesFromAiReport(audit.aiReport).map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                  {SiteAuditResultService.extractIssuesFromAiReport(audit.aiReport).length === 0 && (
                    <li className="text-sm text-gray-500 italic">No specific causes identified</li>
                  )}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#48a77f]" /> Recommendations
                </h4>
                <ul className="space-y-2">
                  {SiteAuditResultService.extractFixesFromAiReport(audit.aiReport).map((fix, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#48a77f] mt-1.5 shrink-0" />
                      {fix}
                    </li>
                  ))}
                  {SiteAuditResultService.extractFixesFromAiReport(audit.aiReport).length === 0 && (
                    <li className="text-sm text-gray-500 italic">No specific recommendations</li>
                  )}
                </ul>
              </div>
            </div>
          </div>



          {/* Crawler Module */}
          {
            audit.crawlerData && (
              <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2C2C2C]">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-400" />
                  Crawler
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Viewport</div>
                    <div className="text-white font-medium">{audit.crawlerData.viewport || 'desktop'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Session Duration</div>
                    <div className="text-white font-medium">{audit.crawlerData.sessionDuration ? `${audit.crawlerData.sessionDuration / 1000}s` : '70s'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Status</div>
                    <div className="text-green-400 font-medium capitalize">{audit.crawlerData.status || 'completed'}</div>
                  </div>
                  {audit.crawlerData.metrics && (
                    <>
                      <div>
                        <div className="text-gray-400 mb-1">TTFB</div>
                        <div className="text-white font-medium">{audit.crawlerData.metrics.ttfb || 0}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">LCP</div>
                        <div className="text-white font-medium">{audit.crawlerData.metrics.lcp || 0}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">CLS</div>
                        <div className="text-white font-medium">{audit.crawlerData.metrics.cls?.toFixed(3) || 0}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          }

          {/* Content Analysis Module */}
          {
            audit.contentAnalysis && (
              <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2C2C2C]">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-400" />
                  Content Analysis
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Readability</div>
                    <div className="text-xl font-bold text-white">{Math.round(contentMetrics.readability)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Entropy Score</div>
                    <div className="text-xl font-bold text-white">{Math.round(contentMetrics.entropy)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Freshness</div>
                    <div className="text-xl font-bold text-white">{Math.round(contentMetrics.freshness)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Quality</div>
                    <div className="text-xl font-bold text-white">{Math.round(contentMetrics.readability)}</div>
                  </div>
                </div>
                {audit.contentAnalysis.ai && (
                  <div className="mt-4 pt-4 border-t border-[#2C2C2C]">
                    <div className="text-xs text-gray-400 mb-2">AI Detection Metrics</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">AI Likelihood:</span>
                        <span className="text-white font-medium">{audit.contentAnalysis.ai.aiLikelihood ? 'Detected' : 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Clickbait:</span>
                        <span className="text-white font-medium">{audit.contentAnalysis.clickbait?.clickbaitScore || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }

          {/* Ad Analysis Module */}
          {
            audit.adAnalysis && (
              <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2C2C2C]">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-orange-400" />
                  Ad Analysis
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1">Density</div>
                      <div className="text-xl font-bold text-white">{Math.round(adMetrics.density)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Auto-Refresh</div>
                      <div className="text-xl font-bold text-white">{Math.round(adMetrics.refresh)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Visibility</div>
                      <div className="text-xl font-bold text-white">{Math.round(adMetrics.visibility)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Risk Score</div>
                      <div className="text-xl font-bold text-white">{audit.adAnalysis.data.riskAssessment?.overallRiskScore || 0}</div>
                    </div>
                  </div>

                  {/* Additional Ad Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2C2C2C]">
                    {/* Ad Stacking */}
                    <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2C2C2C]">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-gray-300">Ad Stacking</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Overlaps:</span>
                        <span className="text-white font-bold">{audit.adAnalysis?.data?.analysis?.density?.stackedAds?.length || 0}</span>
                      </div>
                    </div>

                    {/* Video Stuffing */}
                    <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2C2C2C]">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-gray-300">Video Detection</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Players:</span>
                        <span className="text-white font-bold">{audit.adAnalysis?.data?.analysis?.video?.metrics?.videoPlayerCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {audit.adAnalysis.data.analysis.patterns && (
                    <div className="pt-4 border-t border-[#2C2C2C]">
                      <div className="text-xs text-gray-400 mb-2">Network Patterns</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Networks Detected:</span>
                          <span className="text-white font-medium">{audit.adAnalysis.data.analysis.patterns.networkAnalysis?.detectedNetworks?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Diversity Score:</span>
                          <span className="text-white font-medium">{audit.adAnalysis.data.analysis.patterns.networkAnalysis?.networkDiversity || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          {/* Technical Check Module */}
          {
            audit.technicalCheck && (
              <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2C2C2C]">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-cyan-400" />
                  Technical Check
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health Score</span>
                    <span className="text-white font-medium">{audit.technicalCheck.technicalHealthScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SSL Score</span>
                    <span className="text-white font-medium">{audit.technicalCheck.components.ssl?.score || 0}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Performance Score</span>
                    <span className="text-white font-medium">{audit.technicalCheck.components.performance?.performanceScore || 0}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Critical Issues</span>
                    <span className="text-red-400">{(audit.technicalCheck.summary?.criticalIssues || []).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Warnings</span>
                    <span className="text-yellow-400">{(audit.technicalCheck.summary?.warnings || []).length}</span>
                  </div>
                </div>
              </div>
            )
          }

          {/* Policy Check Module */}
          {
            audit.policyCheck && (
              <div className="bg-[#1E1E1E] rounded-lg p-5 border border-[#2C2C2C]">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-400" />
                  Policy Check
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compliance Level</span>
                    <span className="text-white font-medium capitalize">{audit.policyCheck.complianceLevel || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Policies Checked</span>
                    <span className="text-white font-medium">{audit.policyCheck.summary?.totalPolicies || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Violations</span>
                    <span className="text-red-400">{audit.policyCheck.summary?.totalViolations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Critical Violations</span>
                    <span className="text-red-400 font-bold">{audit.policyCheck.summary?.criticalViolations || 0}</span>
                  </div>
                </div>
              </div>
            )
          }



          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-[#48a77f] text-white rounded-lg hover:bg-[#3d9166] transition-colors font-medium shadow-lg shadow-[#48a77f]/20"
          >
            Close
          </button>
        </div >
      </div >
    </div >
  );
}

export default function MFABuster() {
  const [audits, setAudits] = useState<SiteAuditResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<SiteAuditResult | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const { showSuccess, showError, showInfo, showWarning } = useNotification();

  const [selectedDirectory, setSelectedDirectory] = useState<{ url: string; data: any } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await SiteAuditResultService.getPublishersWithAudits();
      setAudits(data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAllAudits = async () => {
    try {
      setIsTriggering(true);
      showInfo('Triggering', 'Starting audits for all publishers...');

      const result = await triggerAllAuditsService.triggerAllPublisherAudits();

      if (result.success) {
        showSuccess('Success', `Queued ${result.queuedPublishers} publishers for audit`);
      } else {
        showWarning('Partial Success', `Queued ${result.queuedPublishers}, Failed ${result.failedPublishers}`);
      }
    } catch (err) {
      console.error('Error triggering audits:', err);
      showError('Error', err instanceof Error ? err.message : 'Failed to trigger audits');
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleOpenDirectoryAudit = (e: CustomEvent) => {
      setSelectedDirectory(e.detail);
    };

    window.addEventListener('openDirectoryAudit', handleOpenDirectoryAudit as EventListener);
    return () => {
      window.removeEventListener('openDirectoryAudit', handleOpenDirectoryAudit as EventListener);
    };
  }, []);

  const getRiskStats = () => {
    const stats = {
      total: audits.length,
      low: audits.filter(a => a.riskLevel?.toUpperCase() === 'LOW').length,
      medium: audits.filter(a => a.riskLevel?.toUpperCase() === 'MEDIUM').length,
      high: audits.filter(a => a.riskLevel?.toUpperCase() === 'HIGH').length,
      critical: audits.filter(a => a.riskLevel?.toUpperCase() === 'CRITICAL').length,
      avgScore: audits.length > 0
        ? Math.round(audits.reduce((sum, a) => sum + a.riskScore, 0) / audits.length)
        : 0,
    };
    return stats;
  };

  const stats = getRiskStats();

  if (isLoading) {
    return (
      <div className="space-y-6 min-h-screen flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-[#48a77f]" />
                MFA Buster
              </h1>
              <p className="text-sm text-gray-400">
                Loading audit data...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gradient-to-br from-[#1E1E1E] to-[#161616] rounded-lg border border-[#2C2C2C] p-4">
                <div className="h-3 bg-[#2C2C2C] rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-[#2C2C2C] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 pb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PublisherCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1 flex items-center">
              <Shield className="w-7 h-7 mr-3 text-[#48a77f]" />
              MFA Buster
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleTriggerAllAudits}
              disabled={isTriggering || audits.length === 0}
              className="inline-flex items-center px-4 py-2 border border-[#2C2C2C] rounded-lg text-sm font-medium text-white bg-[#48a77f] hover:bg-[#3d9166] disabled:opacity-50 disabled:bg-gray-700 transition-colors"
            >
              <Zap className={`w-4 h-4 mr-2 ${isTriggering ? 'animate-pulse' : ''}`} />
              {isTriggering ? 'Auditing...' : 'Audit All'}
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-[#2C2C2C] rounded-lg text-sm font-medium text-white bg-[#161616] hover:bg-[#1E1E1E] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="glass-card rounded-lg p-4 flex flex-col justify-between group hover:border-[#48a77f]/50 transition-all duration-300">
            <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Audited</div>
            <div className="text-2xl font-bold text-white group-hover:scale-110 transition-transform origin-left">{stats.total}</div>
          </div>
          <div className="glass-card rounded-lg p-4 flex flex-col justify-between group hover:border-[#48a77f]/50 transition-all duration-300">
            <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Avg Score</div>
            <div className="text-2xl font-bold text-white group-hover:scale-110 transition-transform origin-left">{stats.avgScore}</div>
          </div>
          <div className="glass-card rounded-lg p-4 flex flex-col justify-between group hover:border-[#48a77f]/50 transition-all duration-300">
            <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Low Risk</div>
            <div className="text-2xl font-bold text-[#48a77f] group-hover:scale-110 transition-transform origin-left">{stats.low}</div>
          </div>
          <div className="glass-card rounded-lg p-4 flex flex-col justify-between group hover:border-[#48a77f]/50 transition-all duration-300">
            <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Medium</div>
            <div className="text-2xl font-bold text-[#FFC107] group-hover:scale-110 transition-transform origin-left">{stats.medium}</div>
          </div>
          <div className="glass-card rounded-lg p-4 flex flex-col justify-between group hover:border-[#48a77f]/50 transition-all duration-300">
            <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">High Risk</div>
            <div className="text-2xl font-bold text-[#FF9800] group-hover:scale-110 transition-transform origin-left">{stats.high}</div>
          </div>
          <div className="glass-card rounded-lg p-4 flex flex-col justify-between group hover:border-[#48a77f]/50 transition-all duration-300">
            <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Critical</div>
            <div className="text-2xl font-bold text-[#F44336] group-hover:scale-110 transition-transform origin-left">{stats.critical}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">Error Loading Data</p>
                <p className="text-xs text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 pb-6">
        {audits.map(audit => {
          const style = SiteAuditResultService.getRiskLevelStyle(audit.riskLevel);

          return (
            <div
              key={audit.id}
              className="glass-card rounded-xl overflow-hidden hover:shadow-xl hover:shadow-[#48a77f]/10 transition-all duration-300 cursor-pointer group relative"
              onClick={() => setSelectedAudit(audit)}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#48a77f]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{audit.publisherName}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1">{audit.publisherDomain}</p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-4xl font-bold" style={{ color: style.color }}>
                      {Math.round(audit.riskScore)}
                    </span>
                    <span className="text-sm text-gray-400">/100</span>
                  </div>
                  <div className="w-full bg-[#2C2C2C] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, audit.riskScore))}%`,
                        backgroundColor: style.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      {style.label}
                    </div>
                    <span className="text-xs text-gray-500">{audit.status}</span>
                  </div>
                </div>

                {/* MFA Indicators */}
                <MFAIndicators audit={audit} />

                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-[#2C2C2C] pt-3">
                  <span>{SiteAuditResultService.getTimeAgo(audit.updatedAt)}</span>
                  <span className="text-[#48a77f] font-semibold group-hover:translate-x-1 transition-transform">View details →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {audits.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-[#161616] rounded-lg border border-[#2C2C2C]">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 text-lg font-medium">No audit results yet</p>
          <p className="text-gray-500 text-sm mt-2">Click "Audit All" to run comprehensive site audits</p>
        </div>
      )}

      {selectedAudit && (
        <AuditDetailModal
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}

      <DirectoryAuditModal
        isOpen={!!selectedDirectory}
        onClose={() => setSelectedDirectory(null)}
        url={selectedDirectory?.url || ''}
        data={selectedDirectory?.data}
      />
    </div>
  );
}
