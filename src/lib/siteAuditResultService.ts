import { supabase } from './supabase';

export interface ContentAnalysis {
  textLength: number;
  analysisTimestamp: string;
  entropy: {
    entropyScore: number;
    isLowEntropy: boolean;
    contentLength: number;
    flagStatus: string;
  };
  similarity: {
    simhashFingerprint: string;
    contentHash: string;
    tokenCount: number;
  };
  readability: {
    readabilityScore: number;
    gradeLevel: number;
    readabilityLevel: string;
    humanAuthorshipLikelihood: boolean;
  };
  ai: {
    aiLikelihood: boolean;
    aiScore: number;
    aiIndicators: any[];
    aiConfidence: number;
  };
  clickbait: {
    clickbaitScore: number;
    isClickbait: boolean;
    clickbaitPatterns: any[];
    clickbaitRiskLevel: string;
  };
  freshness: {
    contentFreshness: string;
    daysOld: number | null;
    lastUpdatedDate: string | null;
    stalenessIndicator: boolean;
  };
  riskAssessment: {
    detectedRisks: string[];
    totalRiskScore: number;
    riskLevel: string;
    recommendedAction: string;
  };
  flagStatus: string;
  qualityScore?: number;
  aiMetrics?: {
    aiLikelihood: number;
  };
}

export interface AdAnalysis {
  success: boolean;
  data: {
    timestamp: string;
    metadata: any;
    analysis: {
      patterns: {
        networkAnalysis: {
          detectedNetworks: string[];
          networkDiversity: number;
          suspiciousPatterns: any[];
        };
        mfaIndicators: {
          riskScore: number;
        };
        anomalies: any[];
      };
      autoRefresh: {
        summary: {
          autoRefreshDetected: boolean;
          criticalRefreshCount: number;
          warningRefreshCount: number;
        };
        detectedPatterns: any[];
        intervals: any[];
        affectedSlots: number;
      };
      visibility: {
        summary: {
          complianceStatus: string;
        };
        metrics: {
          visiblePercentage: number;
          visibleCount: number;
          hiddenCount: number;
        };
      };
      density: {
        summary: {
          complianceStatus: string;
          mfaIndicator: boolean;
        };
        metrics: {
          adDensity: number;
          totalViewportPixels: number;
          totalAdPixels: number;
        };
        problems: any[];
        stackedAds?: any[];
      };
      video: {
        summary: {
          riskScore: number;
          videoStuffingDetected: boolean;
        };
        metrics: {
          videoPlayerCount: number;
          autoplayCount: number;
          videoPlayers: any[];
        };
        recommendations?: string[];
      };
    };
    correlations: any[];
    riskAssessment: {
      overallRiskScore: number;
      factors: any;
      riskLevel: string;
      recommendations: string[];
    };
    adElements: any[];
  };
}

export interface PolicyCheck {
  timestamp: string;
  domain: string;
  jurisdiction: {
    primaryJurisdiction: string;
    signals: any;
  };
  violations: {
    policy: string;
    policyName: string;
    severity: string;
    type: string;
    keywords?: string[];
    category?: string;
    confidence?: number;
  }[];
  complianceLevel: string;
  policies: any;
  summary: {
    complianceLevel: string;
    totalPolicies: number;
    compliantPolicies: number;
    violatingPolicies: number;
    totalViolations: number;
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
    jurisdiction: string;
    violations: any[];
    recommendations: string[];
    policyStatus: any;
  };
  executionTime: number;
  totalPoliciesChecked?: number;
  totalViolations?: number;
  criticalViolations?: number;
}

export interface TechnicalCheck {
  timestamp: string;
  domain: string;
  components: {
    ssl: {
      valid: boolean;
      error?: string;
      score: number;
      warnings?: string[];
    };
    performance: {
      performanceScore: number;
      recommendations?: string[];
    };
    adsTxt: {
      found: boolean;
      valid: boolean;
      score: number;
      error?: string;
      skipped?: boolean;
      summary?: {
        invalidEntries: number;
      };
    };
    brokenLinks: {
      brokenCount: number;
      score: number;
      error?: string;
    };
    domainIntel: {
      severity?: string;
      riskFlags?: string[];
    };
    viewportOcclusion: {
      mfaLikelihood?: string;
      occlusionPercentage: number;
      reasoning?: string;
    };
  };
  technicalHealthScore: number;
  summary: {
    totalIssues: number;
    criticalIssues: string[];
    warnings: string[];
    recommendations: string[];
    componentStatus: any;
  };
  executionTime: number;
  sslScore?: number;
  performanceScore?: number;
}

