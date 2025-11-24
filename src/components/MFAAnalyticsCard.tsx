import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

interface MFAAnalytics {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  average_score: number;
}

export default function MFAAnalyticsCard() {
  const [mfaStats, setMfaStats] = useState<MFAAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMFAAnalytics();
  }, []);

  const fetchMFAAnalytics = async () => {
    try {
      const { data: audits, error } = await supabase
        .from('site_audits')
        .select('mfa_probability, publisher_id')
        .not('mfa_probability', 'is', null);

      if (error) throw error;

      if (!audits || audits.length === 0) {
        setMfaStats(null);
        setLoading(false);
        return;
      }

      const stats = {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        average_score: 0,
      };

      let totalScore = 0;
      audits.forEach((audit) => {
        const scoreValue = typeof audit.mfa_probability === 'number'
          ? audit.mfa_probability * 100
          : (parseFloat(audit.mfa_probability) || 0) * 100;
        totalScore += scoreValue;

        if (scoreValue >= 80) stats.excellent++;
        else if (scoreValue >= 60) stats.good++;
        else if (scoreValue >= 40) stats.fair++;
        else stats.poor++;
      });

      stats.average_score = audits.length > 0 ? totalScore / audits.length : 0;

      setMfaStats(stats);
    } catch (error) {
      console.error('Error fetching MFA analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-[#2C2C2C] rounded-xl"></div>
      </div>
    );
  }

  if (!mfaStats) {
    return (
      <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center h-64">
        <div className="p-3 bg-gray-800/50 rounded-full mb-3">
          <AlertCircle className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-300 mb-1">MFA Security Posture</h3>
        <p className="text-xs text-gray-500">No MFA data available</p>
      </div>
    );
  }

  const total = mfaStats.excellent + mfaStats.good + mfaStats.fair + mfaStats.poor;
  const excellentPct = total > 0 ? (mfaStats.excellent / total) * 100 : 0;
  const goodPct = total > 0 ? (mfaStats.good / total) * 100 : 0;
  const fairPct = total > 0 ? (mfaStats.fair / total) * 100 : 0;
  const poorPct = total > 0 ? (mfaStats.poor / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-300">Average MFA Score</p>
          <span className={`text-2xl font-bold ${mfaStats.average_score >= 80 ? 'text-green-400' :
              mfaStats.average_score >= 60 ? 'text-blue-400' :
                mfaStats.average_score >= 40 ? 'text-yellow-400' :
                  'text-red-400'
            }`}>
            {mfaStats.average_score.toFixed(1)}
          </span>
        </div>
        <div className="w-full bg-[#2C2C2C] rounded-full h-2.5 overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ease-out relative ${mfaStats.average_score >= 80 ? 'bg-green-500' :
                mfaStats.average_score >= 60 ? 'bg-blue-500' :
                  mfaStats.average_score >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
              }`}
            style={{ width: `${mfaStats.average_score}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-lg p-3 border-l-2 border-green-500">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs text-gray-400">Excellent</span>
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          </div>
          <p className="text-lg font-bold text-white">{mfaStats.excellent}</p>
          <div className="w-full bg-[#2C2C2C] h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: `${excellentPct}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-lg p-3 border-l-2 border-blue-500">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs text-gray-400">Good</span>
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-white">{mfaStats.good}</p>
          <div className="w-full bg-[#2C2C2C] h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${goodPct}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-lg p-3 border-l-2 border-yellow-500">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs text-gray-400">Fair</span>
            <AlertCircle className="w-3 h-3 text-yellow-500" />
          </div>
          <p className="text-lg font-bold text-white">{mfaStats.fair}</p>
          <div className="w-full bg-[#2C2C2C] h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${fairPct}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-lg p-3 border-l-2 border-red-500">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs text-gray-400">Poor</span>
            <TrendingDown className="w-3 h-3 text-red-500" />
          </div>
          <p className="text-lg font-bold text-white">{mfaStats.poor}</p>
          <div className="w-full bg-[#2C2C2C] h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full" style={{ width: `${poorPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
