import { X, Globe, Activity, FileText, Shield, AlertTriangle, CheckCircle, Server } from 'lucide-react'

interface DirectoryAuditModalProps {
    isOpen: boolean
    onClose: () => void
    url: string
    data: any
}

export default function DirectoryAuditModal({ isOpen, onClose, url, data }: DirectoryAuditModalProps) {
    if (!isOpen) return null

    const adAnalyzer = data?.['ad-analyzer']
    const contentAnalyzer = data?.['content-analyzer']
    const policyChecker = data?.['policy-checker']
    const technicalChecker = data?.['technical-checker'] // Assuming this key exists or will exist

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-[#1E1E1E] rounded-xl w-full max-w-4xl border border-[#2C2C2C] shadow-2xl max-h-[90vh] flex flex-col">
                <div className="sticky top-0 z-10 bg-[#1E1E1E] border-b border-[#2C2C2C] p-6 flex items-center justify-between rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[#48a77f]" />
                            Directory Audit Details
                        </h2>
                        <p className="text-sm text-gray-400 mt-1 font-mono">{url}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2C2C2C] rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* Ad Analysis Section */}
                    <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Ad Analysis
                        </h3>
                        {adAnalyzer?.data ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                    <div className="text-sm text-gray-400 mb-1">Ad Density</div>
                                    <div className="text-xl font-bold text-white">
                                        {adAnalyzer.data.analysis?.density?.metrics?.adDensity ? `${adAnalyzer.data.analysis.density.metrics.adDensity.toFixed(1)}%` : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                    <div className="text-sm text-gray-400 mb-1">Ad Count</div>
                                    <div className="text-xl font-bold text-white">
                                        {adAnalyzer.data.analysis?.density?.metrics?.totalAdPixels ? Math.round(adAnalyzer.data.analysis.density.metrics.totalAdPixels / 10000) : 0} {/* Approximation */}
                                    </div>
                                </div>
                                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                    <div className="text-sm text-gray-400 mb-1">Refresh Rate</div>
                                    <div className="text-xl font-bold text-white">
                                        {adAnalyzer.data.analysis?.autoRefresh?.summary?.criticalRefreshCount > 0
                                            ? 'Critical'
                                            : 'Normal'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No ad analysis data available</p>
                        )}
                    </div>

                    {/* Content Analysis Section */}
                    <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-400" />
                            Content Analysis
                        </h3>
                        {contentAnalyzer?.data ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                        <div className="text-sm text-gray-400 mb-1">Readability</div>
                                        <div className="text-white font-medium capitalize">
                                            {contentAnalyzer.data.readability?.readabilityLevel?.replace('_', ' ') || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                        <div className="text-sm text-gray-400 mb-1">Text Length</div>
                                        <div className="text-white font-medium">
                                            {contentAnalyzer.data.textLength || 0} chars
                                        </div>
                                    </div>
                                </div>

                                {contentAnalyzer.data.riskAssessment?.detectedRisks && contentAnalyzer.data.riskAssessment.detectedRisks.length > 0 && (
                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Detected Risks</div>
                                        <div className="flex flex-wrap gap-2">
                                            {contentAnalyzer.data.riskAssessment.detectedRisks.map((risk: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-[#2C2C2C] text-gray-300 text-xs rounded-md border border-gray-700 capitalize">
                                                    {risk.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No content analysis data available</p>
                        )}
                    </div>

                    {/* Policy Violations Section */}
                    <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-400" />
                            Policy Check
                        </h3>
                        {policyChecker?.data?.violations && policyChecker.data.violations.length > 0 ? (
                            <div className="space-y-3">
                                {policyChecker.data.violations.map((violation: any, idx: number) => (
                                    <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-red-400 font-medium text-sm">{violation.policy || 'Policy Violation'}</div>
                                            <div className="text-gray-400 text-xs mt-1">{violation.description || violation.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-[#48a77f] bg-[#48a77f]/10 p-4 rounded-lg border border-[#48a77f]/20">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">No policy violations detected</span>
                            </div>
                        )}
                    </div>

                    {/* Technical Details Section */}
                    {technicalChecker?.data && (
                        <div className="bg-[#161616] rounded-xl p-6 border border-[#2C2C2C]">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Server className="w-5 h-5 text-orange-400" />
                                Technical Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                    <div className="text-sm text-gray-400 mb-1">Health Score</div>
                                    <div className="text-xl font-bold text-white">
                                        {technicalChecker.data.technicalHealthScore || 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                    <div className="text-sm text-gray-400 mb-1">Performance</div>
                                    <div className="text-xl font-bold text-white">
                                        {technicalChecker.data.components?.performance?.performanceScore || 0}/100
                                    </div>
                                </div>
                                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2C2C2C]">
                                    <div className="text-sm text-gray-400 mb-1">Total Issues</div>
                                    <div className="text-xl font-bold text-white">
                                        {technicalChecker.data.summary?.totalIssues || 0}
                                    </div>
                                </div>
                            </div>
                            {technicalChecker.data.summary?.criticalIssues && technicalChecker.data.summary.criticalIssues.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                        Critical Issues
                                    </h4>
                                    <div className="bg-black/50 rounded-lg p-3 border border-[#2C2C2C] font-mono text-xs text-red-400 max-h-40 overflow-y-auto">
                                        {technicalChecker.data.summary.criticalIssues.map((err: string, idx: number) => (
                                            <div key={idx} className="mb-1 last:mb-0 border-b border-[#2C2C2C] last:border-0 pb-1 last:pb-0">
                                                {err}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                <div className="border-t border-[#2C2C2C] p-6 flex justify-end bg-[#1E1E1E] rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[#2C2C2C] hover:bg-[#3C3C3C] text-white rounded-lg transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
