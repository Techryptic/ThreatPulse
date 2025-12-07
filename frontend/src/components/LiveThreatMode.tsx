import { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { ThreatAlert } from '../types';
import { Shield, AlertTriangle, TrendingUp, Activity, Play, Square, Trash2 } from 'lucide-react';

const THREAT_PRESETS = [
  {
    id: 'cve_monitor',
    name: 'CVE & Zero-Day Monitor',
    keywords: ['CVE-2024', 'CVE-2025', 'zero-day', '0day', 'vulnerability disclosure'],
    accounts: ['@GossiTheDog', '@vxunderground', '@x0rz']
  },
  {
    id: 'breach_monitor',
    name: 'Data Breach Tracker',
    keywords: ['data breach', 'ransomware', 'compromised', 'leaked database', 'hack'],
    accounts: []
  },
  {
    id: 'exploit_monitor',
    name: 'Exploit & PoC Tracker',
    keywords: ['exploit', 'PoC', 'proof of concept', 'RCE', 'remote code execution'],
    accounts: []
  },
  {
    id: 'researcher_feed',
    name: 'Security Researcher Feed',
    keywords: [],
    accounts: ['@GossiTheDog', '@vxunderground', '@x0rz', '@MalwareTechBlog', '@SwiftOnSecurity', '@taviso', '@troyhunt']
  }
];

export function LiveThreatMode() {
  const { 
    isConnected, 
    alerts, 
    stats, 
    startStream, 
    stopStream, 
    clearAlerts, 
    connectionError,
    testMode,
    startTestMode,
    stopTestMode,
    testProgress
  } = useWebSocket();
  const [selectedPreset, setSelectedPreset] = useState(THREAT_PRESETS[0]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStartStream = () => {
    startStream({
      type: selectedPreset.id,
      keywords: selectedPreset.keywords,
      accounts: selectedPreset.accounts
    });
    setIsStreaming(true);
  };

  const handleStopStream = () => {
    stopStream();
    setIsStreaming(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cve': return '🐛';
      case 'breach': return '🚨';
      case 'exploit': return '⚡';
      case 'ransomware': return '🔒';
      default: return '🔍';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Controls */}
      <div className="border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="text-xl font-bold">🔴 ThreatPulse Live</h2>
              <p className="text-sm text-muted-foreground">Real-time cyber threat intelligence from X</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {connectionError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
            ⚠️ {connectionError}
          </div>
        )}

        {/* Test Mode Banner */}
        {testMode && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                <div>
                  <div className="font-bold text-yellow-600 dark:text-yellow-500">TEST MODE ACTIVE</div>
                  <div className="text-sm text-yellow-600/80 dark:text-yellow-500/80">
                    {testProgress ? `Processing mock tweet ${testProgress.current} of ${testProgress.total}` : 'Preparing test data...'}
                  </div>
                </div>
              </div>
              {testProgress && (
                <div className="text-sm font-mono bg-yellow-500/10 px-3 py-1 rounded">
                  {testProgress.current}/{testProgress.total}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Mode Controls */}
        <div className="flex items-center gap-3">
          {!testMode ? (
            <button
              onClick={startTestMode}
              disabled={isStreaming}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>🧪</span>
              Start Test Mode
            </button>
          ) : (
            <button
              onClick={stopTestMode}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop Test
            </button>
          )}
          <div className="text-xs text-muted-foreground">
            Test mode uses mock tweets to verify the system without X API
          </div>
        </div>

        {/* Preset Selector & Controls */}
        <div className="flex items-center gap-3">
          <select
            value={selectedPreset.id}
            onChange={(e) => setSelectedPreset(THREAT_PRESETS.find(p => p.id === e.target.value)!)}
            disabled={isStreaming}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {THREAT_PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>

          {!isStreaming ? (
            <button
              onClick={handleStartStream}
              disabled={!isConnected}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Stream
            </button>
          ) : (
            <button
              onClick={handleStopStream}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalTweets}</div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500 uppercase">Critical</span>
            </div>
            <div className="text-2xl font-bold text-red-500">{stats.criticalAlerts}</div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-orange-500 uppercase">High</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">{stats.highAlerts}</div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-500 uppercase">Medium</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">{stats.mediumAlerts}</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-500 uppercase">Low</span>
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.lowAlerts}</div>
          </div>
        </div>
      </div>

      {/* Threat Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground">
            <div>
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No threats detected</p>
              <p className="text-sm">
                {isStreaming ? 'Monitoring X for security threats...' : 'Select a preset and click "Start Stream" to begin monitoring'}
              </p>
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <ThreatAlertCard key={alert.id} alert={alert} getSeverityColor={getSeverityColor} getTypeIcon={getTypeIcon} />
          ))
        )}
      </div>
    </div>
  );
}

interface ThreatAlertCardProps {
  alert: ThreatAlert;
  getSeverityColor: (severity: string) => string;
  getTypeIcon: (type: string) => string;
}

function ThreatAlertCard({ alert, getSeverityColor, getTypeIcon }: ThreatAlertCardProps) {
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)} animate-in slide-in-from-top duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(alert.type)}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-current/20">
                {alert.severity}
              </span>
              <span className="text-xs font-semibold uppercase opacity-60">
                {alert.type}
              </span>
            </div>
            <h3 className="font-bold text-sm mt-1">{alert.title}</h3>
          </div>
        </div>
        <span className="text-xs opacity-60">{timeAgo(alert.timestamp)}</span>
      </div>

      {/* Description */}
      <p className="text-sm mb-3 opacity-90">{alert.description}</p>

      {/* Entities */}
      {alert.entities && (
        <div className="space-y-1 mb-3 text-xs">
          {alert.entities.cve_ids && alert.entities.cve_ids.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="font-semibold">CVEs:</span>
              {alert.entities.cve_ids.map(cve => (
                <span key={cve} className="px-2 py-0.5 bg-current/10 rounded-full font-mono">{cve}</span>
              ))}
            </div>
          )}
          {alert.entities.companies && alert.entities.companies.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="font-semibold">Companies:</span>
              {alert.entities.companies.map(company => (
                <span key={company} className="px-2 py-0.5 bg-current/10 rounded-full">{company}</span>
              ))}
            </div>
          )}
          {alert.entities.products && alert.entities.products.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="font-semibold">Products:</span>
              {alert.entities.products.map(product => (
                <span key={product} className="px-2 py-0.5 bg-current/10 rounded-full">{product}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analysis */}
      {alert.analysis && (
        <div className="bg-current/5 rounded p-2 space-y-1 text-xs mb-3">
          <div><span className="font-semibold">Exploitability:</span> {alert.analysis.exploitability}</div>
          <div><span className="font-semibold">Impact:</span> {alert.analysis.impact}</div>
          <div><span className="font-semibold">Recommendation:</span> {alert.analysis.recommendation}</div>
        </div>
      )}

      {/* Source */}
      <div className="pt-2 border-t border-current/10">
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60">
            Source: {alert.source.author_handle}
          </span>
          <a
            href={alert.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on X →
          </a>
        </div>
      </div>
    </div>
  );
}
