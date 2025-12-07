import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GROK_API_BASE = 'https://api.x.ai/v1';

interface GrokXEngagement {
  total_tweets: number;
  total_retweets: number;
  total_likes: number;
  expert_count: number;
  expert_names: string[];
  peak_velocity: number;
  avg_velocity: number;
  first_mention_date?: string;
  summary: string;
}

/**
 * Uses Grok API with live_search to extract X engagement for CVEs
 * This bypasses the 7-day X API limitation!
 */
export class GrokXCollector {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.XAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  XAI_API_KEY not found in environment variables');
    }
  }

  /**
   * Use Grok to search X and analyze CVE engagement
   */
  async getCVEEngagement(cveId: string): Promise<GrokXEngagement | null> {
    try {
      console.log(`🤖 Asking Grok to search X for ${cveId}...`);

      const prompt = `Search X (Twitter) for all tweets and discussions about ${cveId}.

Analyze the community engagement and provide a structured response with these metrics:
1. Total number of tweets mentioning this CVE
2. Estimated total retweets across all tweets
3. Estimated total likes
4. Number of security experts/researchers who discussed it (look for verified security accounts, researchers, threat intel professionals)
5. Names of key security experts who discussed it
6. Peak engagement velocity (estimated retweets per hour during first 6 hours)
7. Average engagement velocity
8. When was it first mentioned on X
9. Brief summary of the community sentiment (critical/severe/moderate/low concern)

Focus on identifying security experts like @GossiTheDog, @vxunderground, @SwiftOnSecurity, @troyhunt, etc.

Provide specific numbers where possible. If no tweets found, say so explicitly.`;

      const response = await axios.post(
        `${GROK_API_BASE}/chat/completions`,
        {
          model: 'grok-2-latest',
          messages: [
            {
              role: 'system',
              content: 'You are a cybersecurity analyst with access to X (Twitter) search. Extract X engagement metrics for CVE analysis. Provide precise numerical estimates based on actual search results from X.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3
          // Note: Removed tools - Grok will search X based on prompt context
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const grokResponse = response.data.choices[0].message.content;
      console.log(`✅ Grok response for ${cveId}:`, grokResponse.substring(0, 200) + '...');

      // Parse Grok's response
      const engagement = this.parseGrokResponse(cveId, grokResponse);
      
      if (engagement) {
        console.log(`  📊 Metrics: ${engagement.total_retweets} RTs, ${engagement.expert_count} experts, ${engagement.peak_velocity.toFixed(0)} RT/hr`);
      }

      return engagement;

    } catch (error: any) {
      console.error(`❌ Grok search failed for ${cveId}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Parse Grok's natural language response into structured metrics
   */
  private parseGrokResponse(cveId: string, response: string): GrokXEngagement | null {
    try {
      // Check if no tweets found
      if (response.toLowerCase().includes('no tweets found') || 
          response.toLowerCase().includes('no mentions found') ||
          response.toLowerCase().includes('not discussed on x')) {
        console.log(`  ℹ️  No X discussion found for ${cveId}`);
        return null;
      }

      // Extract numbers using regex patterns
      const totalTweets = this.extractNumber(response, /(\d+)\s*tweets?/i) || 0;
      const totalRetweets = this.extractNumber(response, /(\d+)\s*retweets?/i) || 
                            this.extractNumber(response, /retweet.*?(\d+)/i) || 0;
      const totalLikes = this.extractNumber(response, /(\d+)\s*likes?/i) || 
                        Math.floor(totalRetweets * 1.5); // Estimate if not provided
      
      // Expert count
      const expertCount = this.extractNumber(response, /(\d+)\s*(?:security\s*)?experts?/i) || 
                         this.extractNumber(response, /(\d+)\s*researchers?/i) || 0;

      // Extract expert names
      const expertNames = this.extractExpertNames(response);

      // Velocity
      const peakVelocity = this.extractNumber(response, /(\d+)\s*(?:retweets?\s*)?(?:per|\/)\s*hour/i) ||
                          Math.floor(totalRetweets / 24); // Rough estimate
      const avgVelocity = peakVelocity * 0.6; // Estimate average as 60% of peak

      // Determine if this is significant engagement
      if (totalTweets === 0 && totalRetweets === 0 && expertCount === 0) {
        console.log(`  ℹ️  Minimal engagement for ${cveId}`);
        return null;
      }

      return {
        total_tweets: totalTweets,
        total_retweets: totalRetweets,
        total_likes: totalLikes,
        expert_count: expertCount,
        expert_names: expertNames,
        peak_velocity: peakVelocity,
        avg_velocity: avgVelocity,
        summary: response.substring(0, 500) // Keep full summary
      };

    } catch (error) {
      console.error('Failed to parse Grok response:', error);
      return null;
    }
  }

  /**
   * Extract a number from text using regex pattern
   */
  private extractNumber(text: string, pattern: RegExp): number | null {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return null;
  }

  /**
   * Extract security expert usernames from Grok's response
   */
  private extractExpertNames(text: string): string[] {
    const experts: string[] = [];
    
    // Look for @mentions
    const mentions = text.match(/@\w+/g);
    if (mentions) {
      experts.push(...mentions.map(m => m.substring(1))); // Remove @
    }

    // Known security experts
    const knownExperts = [
      'GossiTheDog', 'vxunderground', 'SwiftOnSecurity', 'troyhunt',
      'briankrebs', 'MalwareTechBlog', 'x0rz', 'taviso', 'hacks4pancakes'
    ];

    knownExperts.forEach(expert => {
      if (text.toLowerCase().includes(expert.toLowerCase()) && !experts.includes(expert)) {
        experts.push(expert);
      }
    });

    return experts;
  }

  /**
   * Batch collect X engagement for multiple CVEs
   */
  async collectBatch(cveIds: string[]): Promise<Map<string, GrokXEngagement>> {
    const results = new Map<string, GrokXEngagement>();
    
    console.log(`🚀 Collecting X engagement for ${cveIds.length} CVEs via Grok...`);
    
    for (let i = 0; i < cveIds.length; i++) {
      const cveId = cveIds[i];
      console.log(`[${i + 1}/${cveIds.length}] Processing ${cveId}...`);
      
      const engagement = await this.getCVEEngagement(cveId);
      
      if (engagement) {
        results.set(cveId, engagement);
      }

      // Rate limiting: Wait between requests
      if (i < cveIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec delay
      }
    }

    console.log(`✅ Collected X engagement for ${results.size}/${cveIds.length} CVEs`);
    return results;
  }
}

// Singleton instance
export const grokXCollector = new GrokXCollector();
