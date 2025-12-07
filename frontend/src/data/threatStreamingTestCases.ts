import { TestCase } from './testCases';

/**
 * Test cases specifically for ThreatPulse Live Streaming
 * These demonstrate the real-time threat intelligence capabilities
 */

export const THREAT_STREAMING_TEST_CASES: TestCase[] = [
  {
    id: 'threat-stream-cve-monitor',
    title: '🔴 Live CVE Monitor',
    category: 'threat_streaming',
    description: 'Real-time monitoring of CVE disclosures and zero-day exploits from X',
    systemPrompt: `You are monitoring X (Twitter) for critical cybersecurity threats, specifically CVE disclosures and zero-day vulnerabilities.

Your task:
1. Monitor tweets containing: CVE-2024, CVE-2025, zero-day, 0day
2. For each relevant tweet, extract:
   - CVE IDs
   - Severity (Critical/High/Medium/Low)
   - Affected products/companies
   - Exploit availability
3. Provide immediate risk assessment and remediation recommendations

Focus on tweets from security researchers and official vendor accounts.`,
    userPrompt: 'Start monitoring for new CVE disclosures and zero-day vulnerabilities',
    expectedBehavior: 'Should detect CVE announcements in real-time, analyze severity, and provide actionable recommendations',
    requiredSettings: {
      model: 'grok-4-fast',
      temperature: 0.3,
      maxTokens: 1000,
      toolsEnabled: ['x_search'],
      streamConfig: {
        type: 'cve_monitor',
        keywords: ['CVE-2024', 'CVE-2025', 'zero-day', '0day', 'vulnerability disclosure'],
        accounts: ['@GossiTheDog', '@vxunderground', '@x0rz']
      }
    },
    tags: ['streaming', 'cybersecurity', 'real-time', 'cve'],
    difficulty: 'advanced'
  },
  {
    id: 'threat-stream-breach-tracker',
    title: '🚨 Data Breach Tracker',
    category: 'threat_streaming',
    description: 'Live monitoring of data breach announcements and ransomware attacks',
    systemPrompt: `You are a threat intelligence analyst monitoring X for data breach announcements and ransomware attacks.

Your objectives:
1. Detect mentions of: data breaches, ransomware, leaked databases, compromised systems
2. Identify:
   - Affected organizations
   - Type of attack (ransomware, breach, leak)
   - Threat actor (if mentioned)
   - Data exposed
3. Assess impact and provide security recommendations

Monitor both official announcements and underground discussions.`,
    userPrompt: 'Monitor X for data breach and ransomware activity',
    expectedBehavior: 'Detects breach announcements, identifies affected companies, and assesses impact in real-time',
    requiredSettings: {
      model: 'grok-4-fast',
      temperature: 0.3,
      maxTokens: 1000,
      toolsEnabled: ['x_search'],
      streamConfig: {
        type: 'breach_monitor',
        keywords: ['data breach', 'ransomware', 'compromised', 'leaked database', 'hack'],
        accounts: []
      }
    },
    tags: ['streaming', 'cybersecurity', 'breach', 'ransomware'],
    difficulty: 'advanced'
  },
  {
    id: 'threat-stream-researcher-feed',
    title: '👥 Security Researcher Feed',
    category: 'threat_streaming',
    description: 'Aggregate real-time insights from top security researchers',
    systemPrompt: `You are aggregating and analyzing tweets from leading cybersecurity researchers.

Your role:
1. Monitor tweets from top security researchers
2. Identify emerging threats they're discussing
3. Categorize by:
   - Threat type (malware, vulnerability, attack campaign)
   - Urgency level
   - Affected technologies
4. Synthesize key takeaways and trends

Focus on actionable intelligence that security teams can use.`,
    userPrompt: 'Aggregate insights from security researchers on X',
    expectedBehavior: 'Creates a live feed of expert security insights, highlighting critical threats and trends',
    requiredSettings: {
      model: 'grok-4-fast',
      temperature: 0.4,
      maxTokens: 1200,
      toolsEnabled: ['x_search'],
      streamConfig: {
        type: 'researcher_feed',
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
    },
    tags: ['streaming', 'cybersecurity', 'threat-intel', 'researchers'],
    difficulty: 'intermediate'
  },
  {
    id: 'threat-stream-exploit-poc',
    title: '⚡ Exploit & PoC Tracker',
    category: 'threat_streaming',
    description: 'Monitor for proof-of-concept exploits and working attack code',
    systemPrompt: `You are tracking the release of exploit code and proof-of-concept (PoC) demonstrations on X.

Mission:
1. Detect tweets mentioning: exploit, PoC, proof of concept, RCE, remote code execution
2. Determine:
   - What vulnerability is being exploited
   - Exploit availability (public/private)
   - Complexity of exploitation
   - Potential impact
3. Provide rapid threat assessment

This is critical for prioritizing patching efforts.`,
    userPrompt: 'Track release of exploit code and PoC demonstrations',
    expectedBehavior: 'Identifies when exploits become publicly available, enabling rapid response',
    requiredSettings: {
      model: 'grok-4-fast',
      temperature: 0.2,
      maxTokens: 800,
      toolsEnabled: ['x_search'],
      streamConfig: {
        type: 'exploit_monitor',
        keywords: ['exploit', 'PoC', 'proof of concept', 'RCE', 'remote code execution'],
        accounts: []
      }
    },
    tags: ['streaming', 'cybersecurity', 'exploits', 'poc'],
    difficulty: 'advanced'
  },
  {
    id: 'threat-stream-filtering-demo',
    title: '🎯 Filtered Threat Stream Demo',
    category: 'threat_streaming',
    description: 'Demonstrates advanced filtering: only critical threats for your tech stack',
    systemPrompt: `You are filtering threat intelligence specifically for a company running:
- Linux servers (Ubuntu, RHEL)
- Apache/Nginx web servers
- PostgreSQL databases
- Docker containers
- AWS cloud infrastructure

Filter incoming threats to show ONLY those affecting these technologies. For each relevant threat:
1. Explain why it's relevant to the tech stack
2. Rate severity for this specific environment
3. Provide specific remediation steps

Ignore threats that don't affect this stack.`,
    userPrompt: 'Monitor threats relevant to our specific technology stack',
    expectedBehavior: 'Smart filtering reduces noise by 90%, showing only actionable threats for your environment',
    requiredSettings: {
      model: 'grok-4-fast',
      temperature: 0.3,
      maxTokens: 1000,
      toolsEnabled: ['x_search'],
      streamConfig: {
        type: 'cve_monitor',
        keywords: [
          'Linux CVE',
          'Apache CVE',
          'Nginx CVE',
          'PostgreSQL CVE',
          'Docker CVE',
          'AWS security'
        ],
        accounts: []
      }
    },
    tags: ['streaming', 'cybersecurity', 'filtering', 'customization'],
    difficulty: 'advanced'
  }
];

/**
 * Quick start guide for threat streaming test cases
 */
export const THREAT_STREAMING_GUIDE = `
# 🔴 ThreatPulse Live Streaming - Quick Start

## How to Use These Test Cases

1. **Select a Test Case** from the "Tests" panel
2. **Click "Load"** to populate the configuration
3. **Switch to appropriate mode** (will be implemented in frontend)
4. **Click "Start Stream"** to begin monitoring

## What Each Test Case Does

### 🔴 Live CVE Monitor
- **Purpose:** Early warning for new vulnerabilities
- **Use Case:** Security teams need to know about CVEs within minutes
- **Demo Flow:** Shows real CVE tweets → Grok analysis → Severity rating
- **Impact:** Respond to critical vulns hours or days before competitors

### 🚨 Data Breach Tracker  
- **Purpose:** Immediate awareness of breach announcements
- **Use Case:** Know if you're affected or if partners are compromised
- **Demo Flow:** Detects breach news → Identifies companies → Impact assessment
- **Impact:** Early warning allows faster incident response

### 👥 Security Researcher Feed
- **Purpose:** Curated threat intel from experts
- **Use Case:** Stay ahead by following researcher insights
- **Demo Flow:** Aggregates expert tweets → Highlights trends → Synthesizes insights
- **Impact:** Your own personal threat intel team

### ⚡ Exploit & PoC Tracker
- **Purpose:** Know when exploits go public
- **Use Case:** Prioritize patching when exploit code is released
- **Demo Flow:** Detects PoC release → Severity assessment → Patching urgency
- **Impact:** Patch critical systems before mass exploitation

### 🎯 Filtered Threat Stream
- **Purpose:** Reduce noise, show only relevant threats
- **Use Case:** Different teams need different threat feeds
- **Demo Flow:** All threats → Smart filtering → Only relevant alerts
- **Impact:** 90% noise reduction, 100% signal

## Live Demo Script (2 minutes)

**Minute 1: Setup**
- "This is ThreatPulse - live cyber threat intelligence from X"
- Load "Live CVE Monitor" test case
- Click "Start Stream"

**Minute 2: Show Results**
- Point to live alerts appearing
- Show Grok's analysis: severity, exploitability, recommendation
- "We just detected this CVE 2 minutes after it was tweeted"
- "Traditional threat feeds? 6-24 hour delay. We're instant."

## Why This Wins

- **Speed:** Minutes vs hours/days
- **Intelligence:** Not just data, but analysis
- **Actionable:** Tells you what to DO
- **Scalable:** Monitor multiple threat types simultaneously
- **X API Excellence:** Real-time streaming + Grok analysis = unbeatable combo
`;
