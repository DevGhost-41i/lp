import { useState } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { csvPublisherService, BulkUploadResult, BulkUploadProgress } from '../lib/csvPublisherService';
import { useNotification } from './NotificationContainer';

interface BulkUploadPublisherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
    partnerId: string | null;
    defaultParentMcmId?: string;
}

export default function BulkUploadPublisherModal({
    isOpen,
    onClose,
    onSuccess,
    userId,
    partnerId,
    defaultParentMcmId
}: BulkUploadPublisherModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState<BulkUploadProgress | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const { showSuccess, showError } = useNotification();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.csv')) {
                showError('Invalid File Type', 'Please select a CSV file');
                return;
            }
            setSelectedFile(file);
            setUploadResult(null);
            setUploadProgress(null);
            setValidationErrors([]);
        }
    };

    const handleDownloadTemplate = () => {
        csvPublisherService.downloadTemplate();
        showSuccess('Template Downloaded', 'CSV template has been downloaded');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            showError('No File Selected', 'Please select a CSV file first');
            return;
        }

        setUploading(true);
        setValidationErrors([]);
        setUploadProgress(null);

        try {
            // Parse CSV
            const parsedData = await csvPublisherService.parseCSV(selectedFile);

            // Bulk create publishers with GAM verification
            const result = await csvPublisherService.bulkCreatePublishersWithVerification(
                parsedData,
                userId,
                partnerId,
                defaultParentMcmId,
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            setUploadResult(result);

            if (result.successCount > 0) {
                const queuedMsg = result.queuedCount > 0 ? ` ${result.queuedCount} queued for historical data fetch.` : '';
                const failedMsg = result.failureCount > 0 ? ` ${result.failureCount} failed.` : '';

                showSuccess(
                    'Upload Complete',
                    `Successfully verified and uploaded ${result.successCount} publisher(s).${queuedMsg}${failedMsg}`
                );

                if (result.failureCount === 0) {
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 2000);
                }
            } else {
                showError('Upload Failed', 'All publishers failed. Check errors below.');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setValidationErrors([error.message || 'Failed to process CSV file']);
            showError('Upload Failed', error.message || 'An unexpected error occurred');
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
            setUploadResult(null);
            setUploadProgress(null);
            setValidationErrors([]);
        } else {
            showError('Invalid File Type', 'Please select a CSV file');
        }
    };

    const getPhaseText = (phase: string) => {
        switch (phase) {
            case 'validating': return 'Validating CSV data...';
            case 'verifying': return 'Verifying GAM access...';
            case 'inserting': return 'Creating publishers...';
            case 'queueing': return 'Queueing for data fetch...';
            case 'complete': return 'Complete!';
            default: return 'Processing...';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161616] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#2C2C2C]">
                {/* Header */}
                <div className="sticky top-0 bg-[#161616] border-b border-[#2C2C2C] p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Bulk Upload GAM Accounts</h2>
                        <p className="text-sm text-gray-400 mt-1">Upload CSV with GAM verification (max 50 publishers)</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={uploading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Download Template Button */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1E1E1E] hover:bg-[#2C2C2C] border border-[#2C2C2C] text-white rounded-lg text-sm font-medium transition-colors"
                            disabled={uploading}
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </button>
                    </div>

                    {/* File Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-[#2C2C2C] rounded-lg p-8 text-center hover:border-[#48a77f] transition-colors"
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="csv-upload"
                            disabled={uploading}
                        />
                        <label htmlFor="csv-upload" className={uploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-white font-medium mb-2">
                                {selectedFile ? selectedFile.name : 'Select CSV File or Drag & Drop'}
                            </p>
                            <p className="text-sm text-gray-400">
                                {selectedFile ? 'Click to select a different file' : 'Click to browse or drag a CSV file here'}
                            </p>
                        </label>
                    </div>

                    {/* Progress Indicator */}
                    {uploadProgress && (
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-white">{getPhaseText(uploadProgress.phase)}</span>
                                <span className="text-sm text-gray-400">{uploadProgress.current} / {uploadProgress.total}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-[#0A0A0A] rounded-full h-2 mb-3">
                                <div
                                    className="bg-[#48a77f] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                />
                            </div>

                            {/* Current Publisher */}
                            {uploadProgress.currentPublisher && uploadProgress.phase === 'verifying' && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#48a77f]" />
                                    <span>Verifying: {uploadProgress.currentPublisher}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CSV Format Information */}
                    <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-[#48a77f] mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-white mb-2">CSV Format:</h3>
                                <code className="text-xs text-gray-300 bg-black px-2 py-1 rounded block mb-3">
                                    publisherName, email, siteLink, networkCode, revenueShare, parentNetworkCode, comments
                                </code>

                                <div className="space-y-1 text-xs text-gray-400">
                                    <p><span className="text-white font-medium">Required Fields:</span></p>
                                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                                        <li><strong>publisherName:</strong> Publisher/Company name</li>
                                        <li><strong>email:</strong> Primary contact email</li>
                                        <li><strong>siteLink:</strong> Website URL (e.g., "https://example.com")</li>
                                        <li><strong>networkCode:</strong> Child GAM Network ID (numeric)</li>
                                        <li><strong>revenueShare:</strong> Revenue share % (0-100)</li>
                                    </ul>
                                    <p className="mt-2"><span className="text-white font-medium">Optional Fields:</span></p>
                                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                                        <li><strong>parentNetworkCode:</strong> Parent GAM network code</li>
                                        <li><strong>comments:</strong> Optional notes</li>
                                    </ul>
                                </div>

                                <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                                    <strong>Hybrid Upload:</strong> GAM access verified during upload (~10 sec/publisher). Historical data fetched in background after upload completes.
                                </div>

                                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                                    <strong>Note:</strong> All publishers auto-assigned to you as partner
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-400 mb-2">Validation Errors:</h3>
                                    <ul className="space-y-1 text-xs text-red-300">
                                        {validationErrors.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Result */}
                    {uploadResult && (
                        <div className="space-y-4">
                            {/* Success Summary */}
                            {uploadResult.successCount > 0 && (
                                <div className="bg-[#48a77f]/10 border border-[#48a77f]/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-[#48a77f] mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-[#48a77f] mb-1">
                                                Successfully verified and uploaded {uploadResult.successCount} publisher(s)
                                            </h3>
                                            {uploadResult.queuedCount > 0 && (
                                                <p className="text-xs text-gray-300">
                                                    {uploadResult.queuedCount} publisher(s) queued for 2-month historical data fetch
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Failure Details */}
                            {uploadResult.failureCount > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-red-400 mb-2">
                                                Failed: {uploadResult.failureCount} publisher(s)
                                                {uploadResult.verificationFailureCount > 0 && ` (${uploadResult.verificationFailureCount} GAM verification failures)`}
                                            </h3>
                                            <div className="max-h-40 overflow-y-auto space-y-2">
                                                {uploadResult.failures.map((failure, index) => (
                                                    <div key={index} className="text-xs text-red-300 bg-black/20 p-2 rounded">
                                                        <div className="font-medium flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-red-500/20 rounded text-[10px]">{failure.type.toUpperCase()}</span>
                                                            Row {failure.row}: {failure.data.publisherName}
                                                        </div>
                                                        <div className="text-red-400 mt-1">{failure.error}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-[#2C2C2C]">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-white rounded-lg transition-colors"
                            disabled={uploading}
                        >
                            {uploadResult && uploadResult.successCount > 0 ? 'Close' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-[#48a77f] hover:bg-[#3d9166] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {uploadProgress?.phase === 'verifying' ? 'Verifying GAM...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload & Verify
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