export interface ScorerResult {
  auditId: string;
  publisherId: string;
  riskScore: number;
  mfaProbability: number;
  scores: any;
  trend: any;
  benchmarks: any;
  patternDrift: any;
}

export interface AIAssistanceResult {
  llmResponse: string;
  interpretation: {
    rawResponse: string;
    modules: any[];
    summary?: string;
    categorization?: {
      primaryCategory: string;
      confidence: number;
    };
  };
  timestamp: string;
  metadata: any;
  error?: string;
  status?: string;
}

export interface SiteAuditResult {
  id: string;
  publisherId: string;
  siteName: string;
  status: string;
  riskScore: number;
  crawlerData: any;
  contentAnalysis: ContentAnalysis | null;
  adAnalysis: AdAnalysis | null;
  policyCheck: PolicyCheck | null;
  technicalCheck: TechnicalCheck | null;
  aiReport: AIAssistanceResult | null;
  mfaProbability: number;
  mfaScore: number;
  riskLevel: string;
  createdAt: string;
  updatedAt: string;
  publisherName: string;
  publisherDomain: string;
  isDirectory?: boolean;
  directoryData?: any;
}

export class SiteAuditResultService {
  static async getLatestAuditForPublisher(publisherId: string): Promise<SiteAuditResult | null> {
    try {
      const { data, error } = await supabase
        .from('site_audits')
        .select(`
          id,
          publisher_id,
          site_name,
          status,
          risk_score,
          mfa_probability,
          risk_level,
          crawler_data,
          content_analysis,
          ad_analysis,
          policy_check,
          technical_check,
          ai_report,
          raw_results,
          is_directory,
          directory_data,
          created_at,
          updated_at
        `)
        .eq('publisher_id', publisherId)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const publisher = await this.getPublisherInfo(publisherId);

      return {
        id: data.id,
        publisherId: data.publisher_id,
        siteName: data.site_name,
        status: data.status,
        riskScore: (data.risk_score || 0) * 100,
        crawlerData: data.crawler_data,
        contentAnalysis: data.content_analysis,
        adAnalysis: data.ad_analysis,
        policyCheck: data.policy_check,
        technicalCheck: data.technical_check,
        aiReport: data.ai_report,
        mfaProbability: data.mfa_probability || 0,
        mfaScore: (data.risk_score || 0) * 100,
        riskLevel: data.risk_level || this.getRiskLevel((data.risk_score || 0) * 100),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publisherName: publisher?.name || 'Unknown',
        publisherDomain: publisher?.domain || '',
        isDirectory: data.is_directory || false,
        directoryData: data.directory_data || null,
      };
    } catch (error) {
      console.error('Error fetching latest audit:', error);
      return null;
    }
  }

  static async getPublishersWithAudits(): Promise<SiteAuditResult[]> {
    try {
      const { data: publishers, error: publishersError } = await supabase
        .from('publishers')
        .select('id, name, domain');

      if (publishersError) throw publishersError;

      const auditPromises = (publishers || []).map(pub =>
        this.getLatestAuditForPublisher(pub.id).then(audit => audit || null)
      );

      const audits = await Promise.all(auditPromises);
      return audits.filter((audit): audit is SiteAuditResult => audit !== null);
    } catch (error) {
      console.error('Error fetching publishers with audits:', error);
      return [];
    }
  }

  static async getPublisherInfo(publisherId: string): Promise<{ name: string; domain: string } | null> {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('name, domain')
        .eq('id', publisherId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching publisher info:', error);
      return null;
    }
  }

  static getRiskLevel(score: number): string {
    if (score <= 29) return 'LOW';
    if (score <= 49) return 'MEDIUM';
    if (score <= 74) return 'HIGH';
    return 'CRITICAL';
  }

  static getRiskLevelStyle(riskLevel: string) {
    const level = riskLevel?.toUpperCase() || 'UNKNOWN';
    switch (level) {
      case 'LOW':
        return { label: 'Low Risk', color: '#48a77f', bg: 'rgba(72, 167, 127, 0.1)' };
      case 'MEDIUM':
        return { label: 'Medium Risk', color: '#FFC107', bg: 'rgba(255, 193, 7, 0.1)' };
      case 'HIGH':
        return { label: 'High Risk', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.1)' };
      case 'CRITICAL':
        return { label: 'Critical Risk', color: '#F44336', bg: 'rgba(244, 67, 54, 0.1)' };
      default:
        return { label: 'Unknown', color: '#999', bg: 'rgba(153, 153, 153, 0.1)' };
    }
  }

