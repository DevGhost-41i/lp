import { supabase } from './supabase';
import { GAMService } from './gamService';
import { historicalDataQueueService } from './historicalDataQueueService';

export interface PublisherCSVRow {
    publisherName: string;
    email: string;
    siteLink: string;
    networkCode: string;
    revenueShare: string;
    parentNetworkCode?: string;
    comments?: string;
}

export interface ValidationError {
    row: number;
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export interface BulkUploadProgress {
    total: number;
    current: number;
    currentPublisher: string;
    phase: 'validating' | 'verifying' | 'inserting' | 'queueing' | 'complete';
}

export interface BulkUploadResult {
    totalRows: number;
    successCount: number;
    failureCount: number;
  verificat ionFailureCount: number;
queuedCount: number;
failures: Array<{
    row: number;
    data: PublisherCSVRow;
    error: string;
    type: 'validation' | 'verification' | 'insertion' | 'queue';
}>;
}

export type ProgressCallback = (progress: BulkUploadProgress) => void;

class CSVPublisherService {
    /**
     * Generate and download a CSV template file
     */
    downloadTemplate(): void {
        const headers = ['publisherName', 'email', 'siteLink', 'networkCode', 'revenueShare', 'parentNetworkCode', 'comments'];
        const exampleRow = ['Publisher LLC', 'contact@example.com', 'https://example.com', '12345678', '30', '', 'Optional notes'];

        const csvContent = [
            headers.join(','),
            exampleRow.join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'publisher_bulk_upload_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Parse CSV file and return array of publisher rows
     */
    async parseCSV(file: File): Promise<PublisherCSVRow[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());

                    if (lines.length < 2) {
                        reject(new Error('CSV file is empty or has no data rows'));
                        return;
                    }

                    const headers = lines[0].split(',').map(h => h.trim());

                    // Validate headers
                    const requiredHeaders = ['publisherName', 'email', 'siteLink', 'networkCode', 'revenueShare'];
                    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                    if (missingHeaders.length > 0) {
                        reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
                        return;
                    }

                    const rows: PublisherCSVRow[] = [];

                    for (let i = 1; i < lines.length; i++) {
                        const values = this.parseCSVLine(lines[i]);

                        if (values.length === 0) continue; // Skip empty lines

                        const row: any = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index]?.trim() || '';
                        });

                        rows.push(row as PublisherCSVRow);
                    }

                    if (rows.length === 0) {
                        reject(new Error('No valid data rows found in CSV'));
                        return;
                    }

                    if (rows.length > 50) {
                        reject(new Error('Maximum 50 publishers per upload. Please split your file into smaller batches.'));
                        return;
                    }

