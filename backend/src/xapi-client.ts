import axios from 'axios';

// Note: This is a mock implementation for the hackathon
// In production, you'd use the official X API v2 with proper authentication
// For now, we'll simulate streaming using x_search tool through Grok API

interface XAPIConfig {
  bearerToken?: string;
  apiKey: string;
}

interface StreamRule {
  value: string;
  tag: string;
}

interface TweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
  };
}

export class XAPIClient {
  private config: XAPIConfig;
  private streamingActive: boolean = false;

  constructor(config: XAPIConfig) {
    this.config = config;
  }

  /**
   * Simulates X API streaming by polling x_search
   * In production, this would use the actual X API streaming endpoint
   */
  async startStream(
    rules: StreamRule[],
    callback: (tweet: any) => void
  ): Promise<() => void> {
    this.streamingActive = true;
    
    // Build search query from rules
    const query = rules.map(r => r.value).join(' OR ');
    
    console.log(`🔴 Starting simulated X stream with query: ${query}`);
    
    // Poll every 30 seconds (in production, this would be real-time stream)
    const pollInterval = setInterval(async () => {
      if (!this.streamingActive) {
        clearInterval(pollInterval);
        return;
      }

      try {
        // Use Grok's x_search to get recent tweets
        const response = await axios.post(
          'https://api.x.ai/v1/chat/completions',
          {
            model: 'grok-4-fast',
            messages: [
              {
                role: 'user',
                content: `Search X for: ${query}. Return the most recent tweets in the last 5 minutes.`
              }
            ],
            tools: [{ type: 'x_search' }],
            tool_choice: { type: 'tool', name: 'x_search' },
            search_parameters: {
              x_search: {
                from_date: new Date(Date.now() - 5 * 60 * 1000).toISOString().split('T')[0]
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Parse response and emit tweets
        const content = response.data.choices[0].message.content;
        
        // Simulate tweet objects from the response
        const simulatedTweet = {
          id: `tweet_${Date.now()}`,
          text: content,
          author_id: 'security_researcher',
          created_at: new Date().toISOString(),
          matching_rules: rules
        };

        callback(simulatedTweet);
        
      } catch (error: any) {
        console.error('Stream poll error:', error.message);
      }
    }, 30000); // Poll every 30 seconds

    // Return stop function
    return () => {
      this.streamingActive = false;
      clearInterval(pollInterval);
      console.log('🔴 Stream stopped');
    };
  }

  /**
   * Mock: In production, this would get user details from X API
   */
  async getUserByUsername(username: string) {
    return {
      id: `user_${username}`,
      username: username,
      name: username.replace('@', ''),
      description: 'Security Researcher',
      public_metrics: {
        followers_count: 10000,
        following_count: 500
      }
    };
  }

  /**
   * Mock: In production, this would search recent tweets
   */
  async searchRecentTweets(query: string, maxResults: number = 10) {
    // This would call actual X API search endpoint
    // For now, we'll use Grok's x_search
    try {
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-4-fast',
          messages: [
            {
              role: 'user',
              content: `Search X for recent tweets about: ${query}. Limit to ${maxResults} tweets.`
            }
          ],
          tools: [{ type: 'x_search' }],
          tool_choice: { type: 'tool', name: 'x_search' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`X search failed: ${error.message}`);
    }
  }
}

/**
 * Preset stream configurations for cybersecurity monitoring
 */
export const THREAT_STREAM_PRESETS = {
  cve_monitor: {
    id: 'cve_monitor',
    name: 'CVE & Zero-Day Monitor',
    keywords: ['CVE-2024', 'CVE-2025', '0day', 'zero-day', 'vulnerability disclosure'],
    accounts: ['@GossiTheDog', '@vxunderground', '@x0rz']
  },
  breach_monitor: {
    id: 'breach_monitor',
    name: 'Data Breach Tracker',
    keywords: ['data breach', 'ransomware', 'compromised', 'leaked database', 'hack'],
    accounts: []
  },
  exploit_monitor: {
    id: 'exploit_monitor',
    name: 'Exploit & PoC Tracker',
    keywords: ['exploit', 'PoC', 'proof of concept', 'RCE', 'remote code execution'],
    accounts: []
  },
  researcher_feed: {
    id: 'researcher_feed',
    name: 'Security Researcher Feed',
    keywords: [],
    accounts: [
      '@GossiTheDog',
      '@vxunderground', 
      '@x0rz',
      '@MalwareTechBlog',
      '@SwiftOnSecurity',
      '@taviso',
      '@troyhunt'
    ]
  }
};
