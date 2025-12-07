/**
 * Mock tweets for testing ThreatPulse Live without real X API streaming
 * These simulate realistic cybersecurity threat tweets
 */

export interface MockTweet {
  id: string;
  text: string;
  author_id: string;
  author_handle: string;
  created_at: string;
  expectedSeverity?: 'critical' | 'high' | 'medium' | 'low';
  expectedType?: 'cve' | 'breach' | 'exploit' | 'ransomware' | 'general';
}

export const MOCK_TWEETS: MockTweet[] = [
  {
    id: 'mock_1',
    text: '🚨 CRITICAL: CVE-2024-12345 - Remote Code Execution in Apache HTTP Server 2.4.x. CVSS 9.8. Public exploit code released. Patch immediately! Affects millions of servers worldwide. #infosec #cybersecurity',
    author_id: 'sec_researcher_1',
    author_handle: '@SecurityResearcher',
    created_at: new Date().toISOString(),
    expectedSeverity: 'critical',
    expectedType: 'cve'
  },
  {
    id: 'mock_2',
    text: 'Zero-day vulnerability discovered in Microsoft Exchange Server. CVE-2024-99999. Allowing unauthenticated RCE. Microsoft releasing emergency patch. Exploitation detected in the wild by APT groups.',
    author_id: 'threat_intel_1',
    author_handle: '@ThreatIntel',
    created_at: new Date().toISOString(),
    expectedSeverity: 'critical',
    expectedType: 'cve'
  },
  {
    id: 'mock_3',
    text: '⚠️ Major data breach: Healthcare provider with 5M patient records compromised. Ransomware gang LockBit claims responsibility. PHI, SSN, and financial data exposed. Investigation ongoing.',
    author_id: 'breach_tracker_1',
    author_handle: '@BreachTracker',
    created_at: new Date().toISOString(),
    expectedSeverity: 'high',
    expectedType: 'breach'
  },
  {
    id: 'mock_4',
    text: 'BREAKING: Global bank suffers massive data breach. 10+ million customer accounts affected. Attackers gained access through compromised VPN credentials. Full extent still being assessed.',
    author_id: 'cyber_news_1',
    author_handle: '@CyberNews',
    created_at: new Date().toISOString(),
    expectedSeverity: 'critical',
    expectedType: 'breach'
  },
  {
    id: 'mock_5',
    text: 'PoC exploit published for CVE-2024-55555 (Linux kernel privilege escalation). Easy to exploit, works on Ubuntu 22.04 and RHEL 9. Kernel team working on patch. Update ASAP when available.',
    author_id: 'exploit_db_1',
    author_handle: '@ExploitDB',
    created_at: new Date().toISOString(),
    expectedSeverity: 'high',
    expectedType: 'exploit'
  },
  {
    id: 'mock_6',
    text: 'New RCE exploit chain for Cisco routers (CVE-2024-11111 + CVE-2024-11112). Full PoC on GitHub. Allows complete device takeover. Cisco released patches yesterday, apply immediately!',
    author_id: 'security_lab_1',
    author_handle: '@SecurityLab',
    created_at: new Date().toISOString(),
    expectedSeverity: 'critical',
    expectedType: 'exploit'
  },
  {
    id: 'mock_7',
    text: '🔒 BlackCat ransomware targeting manufacturing sector. New variant uses AI-powered spreading. Encrypts backups first. Multiple Fortune 500 companies hit this week. Detection signatures updated.',
    author_id: 'ransomware_watch_1',
    author_handle: '@RansomwareWatch',
    created_at: new Date().toISOString(),
    expectedSeverity: 'high',
    expectedType: 'ransomware'
  },
  {
    id: 'mock_8',
    text: 'CVE-2024-77777: SQL injection in WordPress plugin "SuperForm" (500K+ installations). CVSS 8.5. Attackers actively exploiting to inject webshells. Plugin removed from official repository. Uninstall immediately.',
    author_id: 'wordpress_sec_1',
    author_handle: '@WPSecurity',
    created_at: new Date().toISOString(),
    expectedSeverity: 'high',
    expectedType: 'cve'
  },
  {
    id: 'mock_9',
    text: 'NPM package "colors" and "faker" compromised. Malicious code inserted in v1.4.1. Stealing environment variables including AWS keys. 20M+ weekly downloads affected. Revert to v1.4.0 immediately.',
    author_id: 'supply_chain_1',
    author_handle: '@SupplyChainSec',
    created_at: new Date().toISOString(),
    expectedSeverity: 'high',
    expectedType: 'breach'
  },
  {
    id: 'mock_10',
    text: 'PSA: Critical Docker vulnerability CVE-2024-33333 allows container escape. Affects Docker Engine 20.10.x and earlier. Patch available in version 20.10.25. Kubernetes clusters also affected. Update now!',
    author_id: 'container_sec_1',
    author_handle: '@ContainerSec',
    created_at: new Date().toISOString(),
    expectedSeverity: 'critical',
    expectedType: 'cve'
  }
];

/**
 * Get random mock tweet (useful for continuous testing)
 */
export function getRandomMockTweet(): MockTweet {
  return MOCK_TWEETS[Math.floor(Math.random() * MOCK_TWEETS.length)];
}

/**
 * Get mock tweets in sequence
 */
export function getMockTweetSequence(): MockTweet[] {
  return [...MOCK_TWEETS];
}