                    resolve(rows);
                } catch (error: any) {
                    reject(new Error(`Failed to parse CSV: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Parse a single CSV line, handling quoted values
     */
    private parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }

    /**
     * Validate a single publisher row
     */
    validatePublisherRow(row: PublisherCSVRow, rowNumber: number): ValidationResult {
        const errors: ValidationError[] = [];

        // Required field validation
        if (!row.publisherName || row.publisherName.trim() === '') {
            errors.push({ row: rowNumber, field: 'publisherName', message: 'Publisher name is required' });
        }

        if (!row.email || row.email.trim() === '') {
            errors.push({ row: rowNumber, field: 'email', message: 'Email is required' });
        } else if (!this.isValidEmail(row.email)) {
            errors.push({ row: rowNumber, field: 'email', message: 'Invalid email format' });
        }

        if (!row.siteLink || row.siteLink.trim() === '') {
            errors.push({ row: rowNumber, field: 'siteLink', message: 'Site link is required' });
        } else if (!this.isValidURL(row.siteLink)) {
            errors.push({ row: rowNumber, field: 'siteLink', message: 'Invalid URL format' });
        }

        if (!row.networkCode || row.networkCode.trim() === '') {
            errors.push({ row: rowNumber, field: 'networkCode', message: 'Network code is required' });
        } else if (!this.isValidNetworkCode(row.networkCode)) {
            errors.push({ row: rowNumber, field: 'networkCode', message: 'Network code must be numeric' });
        }

        if (!row.revenueShare || row.revenueShare.trim() === '') {
            errors.push({ row: rowNumber, field: 'revenueShare', message: 'Revenue share is required' });
        } else {
            const revenueShare = parseFloat(row.revenueShare);
            if (isNaN(revenueShare) || revenueShare < 0 || revenueShare > 100) {
                errors.push({ row: rowNumber, field: 'revenueShare', message: 'Revenue share must be between 0 and 100' });
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL format
     */
    private isValidURL(url: string): boolean {
        try {
            // Add protocol if missing
            const urlToTest = url.startsWith('http') ? url : `https://${url}`;
            new URL(urlToTest);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate network code (should be numeric)
     */
    private isValidNetworkCode(code: string): boolean {
        return /^\d+$/.test(code.trim());
    }

    /**
     * Extract domain from URL
     */
    private extractDomain(url: string): string {
        try {
            const urlToTest = url.startsWith('http') ? url : `https://${url}`;
            const parsedUrl = new URL(urlToTest);
            return parsedUrl.hostname.replace(/^www\./, '');
        } catch {
            // Fallback: remove protocol and www
            return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        }
    }

    /**
     * Bulk create publishers from CSV data with GAM verification
     */
    async bulkCreatePublishersWithVerification(
        publishers: PublisherCSVRow[],
        userId: string,
        partnerId: string | null,
        defaultParentMcmId?: string,
        onProgress?: ProgressCallback
    ): Promise<BulkUploadResult> {
        const result: BulkUploadResult = {
            totalRows: publishers.length,
            successCount: 0,
            failureCount: 0,
            verificationFailureCount: 0,
            queuedCount: 0,
            failures: []
        };

        // Phase 1: Validate all rows
        onProgress?.({ total: publishers.length, current: 0, currentPublisher: '', phase: 'validating' });

        const validatedRows: Array<{ row: PublisherCSVRow; rowNumber: number }> = [];

        for (let i = 0; i < publishers.length; i++) {
            const validation = this.validatePublisherRow(publishers[i], i + 2);

            if (!validation.valid) {
                result.failureCount++;
                result.failures.push({
                    row: i + 2,
                    data: publishers[i],
                    error: validation.errors.map(e => `${e.field}: ${e.message}`).join(', '),
                    type: 'validation'
                });
            } else {
                validatedRows.push({ row: publishers[i], rowNumber: i + 2 });
            }
        }

        // Get parent MCM mapping
        const parentMcmMap = new Map<string, string>();
        const { data: parentMcms, error: mcmError } = await supabase
            .from('mcm_parents')
            .select('id, parent_network_code')
            .eq('status', 'active');

        if (!mcmError && parentMcms) {
            parentMcms.forEach((mcm: any) => {
                parentMcmMap.set(mcm.parent_network_code, mcm.id);
            });
        }

        // Phase 2: Verify GAM access and insert
        const verifiedPublishers: Array<{ publisherId: string; rowData: PublisherCSVRow }> = [];

        for (let i = 0; i < validatedRows.length; i++) {
            const { row, rowNumber } = validatedRows[i];

            onProgress?.({
                total: publishers.length,
                current: i + 1,
                currentPublisher: row.publisherName,
                phase: 'verifying'
            });

            try {
                // Verify GAM access
                const verification = await GAMService.verifyServiceAccountAccess(row.networkCode);

                if (verification.status !== 'active') {
                    result.failureCount++;
                    result.verificationFailureCount++;
                    result.failures.push({
                        row: rowNumber,
                        data: row,
                        error: `GAM verification failed: ${verification.error || 'Unauthorized access'}`,
                        type: 'verification'
                    });
                    continue;
                }

                // Determine parent MCM ID
                let parentMcmId = defaultParentMcmId;
                if (row.parentNetworkCode && row.parentNetworkCode.trim()) {
                    const mappedId = parentMcmMap.get(row.parentNetworkCode.trim());
                    if (mappedId) {
                        parentMcmId = mappedId;
                    }
                }

                // Insert publisher
                const { data: publisherData, error: insertError } = await supabase
                    .from('publishers')
                    .insert({
                        name: row.publisherName.trim(),
                        domain: this.extractDomain(row.siteLink),
                        contact_email: row.email.trim(),
                        network_code: row.networkCode.trim(),
                        revenue_share: parseFloat(row.revenueShare),
                        mcm_parent_id: parentMcmId,
                        notes: row.comments?.trim() || null,
                        gam_status: 'pending',
                        service_key_status: 'verified',
                        service_key_verified_at: new Date().toISOString(),
                        data_fetch_status: 'pending',
                        created_by: userId,
                        partner_id: partnerId
                    })
                    .select()
                    .single();

                if (insertError) {
                    result.failureCount++;
                    result.failures.push({
                        row: rowNumber,
                        data: row,
                        error: insertError.message || 'Failed to insert publisher',
                        type: 'insertion'
                    });
                } else if (publisherData) {
                    result.successCount++;
                    verifiedPublishers.push({ publisherId: publisherData.id, rowData: row });
                }
            } catch (error: any) {
                result.failureCount++;
                result.failures.push({
                    row: rowNumber,
                    data: row,
                    error: error.message || 'Unexpected error during processing',
                    type: 'verification'
                });
            }
        }

        // Phase 3: Queue for historical data fetch
        onProgress?.({
            total: publishers.length,
            current: publishers.length,
            currentPublisher: '',
            phase: 'queueing'
        });

        for (const { publisherId, rowData } of verifiedPublishers) {
            try {
                await historicalDataQueueService.queuePublisher(publisherId);
                result.queuedCount++;
            } catch (error: any) {
                result.failures.push({
                    row: 0,
                    data: rowData,
                    error: `Failed to queue for data fetch: ${error.message}`,
                    type: 'queue'
                });
            }
        }

        onProgress?.({
            total: publishers.length,
            current: publishers.length,
            currentPublisher: '',
            phase: 'complete'
        });

        return result;
    }
}

export const csvPublisherService = new CSVPublisherService();
