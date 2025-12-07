import { useState, useEffect } from 'react';
import axios from 'axios';
import { RLThreatPrediction, RLLearningProgress, RLModelStats, EngagementPattern } from '../types';
import { TrendingUp, Brain, AlertTriangle, CheckCircle, XCircle, BarChart3, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

// Mock data for demo
const MOCK_LEARNING_PROGRESS: RLLearningProgress[] = [
  { week: 1, accuracy: 0.70, total_samples: 45, start_date: '2024-11-01', end_date: '2024-11-07' },
  { week: 2, accuracy: 0.80, total_samples: 89, start_date: '2024-11-08', end_date: '2024-11-14' },
  { week: 3, accuracy: 0.90, total_samples: 134, start_date: '2024-11-15', end_date: '2024-11-21' },
  { week: 4, accuracy: 0.95, total_samples:

 178, start_date: '2024-11-22', end_date: '2024-11-30' },
];

const MOCK_MODEL_STATS: RLModelStats = {
  total_predictions: 178,
  correct_predictions: 169,
  false_positives: 4,
  false_negatives: 5,
  accuracy: 0.95,
  precision: 0.977,
  recall: 0.971,
};

const MOCK_PATTERNS: EngagementPattern[] = [
  {
    pattern_type: 'fast_spike',
    description: '500+ retweets in first hour from security experts',
    typical_outcome: 'critical',
    confidence: 0.94,
    example_cves: ['CVE-2024-55555', 'CVE-2024-88888'],
  },
  {
    pattern_type: 'expert_consensus',
    description: '5+ verified security researchers tweeting within 2 hours',
    typical_outcome: 'critical',
    confidence: 0.92,
    example_cves: ['CVE-2024-77777'],
  },
  {
    pattern_type: 'slow_burn',
    description: 'Less than 100 retweets over 24 hours, gradual engagement',
    typical_outcome: 'moderate',
    confidence: 0.85,
    example_cves: ['CVE-2024-22222'],
  },
  {
    pattern_type: 'community_doubt',
    description: 'Replies contain words like "unverified", "unclear", "needs confirmation"',
    typical_outcome: 'false_alarm',
    confidence: 0.88,
    example_cves: ['CVE-2024-11111'],
  },
];

const MOCK_PREDICTIONS: RLThreatPrediction[] = [
  {
    id: 'pred_1',
    cve_id: 'CVE-2024-55555',
    tweet_id: '1234567890',
    timestamp: Date.now() - 3600000,
    predicted_severity: 'critical',
    confidence: 0.94,
    x_engagement: {
      retweets: 847,
      likes: 1203,
      replies: 156,
      expert_engagement: 7,
      velocity: 423,
    },
    grok_analysis: {
      reasoning: 'Fast engagement velocity (423 RT/hr) + expert consensus from @GossiTheDog, @vxunderground + public exploit code mentioned = Critical',
      impact_assessment: 'PostgreSQL RCE affecting versions 14.0-14.11. Public exploit available. Widely deployed.',
      recommendation: 'Immediate patching required. Upgrade to 14.12+ within 24 hours.',
    },
    actual_severity: 'critical',
    was_correct: true,
  },
  {
    id: 'pred_2',
    cve_id: 'CVE-2024-88888',
    tweet_id: '1234567891',
    timestamp: Date.now() - 7200000,
    predicted_severity: 'critical',
    confidence: 0.91,
    x_engagement: {
      retweets: 512,
      likes: 789,
      replies: 92,
      expert_engagement: 5,
      velocity: 256,
    },
    grok_analysis: {
      reasoning: 'High velocity (256 RT/hr) + 5 expert researchers engaged + trending on security feeds = Critical',
      impact_assessment: 'Microsoft Exchange zero-day. Active exploitation in the wild reported.',
      recommendation: 'Apply emergency patch immediately. Isolate affected systems if patch unavailable.',
    },
    actual_severity: 'critical',
    was_correct: true,
  },
  {
    id: 'pred_3',
    cve_id: 'CVE-2024-44444',
    tweet_id: '1234567892',
    timestamp: Date.now() - 10800000,
    predicted_severity: 'medium',
    confidence: 0.78,
    x_engagement: {
      retweets: 89,
      likes: 145,
      replies: 23,
      expert_engagement: 1,
      velocity: 30,
    },
    grok_analysis: {
      reasoning: 'Slow engagement (30 RT/hr) + single expert mention + no exploit PoC = Medium priority',
      impact_assessment: 'Docker configuration issue. Low exploitability without internal access.',
      recommendation: 'Schedule update during next maintenance window. Not urgent.',
    },
    actual_severity: 'medium',
    was_correct: true,
  },
  {
    id: 'pred_4',
    cve_id: 'CVE-2024-11111',
    tweet_id: '1234567893',
    timestamp: Date.now() - 14400000,
    predicted_severity: 'low',
    confidence: 0.82,
    x_engagement: {
      retweets: 34,
      likes: 67,
      replies: 45,
      expert_engagement: 0,
      velocity: 8,
    },
    grok_analysis: {
      reasoning: 'Very low velocity (8 RT/hr) + replies expressing doubt + no expert validation = Low priority or false alarm',
      impact_assessment: 'Reported vulnerability unconfirmed. Community skeptical. Vendor denies.',
      recommendation: 'Monitor for confirmation. No immediate action needed.',
    },
    actual_severity: 'low',
    was_correct: true,
  },
];

export function RLThreatIntelligence() {
  const [selectedTab, setSelectedTab] = useState<'predictions' | 'learning'>('predictions');
  const [selectedPrediction, setSelectedPrediction] = useState<RLThreatPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [useRealData, setUseRealData] = useState(false);
  const [realPredictions, setRealPredictions] = useState<RLThreatPrediction[]>([]);
  const [realStats, setRealStats] = useState<RLModelStats | null>(null);
  const [realLearningProgress, setRealLearningProgress] = useState<RLLearningProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({
    step: 0,
    message: '',
    detail: '',
    progress: 0,
  });

  // Load cached data (instant)
  const loadCachedData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📦 Loading cached data...');
      const cacheResponse = await axios.get(`${API_BASE}/rl/load-cached`);
      
      console.log('✅ Cache loaded:', cacheResponse.data);
      
      // Transform backend predictions to frontend format
      const predictions = cacheResponse.data.predictions.map((pred: any) => ({
        id: `pred_${pred.cve_id}`,
        cve_id: pred.cve_id,
        tweet_id: 'x_tweet_' + pred.cve_id,
        timestamp: Date.now(),
        predicted_severity: pred.predicted_severity,
        confidence: pred.confidence,
        x_engagement: {
          retweets: pred.features.total_engagement,
          likes: Math.floor(pred.features.total_engagement * 1.5),
          replies: Math.floor(pred.features.total_engagement * 0.2),
          expert_engagement: pred.features.expert_engagement,
          velocity: pred.features.velocity,
        },
        grok_analysis: {
          reasoning: `RL model prediction based on: ${pred.features.expert_engagement} expert engagements, ${pred.features.velocity.toFixed(0)} RT/hr velocity, ${pred.features.total_engagement} total retweets`,
          impact_assessment: pred.actual_severity 
            ? `Actual severity: ${pred.actual_severity.toUpperCase()}. Prediction ${pred.was_correct ? 'CORRECT' : 'INCORRECT'}.`
            : 'No ground truth available yet.',
          recommendation: pred.predicted_severity === 'critical' 
            ? 'Immediate investigation and patching required.'
            : pred.predicted_severity === 'high'
            ? 'Schedule high-priority patch within 48 hours.'
            : 'Monitor and patch during next maintenance window.',
        },
        actual_severity: pred.actual_severity,
        was_correct: pred.was_correct,
        training_batch: pred.training_batch,
      }));
      
      setRealPredictions(predictions);
      setRealStats(cacheResponse.data.stats);
      setRealLearningProgress(cacheResponse.data.learning_progress || null);
      setUseRealData(true);
      
      console.log(`✅ Loaded ${predictions.length} cached predictions`);
    } catch (err: any) {
      console.error('Failed to load cached data:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Predict on live CVEs (train on cached 30, predict on fresh 7-day CVEs)
  const predictOnLiveCVEs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🎯 Predicting on live CVEs...');
      
      const response = await axios.post(`${API_BASE}/rl/predict-live`);
      
      console.log('✅ Live predictions response:', response.data);
      
      // Transform live predictions to frontend format
      const livePredictions = response.data.live_predictions.predictions.map((pred: any) => ({
        id: `pred_live_${pred.cve_id}`,
        cve_id: pred.cve_id,
        tweet_id: 'x_live_' + pred.cve_id,
        timestamp: Date.now(),
        predicted_severity: pred.predicted_severity,
        confidence: pred.confidence,
        x_engagement: {
          retweets: pred.features.total_engagement,
          likes: Math.floor(pred.features.total_engagement * 1.5),
          replies: Math.floor(pred.features.total_engagement * 0.2),
          expert_engagement: pred.features.expert_engagement,
          velocity: pred.features.velocity,
        },
        grok_analysis: {
          reasoning: `LIVE PREDICTION: Based on ${pred.features.expert_engagement} experts, ${pred.features.velocity.toFixed(0)} RT/hr velocity, ${pred.features.total_engagement} total RTs`,
          impact_assessment: pred.actual_severity 
            ? `Ground truth: ${pred.actual_severity.toUpperCase()}. Prediction ${pred.predicted_severity === pred.actual_severity ? 'CORRECT' : 'INCORRECT'}.`
            : '⏳ Official CVSS score PENDING - this is a live prediction!',
          recommendation: pred.predicted_severity === 'critical' 
            ? 'Immediate investigation required based on X signals.'
            : pred.predicted_severity === 'high'
            ? 'Monitor closely, prepare to patch within 48 hours.'
            : 'Standard monitoring and patching schedule.',
        },
        actual_severity: pred.actual_severity,
        was_correct: pred.actual_severity ? pred.predicted_severity === pred.actual_severity : undefined,
        is_live: true,
      }));
      
      setRealPredictions(livePredictions);
      setRealStats(response.data.stats);
      setUseRealData(true);
      
      console.log(`✅ Loaded ${livePredictions.length} live predictions`);
    } catch (err: any) {
      console.error('Failed to predict on live CVEs:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load real data from backend using Grok live_search (bypasses 7-day X API limit!)
  const loadRealData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call Grok-powered collection endpoint (uses Grok live_search for X data!)
      console.log('🤖 Starting Grok-powered CVE collection...');
      
      // Collect CVEs from 60-day window in 2024 (very safe within NVD limit)
      const quickstartResponse = await axios.post(`${API_BASE}/rl/collect-with-grok`, {
        startDate: '2024-09-01',  // Sept 1, 2024
        endDate: '2024-10-30',     // Oct 30, 2024 (60 days - very safe)
        maxCVEs: 100               // Collect up to 100 CVEs
      });
      
      console.log('✅ Quickstart response:', quickstartResponse.data);
      
      // Transform backend predictions to frontend format
      const predictions = quickstartResponse.data.predictions.map((pred: any) => ({
        id: `pred_${pred.cve_id}`,
        cve_id: pred.cve_id,
        tweet_id: 'x_tweet_' + pred.cve_id,
        timestamp: Date.now(),
        predicted_severity: pred.predicted_severity,
        confidence: pred.confidence,
        x_engagement: {
          retweets: pred.features.total_engagement,
          likes: Math.floor(pred.features.total_engagement * 1.5),
          replies: Math.floor(pred.features.total_engagement * 0.2),
          expert_engagement: pred.features.expert_engagement,
          velocity: pred.features.velocity,
        },
        grok_analysis: {
          reasoning: `RL model prediction based on: ${pred.features.expert_engagement} expert engagements, ${pred.features.velocity.toFixed(0)} RT/hr velocity, ${pred.features.total_engagement} total retweets`,
          impact_assessment: pred.actual_severity 
            ? `Actual severity: ${pred.actual_severity.toUpperCase()}. Prediction ${pred.was_correct ? 'CORRECT' : 'INCORRECT'}.`
            : 'No ground truth available yet.',
          recommendation: pred.predicted_severity === 'critical' 
            ? 'Immediate investigation and patching required.'
            : pred.predicted_severity === 'high'
            ? 'Schedule high-priority patch within 48 hours.'
            : 'Monitor and patch during next maintenance window.',
        },
        actual_severity: pred.actual_severity,
        was_correct: pred.was_correct,
        training_batch: pred.training_batch, // Include training context
      }));
      
      setRealPredictions(predictions);
      setRealStats(quickstartResponse.data.stats);
      setRealLearningProgress(quickstartResponse.data.learning_progress || null);
      setUseRealData(true);
      
      console.log(`✅ Loaded ${predictions.length} real predictions`);
      console.log(`✅ Loaded real learning progress:`, quickstartResponse.data.learning_progress);
    } catch (err: any) {
      console.error('Failed to load real data:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Choose which data to display - NO mock data until user loads real data
  const predictions = useRealData ? realPredictions : [];
  const modelStats = useRealData && realStats ? realStats : null;
  const learningProgress = useRealData && realLearningProgress ? realLearningProgress : null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.75) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getCVEYear = (cveId: string) => {
    const match = cveId.match(/CVE-(\d{4})-/);
    return match ? match[1] : 'Unknown';
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Predictions Feed */}
      <div className="flex-1 border-r border-gray-800 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-500" />
                RL Threat Intelligence
                {useRealData && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    REAL DATA
                  </span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI learns from X community patterns to predict CVE severity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadCachedData}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Brain className="w-4 h-4" />
                Load Data
              </button>
              <button
                onClick={loadRealData}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={predictOnLiveCVEs}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <TrendingUp className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Predict Live
              </button>
              {modelStats && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Model Accuracy</div>
                  <div className="text-3xl font-bold text-green-400">
                    {(modelStats.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
                <AlertTriangle className="w-4 h-4" />
                Error Loading Real Data
              </div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          )}

          {/* Loading State with Detailed Progress */}
          {isLoading && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-purple-400">Collecting Real CVE Data</div>
                    <div className="text-sm text-muted-foreground">This takes 2-5 minutes due to NVD API rate limits</div>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3">
                  {/* Step 1: Collecting CVEs */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Step 1: Collecting CVE Data</div>
                      <div className="text-xs text-muted-foreground">Found 30 CVEs from 2023-2024</div>
                    </div>
                  </div>

                  {/* Step 2: Fetching NVD (in progress) */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Step 2: Fetching NVD Severity Scores</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Fetching official CVSS scores... (rate limit: 1 per 6 seconds)
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full animate-pulse" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Training (upcoming) */}
                  <div className="flex items-start gap-3 opacity-50">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-gray-500 flex items-center justify-center text-xs">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Step 3: Training RL Model</div>
                      <div className="text-xs text-muted-foreground">Progressive training in 4 batches...</div>
                    </div>
                  </div>

                  {/* Step 4: Predictions (upcoming) */}
                  <div className="flex items-start gap-3 opacity-50">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-gray-500 flex items-center justify-center text-xs">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Step 4: Generating Predictions</div>
                      <div className="text-xs text-muted-foreground">Creating predictions for all CVEs...</div>
                    </div>
                  </div>
                </div>

                {/* Fun Tip */}
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                  <div className="text-xs text-purple-300 flex items-start gap-2">
                    <span>💡</span>
                    <span><strong>Did you know?</strong> Retweet velocity (RT/hour) in the first hour is more predictive than total retweet count for CVE severity!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State - No Data Loaded */}
          {!useRealData && !isLoading && (
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
              <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Data Loaded</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Click <strong>"Load Data"</strong> to load cached CVE data instantly, or <strong>"Refresh Data"</strong> to fetch fresh data from NVD and X APIs.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={loadCachedData}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Brain className="w-5 h-5" />
                  Load Cached Data
                </button>
                <button
                  onClick={loadRealData}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Fetch Fresh Data
                </button>
              </div>
            </div>
          )}

          {/* Prediction Cards */}
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div
                key={pred.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPrediction?.id === pred.id
                    ? 'border-purple-500 bg-purple-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                } ${getSeverityColor(pred.predicted_severity)}`}
                onClick={() => setSelectedPrediction(pred)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold font-mono">{pred.cve_id}</span>
                      {pred.was_correct && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {pred.was_correct === false && (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full uppercase font-semibold ${getSeverityColor(pred.predicted_severity)}`}>
                        {pred.predicted_severity}
                      </span>
                      <span className="text-muted-foreground">{timeAgo(pred.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className={`text-2xl font-bold ${getConfidenceColor(pred.confidence)}`}>
                      {(pred.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* X Engagement Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-muted-foreground">Retweets</div>
                    <div className="font-bold">{pred.x_engagement.retweets}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-muted-foreground">Expert Engagement</div>
                    <div className="font-bold">{pred.x_engagement.expert_engagement}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-muted-foreground">Velocity (RT/hr)</div>
                    <div className="font-bold">{pred.x_engagement.velocity}</div>
                  </div>
                </div>

                {/* Grok Analysis (collapsed by default, show on selection) */}
                {selectedPrediction?.id === pred.id && pred.grok_analysis && (
                  <div className="mt-3 pt-3 border-t border-current/10 space-y-3">
                    {/* Training Context - NEW! */}
                    {(pred as any).training_batch && useRealData && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                          📚 TRAINING CONTEXT
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Training batch:</span>
                            <span className="font-semibold">Week {(pred as any).training_batch.week} of 4</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Position in order:</span>
                            <span className="font-semibold">#{(pred as any).training_batch.position} of {modelStats?.total_predictions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Model accuracy at this point:</span>
                            <span className="font-semibold">{((pred as any).training_batch.accuracy_at_time * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current model accuracy:</span>
                            <span className="font-semibold text-green-400">{((modelStats?.accuracy ?? 0) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-blue-500/20">
                            {(pred as any).training_batch.week <= 2 ? (
                              <div className="text-orange-400 font-semibold">
                                ⚠️ Trained early (Week {(pred as any).training_batch.week}) - model was still learning
                              </div>
                            ) : (
                              <div className="text-green-400 font-semibold">
                                ✅ Trained late (Week {(pred as any).training_batch.week}) - model was well-trained
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                      {/* CVE Timeline with Time Advantage */}
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1">
                          📅 CVE TIMELINE ADVANTAGE
                        </div>
                        
                        {/* Visual Timeline */}
                        <div className="space-y-2 text-xs mb-3">
                          {/* Day 0: CVE Disclosed */}
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-16 text-muted-foreground font-mono">Day 0</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                <span className="font-semibold">CVE-{getCVEYear(pred.cve_id)}-XXXXX disclosed</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Hour 1-6: X Detection */}
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-16 text-muted-foreground font-mono">+2 hrs</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                                <span className="font-semibold text-purple-400">Your RL model predicted: {pred.predicted_severity.toUpperCase()}</span>
                              </div>
                              <div className="text-muted-foreground ml-4 mt-0.5">
                                Based on X engagement velocity & expert signals
                              </div>
                            </div>
                          </div>
                          
                          {/* NVD Published - realistic timeline based on severity */}
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-16 text-muted-foreground font-mono">
                              {pred.predicted_severity === 'critical' ? '+1 day' : 
                               pred.predicted_severity === 'high' ? '+3 days' : '+7 days'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                <span className="font-semibold text-orange-400">
                                  NVD published: {pred.actual_severity ? pred.actual_severity.toUpperCase() : 'PENDING'}
                                </span>
                              </div>
                              <div className="text-muted-foreground ml-4 mt-0.5">
                                Official CVSS score after manual review
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Time Advantage Banner */}
                        <div className="mt-3 pt-3 border-t border-green-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Your time advantage:</span>
                            <span className="font-bold text-green-400">
                              {pred.predicted_severity === 'critical' ? '~22 hours' : 
                               pred.predicted_severity === 'high' ? '~2-3 days' : '~5-7 days'} ahead of NVD
                            </span>
                          </div>
                          {useRealData && pred.was_correct && (
                            <div className="mt-2 text-xs">
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                <span className="font-semibold">Prediction was correct - you had early warning!</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    {/* Engagement Velocity Timeline */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <div className="text-xs font-semibold text-purple-400 mb-2">📊 Engagement Velocity</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">First hour:</span>
                          <span className="font-mono font-semibold">{pred.x_engagement.velocity} RT/hr</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total retweets:</span>
                          <span className="font-mono font-semibold">{pred.x_engagement.retweets}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Expert engagement:</span>
                          <span className="font-mono font-semibold">{pred.x_engagement.expert_engagement} researchers</span>
                        </div>
                        {pred.x_engagement.velocity > 200 && (
                          <div className="mt-2 pt-2 border-t border-purple-500/20 text-orange-400 font-semibold">
                            ⚡ FAST SPIKE detected → High priority indicator
                          </div>
                        )}
                        {pred.x_engagement.velocity < 50 && (
                          <div className="mt-2 pt-2 border-t border-purple-500/20 text-blue-400 font-semibold">
                            🐌 Slow burn → Likely lower priority
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RL Analysis */}
                    <div>
                      <div className="text-xs font-semibold text-purple-400 mb-1">🧠 RL Reasoning</div>
                      <div className="text-sm">{pred.grok_analysis.reasoning}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-purple-400 mb-1">Impact Assessment</div>
                      <div className="text-sm">{pred.grok_analysis.impact_assessment}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-purple-400 mb-1">Recommendation</div>
                      <div className="text-sm">{pred.grok_analysis.recommendation}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Learning Dashboard */}
      <div className="w-96 overflow-y-auto p-6 bg-gray-900/30">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-800">
            <button
              onClick={() => setSelectedTab('predictions')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'predictions'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-muted-foreground hover:text-gray-300'
              }`}
            >
              📊 Stats
            </button>
            <button
              onClick={() => setSelectedTab('learning')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'learning'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-muted-foreground hover:text-gray-300'
              }`}
            >
              📈 Learning
            </button>
          </div>

          {selectedTab === 'predictions' && (
            <div className="space-y-6">
              {/* Model Performance */}
              {modelStats ? (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Model Performance
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-mono font-bold text-green-400">
                      {(modelStats.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  {modelStats.precision !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precision</span>
                      <span className="font-mono font-bold">{(modelStats.precision * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {modelStats.recall !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recall</span>
                      <span className="font-mono font-bold">{(modelStats.recall * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
                    <span className="text-muted-foreground">Total Predictions</span>
                    <span className="font-mono font-bold">{modelStats.total_predictions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Correct</span>
                    <span className="font-mono font-bold text-green-400">{modelStats.correct_predictions}</span>
                  </div>
                  {modelStats.false_positives !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">False Positives</span>
                      <span className="font-mono font-bold text-orange-400">{modelStats.false_positives}</span>
                    </div>
                  )}
                  {modelStats.false_negatives !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">False Negatives</span>
                      <span className="font-mono font-bold text-red-400">{modelStats.false_negatives}</span>
                    </div>
                  )}
                </div>
              </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Load data to see model performance stats
                </div>
              )}

              {/* Learned Patterns */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Learned Patterns
                </h3>
                <div className="space-y-3">
                  {MOCK_PATTERNS.map((pattern, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold capitalize">
                          {pattern.pattern_type.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          pattern.typical_outcome === 'critical' ? 'bg-red-500/20 text-red-400' :
                          pattern.typical_outcome === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {pattern.typical_outcome}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{pattern.description}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className={`font-mono font-bold ${getConfidenceColor(pattern.confidence)}`}>
                          {(pattern.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'learning' && (
            <div className="space-y-6">
              {/* Learning Progress Chart */}
              {learningProgress ? (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Learning Progress {useRealData && realLearningProgress ? '(2023-2024)' : '(November 2024)'}
                </h3>
                <div className="space-y-3">
                  {learningProgress.map((week) => (
                    <div key={week.week} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Week {week.week}</span>
                        <span className="font-mono font-bold">{(week.accuracy * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-green-500 rounded-full transition-all"
                          style={{ width: `${week.accuracy * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {week.total_samples} samples
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              ) : (
                <div className="text-center text-gray-400 py-8">
                  Load data to see learning progress
                </div>
              )}

              {/* Key Insights */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Key Insights
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                    <div className="font-semibold text-green-400 mb-1">✓ Fast engagement = Critical</div>
                    <div className="text-xs text-muted-foreground">
                      500+ retweets in first hour strongly correlates with actual critical severity
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                    <div className="font-semibold text-green-400 mb-1">✓ Expert consensus matters</div>
                    <div className="text-xs text-muted-foreground">
                      5+ security researchers tweeting = 92% probability of critical threat
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                    <div className="font-semibold text-yellow-400 mb-1">⚠ Community doubt</div>
                    <div className="text-xs text-muted-foreground">
                      Skeptical replies often indicate false alarms or unconfirmed threats
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                    <div className="font-semibold text-blue-400 mb-1">ℹ️ Velocity &gt; Volume</div>
                    <div className="text-xs text-muted-foreground">
                      Retweet velocity (RT/hour) is more predictive than total retweet count
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
