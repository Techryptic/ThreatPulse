import axios from 'axios';

// Decode URL-encoded token (handles %3D -> = conversion)
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN 
  ? decodeURIComponent(process.env.X_BEARER_TOKEN) 
  : '';

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface XUser {
  id: string;
  username: string;
  name: string;
  verified: boolean;
}

interface XSearchResult {
  tweets: XTweet[];
  users: Map<string, XUser>;
}

// Known security expert X handles
const SECURITY_EXPERTS = [
  'GossiTheDog',
  'vxunderground',
  'x0rz',
  'MalwareTechBlog',
  'SwiftOnSecurity',
  'taviso',
  'troyhunt',
  'briankrebs',
  'hacks4pancakes',
  'malwrhunterteam',
  'campuscodi',
  'mttaggart',
  '0xdude',
  'cyb3rops',
  'Dominic_Chell'
];

/**
 * X API Client for searching CVE-related tweets
 */
export class XClient {
  private baseUrl = 'https://api.x.com/2';
  private bearerToken: string;

  constructor() {
    this.bearerToken = X_BEARER_TOKEN;
    if (!this.bearerToken) {
      console.warn('⚠️  X_BEARER_TOKEN not found in environment variables');
    }
  }

  /**
   * Search X for tweets mentioning a CVE
   */
  async searchCVETweets(cveId: string, maxResults: number = 100): Promise<XSearchResult> {
    try {
      console.log(`🔍 Searching X for: ${cveId}`);

      // Build search query
      const query = `"${cveId}" OR "#${cveId.replace(/-/g, '')}"`;

      const response = await axios.get(`${this.baseUrl}/tweets/search/recent`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
        params: {
          query,
          max_results: Math.min(maxResults, 100), // X API limit
          'tweet.fields': 'created_at,public_metrics,author_id',
          'expansions': 'author_id',
          'user.fields': 'username,name,verified',
        },
      });

      if (!response.data.data) {
        console.log(`ℹ️  No tweets found for ${cveId}`);
        return { tweets: [], users: new Map() };
      }

      // Parse tweets
      const tweets: XTweet[] = response.data.data;

      // Parse users
      const users = new Map<string, XUser>();
      if (response.data.includes?.users) {
        response.data.includes.users.forEach((user: XUser) => {
          users.set(user.id, user);
        });
      }

      console.log(`✅ Found ${tweets.length} tweets for ${cveId}`);
      return { tweets, users };

    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('❌ X API rate limit exceeded');
        throw new Error('X API rate limit exceeded. Please wait before trying again.');
      }
      
      console.error('Error searching X:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Calculate engagement metrics from X tweets
   */
  calculateEngagementMetrics(tweets: XTweet[], users: Map<string, XUser>) {
    if (tweets.length === 0) {
      return {
        total_retweets: 0,
        total_likes: 0,
        total_replies: 0,
        expert_count: 0,
        avg_velocity: 0,
        peak_velocity: 0,
        first_tweet_time: null,
        expert_usernames: [],
      };
    }

    // Sort by creation time
    const sortedTweets = [...tweets].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const firstTweetTime = new Date(sortedTweets[0].created_at);
    const now = new Date();
    const hoursSinceFirst = Math.max(1, (now.getTime() - firstTweetTime.getTime()) / (1000 * 60 * 60));

    // Calculate totals
    let totalRetweets = 0;
    let totalLikes = 0;
    let totalReplies = 0;
    const expertUsernames: string[] = [];

    tweets.forEach(tweet => {
      totalRetweets += tweet.public_metrics.retweet_count;
      totalLikes += tweet.public_metrics.like_count;
      totalReplies += tweet.public_metrics.reply_count;

      // Check if author is a known security expert
      const user = users.get(tweet.author_id);
      if (user && SECURITY_EXPERTS.some(expert => 
        user.username.toLowerCase() === expert.toLowerCase()
      )) {
        if (!expertUsernames.includes(user.username)) {
          expertUsernames.push(user.username);
        }
      }
    });

    // Calculate velocity (retweets per hour)
    const avgVelocity = totalRetweets / hoursSinceFirst;

    // Calculate peak velocity (max RT/hour in any 1-hour window)
    let peakVelocity = avgVelocity;
    if (tweets.length > 1) {
      // Group tweets by hour and find peak
      const hourlyRetweets: { [hour: string]: number } = {};
      tweets.forEach(tweet => {
        const hour = new Date(tweet.created_at).toISOString().slice(0, 13); // YYYY-MM-DDTHH
        hourlyRetweets[hour] = (hourlyRetweets[hour] || 0) + tweet.public_metrics.retweet_count;
      });
      peakVelocity = Math.max(...Object.values(hourlyRetweets), avgVelocity);
    }

    return {
      total_retweets: totalRetweets,
      total_likes: totalLikes,
      total_replies: totalReplies,
      expert_count: expertUsernames.length,
      avg_velocity: avgVelocity,
      peak_velocity: peakVelocity,
      first_tweet_time: firstTweetTime.toISOString(),
      expert_usernames: expertUsernames,
    };
  }

  /**
   * Check if X API is available
   */
  async testConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/tweets/search/recent`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
        params: {
          query: 'CVE',
          max_results: 10,
        },
      });
      console.log('✅ X API connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ X API connection failed:', error.response?.data || error.message);
      return false;
    }
  }
}

// Singleton instance
export const xClient = new XClient();