  static extractIssuesFromAiReport(aiReport: AIAssistanceResult | null): string[] {
    if (!aiReport) return [];

    const issues: string[] = [];

    if (aiReport.interpretation?.modules && typeof aiReport.interpretation.modules === 'object') {
      // Handle both array and object formats for modules
      const modules = Array.isArray(aiReport.interpretation.modules)
        ? aiReport.interpretation.modules
        : Object.values(aiReport.interpretation.modules);

      modules.forEach((module: any) => {
        // Extract from 'issues'
        if (module.issues && Array.isArray(module.issues)) {
          issues.push(...module.issues);
        }

        // Extract from 'found' (worker output)
        if (module.found && Array.isArray(module.found)) {
          issues.push(...module.found);
        }

        // Extract from 'cause' (worker output)
        if (module.cause && Array.isArray(module.cause)) {
          issues.push(...module.cause);
        }
      });
    }

    if (aiReport.llmResponse && typeof aiReport.llmResponse === 'string') {
      const issuesMatch = aiReport.llmResponse.match(/found\(issues:\[(.*?)\]\)/);
      if (issuesMatch) {
        const issuesStr = issuesMatch[1];
        const matches = issuesStr.match(/"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const cleaned = match.replace(/"/g, '');
            if (cleaned && !issues.includes(cleaned)) {
              issues.push(cleaned);
            }
          });
        }
      }
    }

    // Deduplicate and slice
    return [...new Set(issues)].slice(0, 10);
  }

  static extractFixesFromAiReport(aiReport: AIAssistanceResult | null): string[] {
    if (!aiReport) return [];

    const fixes: string[] = [];

    if (aiReport.interpretation?.modules && typeof aiReport.interpretation.modules === 'object') {
      // Handle both array and object formats for modules
      const modules = Array.isArray(aiReport.interpretation.modules)
        ? aiReport.interpretation.modules
        : Object.values(aiReport.interpretation.modules);

      modules.forEach((module: any) => {
        if (module.fixes && Array.isArray(module.fixes)) {
          fixes.push(...module.fixes);
        } else if (module.fix && Array.isArray(module.fix)) {
          fixes.push(...module.fix);
        }
      });
    }

    if (aiReport.llmResponse && typeof aiReport.llmResponse === 'string') {
      const fixMatch = aiReport.llmResponse.match(/fix\(\["([^"]*)"(?:,\s*"([^"]*))*\]/g) ||
        aiReport.llmResponse.match(/fix\(\[([^\]]+)\]\)/g);
      if (fixMatch) {
        fixMatch.forEach(match => {
          const cleaned = match.replace(/fix\(\[|\]\)/g, '').replace(/"/g, '').split(',');
          cleaned.forEach(item => {
            const trimmed = item.trim();
            if (trimmed && !fixes.includes(trimmed)) {
              fixes.push(trimmed);
            }
          });
        });
      }
    }

    // Deduplicate and slice
    return [...new Set(fixes)].slice(0, 10);
  }

  static getTechnicalScore(technicalCheck: TechnicalCheck | null): number {
    return technicalCheck?.technicalHealthScore || 0;
  }

  static getAdMetrics(adAnalysis: AdAnalysis | null) {
    if (!adAnalysis?.data?.analysis) return { density: 0, refresh: 0, visibility: 0 };
    return {
      density: adAnalysis.data.analysis.density?.metrics?.adDensity || 0,
      refresh: adAnalysis.data.analysis.autoRefresh?.summary?.criticalRefreshCount > 0 ? 100 : 0, // Simplified logic
      visibility: adAnalysis.data.analysis.visibility?.metrics?.visiblePercentage || 0,
    };
  }

  static getContentMetrics(contentAnalysis: ContentAnalysis | null) {
    if (!contentAnalysis) return { entropy: 0, readability: 0, freshness: 0 };
    return {
      entropy: contentAnalysis.entropy?.entropyScore || 0,
      readability: contentAnalysis.readability?.readabilityScore || 0,
      freshness: contentAnalysis.freshness?.daysOld ? Math.max(0, 100 - contentAnalysis.freshness.daysOld) : 0, // Approximate score
    };
  }

  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  }

  static getTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'N/A';
    }
  }
}
