import { useEffect, useRef, useState, useCallback } from 'react';
import { ThreatAlert, StreamStats } from '../types';
import { MOCK_TWEETS, MockTweet } from '../data/mockTweets';

interface WebSocketMessage {
  type: 'stream_started' | 'threat_alert' | 'stream_stopped' | 'error' | 'preset_loaded';
  sessionId?: string;
  alert?: ThreatAlert;
  stats?: StreamStats;
  config?: any;
  error?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  alerts: ThreatAlert[];
  stats: StreamStats;
  startStream: (config: any) => void;
  stopStream: () => void;
  clearAlerts: () => void;
  connectionError: string | null;
  testMode: boolean;
  startTestMode: () => void;
  stopTestMode: () => void;
  testProgress: { current: number; total: number } | null;
}

const WS_URL = 'ws://localhost:3002';

export function useWebSocket(): UseWebSocketReturn {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [stats, setStats] = useState<StreamStats>({
    totalTweets: 0,
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [testProgress, setTestProgress] = useState<{ current: number; total: number } | null>(null);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setConnectionError(null);
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'stream_started':
                console.log('🔴 Stream started:', message.sessionId);
                sessionIdRef.current = message.sessionId || null;
                break;

              case 'threat_alert':
                if (message.alert && message.stats) {
                  console.log('🚨 New threat alert:', message.alert.severity);
                  setAlerts(prev => [message.alert!, ...prev].slice(0, 100)); // Keep last 100
                  setStats(message.stats);
                }
                break;

              case 'stream_stopped':
                console.log('🛑 Stream stopped');
                sessionIdRef.current = null;
                break;

              case 'error':
                console.error('❌ WebSocket error:', message.error);
                setConnectionError(message.error || 'Unknown error');
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionError('Failed to connect to streaming server');
        };

        ws.current.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);
          sessionIdRef.current = null;

          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
              console.log('🔄 Attempting to reconnect...');
              connectWebSocket();
            }
          }, 3000);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        setConnectionError('Failed to create WebSocket connection');
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const startStream = useCallback((config: any) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setConnectionError('WebSocket not connected');
      return;
    }

    const sessionId = `session_${Date.now()}`;
    
    ws.current.send(JSON.stringify({
      type: 'start_stream',
      sessionId,
      config
    }));

    // Clear previous alerts when starting new stream
    setAlerts([]);
    setStats({
      totalTweets: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      mediumAlerts: 0,
      lowAlerts: 0
    });
  }, []);

  const stopStream = useCallback(() => {
    if (!ws.current || !sessionIdRef.current) return;

    ws.current.send(JSON.stringify({
      type: 'stop_stream',
      sessionId: sessionIdRef.current
    }));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setStats({
      totalTweets: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      mediumAlerts: 0,
      lowAlerts: 0
    });
  }, []);

  // Test Mode Functions
  const createMockAlert = useCallback((mockTweet: MockTweet, currentStats: StreamStats): ThreatAlert => {
    const newStats = { ...currentStats };
    newStats.totalTweets++;
    
    // Use expected severity or default to 'high'
    const severity = mockTweet.expectedSeverity || 'high';
    const type = mockTweet.expectedType || 'general';
    
    // Update severity counts
    switch (severity) {
      case 'critical': newStats.criticalAlerts++; break;
      case 'high': newStats.highAlerts++; break;
      case 'medium': newStats.mediumAlerts++; break;
      case 'low': newStats.lowAlerts++; break;
    }
    
    // Extract CVE IDs from text
    const cveMatches = mockTweet.text.match(/CVE-\d{4}-\d+/gi) || [];
    
    return {
      id: mockTweet.id,
      timestamp: Date.now(),
      severity,
      type,
      title: mockTweet.text.substring(0, 100),
      description: mockTweet.text,
      source: {
        tweet_id: mockTweet.id,
        author: mockTweet.author_id,
        author_handle: mockTweet.author_handle,
        content: mockTweet.text,
        url: `https://x.com/${mockTweet.author_handle}/status/${mockTweet.id}`
      },
      entities: {
        cve_ids: cveMatches,
        companies: [],
        products: [],
        threat_actors: []
      },
      analysis: {
        exploitability: severity === 'critical' ? 'High' : severity === 'high' ? 'Medium' : 'Low',
        impact: `Test mode alert - ${severity} severity`,
        recommendation: 'This is a test alert. In production, Grok would provide detailed analysis.'
      }
    };
  }, []);

  const startTestMode = useCallback(() => {
    console.log('🧪 Starting Test Mode');
    setTestMode(true);
    setAlerts([]);
    setStats({
      totalTweets: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      mediumAlerts: 0,
      lowAlerts: 0
    });
    
    let currentIndex = 0;
    const totalTweets = MOCK_TWEETS.length;
    setTestProgress({ current: 0, total: totalTweets });
    
    testIntervalRef.current = setInterval(() => {
      if (currentIndex >= totalTweets) {
        // Test complete
        if (testIntervalRef.current) {
          clearInterval(testIntervalRef.current);
          testIntervalRef.current = null;
        }
        setTestProgress({ current: totalTweets, total: totalTweets });
        console.log('✅ Test Mode complete');
        return;
      }
      
      const mockTweet = MOCK_TWEETS[currentIndex];
      
      setStats(prevStats => {
        const mockAlert = createMockAlert(mockTweet, prevStats);
        setAlerts(prev => [mockAlert, ...prev].slice(0, 100));
        
        const newStats = { ...prevStats };
        newStats.totalTweets++;
        switch (mockAlert.severity) {
          case 'critical': newStats.criticalAlerts++; break;
          case 'high': newStats.highAlerts++; break;
          case 'medium': newStats.mediumAlerts++; break;
          case 'low': newStats.lowAlerts++; break;
        }
        
        return newStats;
      });
      
      currentIndex++;
      setTestProgress({ current: currentIndex, total: totalTweets });
      
    }, 3000); // 3 second intervals
    
  }, [createMockAlert]);

  const stopTestMode = useCallback(() => {
    console.log('🛑 Stopping Test Mode');
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    setTestMode(false);
    setTestProgress(null);
  }, []);

  // Cleanup test interval on unmount
  useEffect(() => {
    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
    };
  }, []);

  return {
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
  };
}
