import { WebSocket, WebSocketServer } from 'ws';
import { XAPIClient, THREAT_STREAM_PRESETS } from './xapi-client';
import axios from 'axios';

interface StreamClient {
  ws: WebSocket;
  sessionId: string;
  streamConfig: any;
  stopStream?: () => void;
}

interface ThreatAnalysisResult {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: 'cve' | 'breach' | 'exploit' | 'ransomware' | 'general';
  title: string;
  description: string;
  entities: {
    cve_ids: string[];
    companies: string[];
    products: string[];
    threat_actors: string[];
  };
  analysis: {
    exploitability: string;
    impact: string;
    recommendation: string;
  };
}

export class StreamingServer {
  private wss: WebSocketServer;
  private clients: Map<string, StreamClient> = new Map();
  private xApiClient: XAPIClient;
  private grokApiKey: string;

  constructor(wss: WebSocketServer, grokApiKey: string) {
    this.wss = wss;
    this.grokApiKey = grokApiKey;
    this.xApiClient = new XAPIClient({ apiKey: grokApiKey });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 New WebSocket client connected');

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error: any) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            error: error.message 
          }));
        }
      });

      ws.on('close', () => {
        // Clean up client streams
        for (const [sessionId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            if (client.stopStream) {
              client.stopStream();
            }
            this.clients.delete(sessionId);
            console.log(`🔌 Client disconnected: ${sessionId}`);
          }
        }
      });
    });
  }

  private async handleMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'start_stream':
        await this.startThreatStream(ws, data);
        break;
      
      case 'stop_stream':
        this.stopThreatStream(data.sessionId);
        break;
      
      case 'load_preset':
        this.loadPresetConfig(ws, data.presetId);
        break;
      
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Unknown message type' 
        }));
    }
  }

  private async startThreatStream(ws: WebSocket, data: any) {
    const sessionId = data.sessionId || `session_${Date.now()}`;
    const config = data.config;

    console.log(`🚀 Starting threat stream: ${sessionId}`);

    // Build stream rules
    const rules = config.keywords.map((keyword: string, idx: number) => ({
      value: keyword,
      tag: `rule_${idx}`
    }));

    // Initialize stats
    const stats = {
      totalTweets: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      mediumAlerts: 0,
      lowAlerts: 0
    };

    // Send initial confirmation
    ws.send(JSON.stringify({
      type: 'stream_started',
      sessionId,
      config
    }));

    // Start the stream
    const stopStream = await this.xApiClient.startStream(rules, async (tweet) => {
      try {
        stats.totalTweets++;

        // Analyze threat with Grok
        const analysis = await this.analyzeThreatWithGrok(tweet.text);
        
        // Create threat alert
        const alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          severity: analysis.severity,
          type: analysis.type,
          title: analysis.title,
          description: analysis.description,
          source: {
            tweet_id: tweet.id,
            author: tweet.author_id,
            author_handle: `@${tweet.author_id}`,
            content: tweet.text,
            url: `https://x.com/user/status/${tweet.id}`
          },
          entities: analysis.entities,
          analysis: analysis.analysis
        };

        // Update stats
        switch (analysis.severity) {
          case 'critical': stats.criticalAlerts++; break;
          case 'high': stats.highAlerts++; break;
          case 'medium': stats.mediumAlerts++; break;
          case 'low': stats.lowAlerts++; break;
        }

        // Send alert to client
        ws.send(JSON.stringify({
          type: 'threat_alert',
          alert,
          stats
        }));

      } catch (error: any) {
        console.error('Error processing tweet:', error);
      }
    });

    // Store client session
    this.clients.set(sessionId, {
      ws,
      sessionId,
      streamConfig: config,
      stopStream
    });
  }

  private stopThreatStream(sessionId: string) {
    const client = this.clients.get(sessionId);
    if (client) {
      if (client.stopStream) {
        client.stopStream();
      }
      this.clients.delete(sessionId);
      
      client.ws.send(JSON.stringify({
        type: 'stream_stopped',
        sessionId
      }));
      
      console.log(`🛑 Stopped threat stream: ${sessionId}`);
    }
  }

  private loadPresetConfig(ws: WebSocket, presetId: string) {
    const preset = (THREAT_STREAM_PRESETS as any)[presetId];
    if (preset) {
      ws.send(JSON.stringify({
        type: 'preset_loaded',
        config: preset
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Preset not found'
      }));
    }
  }

  /**
   * Analyze tweet for threat intelligence using Grok
   */
  private async analyzeThreatWithGrok(tweetText: string): Promise<ThreatAnalysisResult> {
    try {
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-4-fast',
          messages: [
            {
              role: 'system',
              content: `You are a cybersecurity threat analyst. Analyze tweets for threat intelligence and extract:
              
1. Severity: critical, high, medium, low, or info
2. Type: cve, breach, exploit, ransomware, or general
3. Title: Short descriptive title
4. Description: Brief analysis
5. Entities: Extract CVE IDs, company names, products, threat actors
6. Analysis: Exploitability assessment, impact, and recommendations

Respond ONLY with valid JSON in this exact format:
{
  "severity": "critical|high|medium|low|info",
  "type": "cve|breach|exploit|ransomware|general",
  "title": "Short title",
  "description": "Brief description",
  "entities": {
    "cve_ids": ["CVE-2024-1234"],
    "companies": ["Company Name"],
    "products": ["Product Name"],
    "threat_actors": ["Actor Name"]
  },
  "analysis": {
    "exploitability": "High/Medium/Low/Unknown",
    "impact": "Description of impact",
    "recommendation": "What to do about it"
  }
}`
            },
            {
              role: 'user',
              content: `Analyze this tweet for threat intelligence:\n\n${tweetText}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.grokApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      }
      
      // Fallback if parsing fails
      return this.createFallbackAnalysis(tweetText);
      
    } catch (error: any) {
      console.error('Grok analysis error:', error.message);
      return this.createFallbackAnalysis(tweetText);
    }
  }

  private createFallbackAnalysis(tweetText: string): ThreatAnalysisResult {
    // Simple heuristic-based analysis as fallback
    const text = tweetText.toLowerCase();
    
    let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
    let type: 'cve' | 'breach' | 'exploit' | 'ransomware' | 'general' = 'general';
    
    // Detect CVEs
    const cveMatches = tweetText.match(/CVE-\d{4}-\d+/gi) || [];
    if (cveMatches.length > 0) {
      type = 'cve';
      severity = text.includes('critical') || text.includes('rce') ? 'critical' : 'high';
    }
    
    // Detect breaches
    if (text.includes('breach') || text.includes('compromised') || text.includes('leaked')) {
      type = 'breach';
      severity = 'high';
    }
    
    // Detect exploits
    if (text.includes('exploit') || text.includes('0day') || text.includes('zero-day')) {
      type = 'exploit';
      severity = 'critical';
    }
    
    // Detect ransomware
    if (text.includes('ransomware') || text.includes('lockbit') || text.includes('blackcat')) {
      type = 'ransomware';
      severity = 'high';
    }
    
    return {
      severity,
      type,
      title: tweetText.substring(0, 100),
      description: 'Automated analysis - review manually',
      entities: {
        cve_ids: cveMatches,
        companies: [],
        products: [],
        threat_actors: []
      },
      analysis: {
        exploitability: 'Unknown',
        impact: 'Requires manual review',
        recommendation: 'Review this alert manually for details'
      }
    };
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(message: any) {
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Get active streams count
   */
  getActiveStreamsCount(): number {
    return this.clients.size;
  }
}
