import { PresetTemplate, AgentWorkflow } from '../types';

// Pre-built agent workflows
export const AGENT_WORKFLOWS: AgentWorkflow[] = [
  {
    id: 'stock-analyzer',
    name: 'Stock Market Analyzer',
    description: 'Research stock, analyze with code, provide insights',
    isPreset: true,
    variables: [
      { name: 'ticker', value: 'AAPL', description: 'Stock ticker symbol' },
    ],
    steps: [
      {
        id: 'step-1',
        type: 'web_search',
        label: 'Search Latest Stock News',
        prompt: 'Find the latest news, analyst opinions, and financial data about {ticker} stock',
        usePreviousOutput: false,
        config: {
          max_results: 10,
        },
      },
      {
        id: 'step-2',
        type: 'code_execution',
        label: 'Analyze Data with Python',
        prompt: 'Extract key metrics from the search results and calculate technical indicators. Previous data: {step_1_output}',
        usePreviousOutput: true,
        config: {
          code: '# Python code to analyze stock data\nimport json\n# Add analysis logic here',
        },
      },
      {
        id: 'step-3',
        type: 'synthesis',
        label: 'Generate Investment Report',
        prompt: 'Based on the news ({step_1_output}) and analysis ({step_2_output}), create a comprehensive investment report for {ticker}',
        usePreviousOutput: true,
        config: {},
      },
    ],
  },
  {
    id: 'research-assistant',
    name: 'Deep Research Assistant',
    description: 'Multi-step web research with synthesis',
    isPreset: true,
    variables: [
      { name: 'topic', value: 'quantum computing', description: 'Research topic' },
      { name: 'focus', value: 'recent breakthroughs', description: 'What to focus on' },
    ],
    steps: [
      {
        id: 'step-1',
        type: 'web_search',
        label: 'Initial Search',
        prompt: 'Search for comprehensive information about {topic}',
        usePreviousOutput: false,
        config: {
          max_results: 10,
        },
      },
      {
        id: 'step-2',
        type: 'web_search',
        label: 'Follow-up Search',
        prompt: 'Based on {step_1_output}, search specifically for {focus} in {topic}',
        usePreviousOutput: true,
        config: {
          max_results: 10,
        },
      },
      {
        id: 'step-3',
        type: 'synthesis',
        label: 'Synthesize Findings',
        prompt: 'Synthesize all research on {topic} from the searches, focusing on {focus}. Include: {step_1_output} and {step_2_output}',
        usePreviousOutput: true,
        config: {},
      },
    ],
  },
  {
    id: 'fact-checker',
    name: 'Fact Checker',
    description: 'Verify claims with multiple sources',
    isPreset: true,
    variables: [
      { name: 'claim', value: '', description: 'The claim to verify' },
    ],
    steps: [
      {
        id: 'step-1',
        type: 'web_search',
        label: 'Search for Evidence',
        prompt: 'Search for evidence supporting or refuting this claim: {claim}',
        usePreviousOutput: false,
        config: {
          max_results: 15,
        },
      },
      {
        id: 'step-2',
        type: 'news_search',
        label: 'Check News Sources',
        prompt: 'Find recent news articles about: {claim}',
        usePreviousOutput: false,
        config: {
          max_results: 10,
          time_filter: 'week',
        },
      },
      {
        id: 'step-3',
        type: 'synthesis',
        label: 'Verify and Report',
        prompt: 'Based on web evidence ({step_1_output}) and news sources ({step_2_output}), verify this claim: {claim}. Rate as TRUE, FALSE, PARTIALLY TRUE, or UNVERIFIED.',
        usePreviousOutput: true,
        config: {},
      },
    ],
  },
  {
    id: 'trend-analyzer',
    name: 'Trend Analyzer',
    description: 'Analyze trends from news and social data',
    isPreset: true,
    variables: [
      { name: 'industry', value: 'AI technology', description: 'Industry to analyze' },
      { name: 'my_opinion', value: '', description: 'Your perspective to add (optional)' },
    ],
    steps: [
      {
        id: 'step-1',
        type: 'news_search',
        label: 'Search Recent News',
        prompt: 'Find the latest news and developments in {industry} from the past 24 hours',
        usePreviousOutput: false,
        config: {
          max_results: 20,
          time_filter: 'day',
        },
      },
      {
        id: 'step-2',
        type: 'web_search',
        label: 'Search Broader Context',
        prompt: 'Based on the news ({step_1_output}), search for broader market context and historical trends in {industry}',
        usePreviousOutput: true,
        config: {
          max_results: 10,
        },
      },
      {
        id: 'step-3',
        type: 'code_execution',
        label: 'Analyze Trends',
        prompt: 'Analyze the news data ({step_1_output}) to extract trends, sentiment, and patterns using Python',
        usePreviousOutput: true,
        config: {
          code: '# Analyze trends with Python\n# Extract patterns, sentiment, etc.',
        },
      },
      {
        id: 'step-4',
        type: 'synthesis',
        label: 'Create Trend Report',
        prompt: 'Create a comprehensive trend report for {industry} using news ({step_1_output}), context ({step_2_output}), and analysis ({step_3_output}). {my_opinion}',
        usePreviousOutput: true,
        config: {},
      },
    ],
  },
  {
    id: 'sf-ai-networking',
    name: 'SF AI Company Networking - CSV',
    description: 'Find accessible AI professionals (<50K followers, DMs open) and generate CSV with personalized X DM templates',
    isPreset: true,
    variables: [
      {
        name: 'company_search',
        value: 'OpenAI OR Anthropic OR xAI OR Meta OR Google OR Mistral',
        description: 'Companies to search for (use OR between names)'
      },
      {
        name: 'your_pitch',
        value: 'building AI workflows at xAI hackathon',
        description: 'One-line description of what you do'
      },
      {
        name: 'max_followers',
        value: '50000',
        description: 'Maximum follower count (avoid mega-influencers)'
      },
      {
        name: 'max_people',
        value: '30',
        description: 'Maximum number of people to find (10-50 recommended)'
      },
      {
        name: 'from_date',
        value: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Search posts from this date onwards (YYYY-MM-DD, default: 14 days ago)'
      }
    ],
    steps: [
      {
        id: 'step-sf-search',
        type: 'x_search',
        label: 'Find AI People on X',
        prompt: '{company_search} (San Francisco OR SF OR "Bay Area") -filter:retweets',
        usePreviousOutput: false,
        config: {
          from_date: '{from_date}',
        }
      },
      {
        id: 'step-sf-filter',
        type: 'synthesis',
        label: 'Filter & Profile Qualified People',
        prompt: `Analyze {step_1_output}. 

STRICT FILTERING - Only include users who meet ALL these criteria:
✓ Follower count is LESS than {max_followers} (must be reachable, not mega-influencers)
✓ Can receive DMs (check can_dm field = true, skip if false or unknown)
✓ Work at target companies (verify from bio/recent posts)
✓ Based in San Francisco Bay Area
✓ Active poster (posted in last 30 days)
✓ Posted about AI/ML/tech topics

For EACH qualifying person, extract:
- X Handle (with @)
- Full Name
- Follower Count (exact number)
- Can DM: Yes/No
- Company & Role
- Bio Summary (1 sentence)
- Recent Topics (what they post about)

IMPORTANT: 
- Skip anyone with {max_followers}+ followers
- Skip anyone who can't receive DMs
- Limit to top {max_people} most relevant people
- If you find fewer than {max_people}, that's okay - quality over quantity

Format each as a clear profile.`,
        usePreviousOutput: true,
        config: {}
      },
      {
        id: 'step-sf-csv',
        type: 'synthesis',
        label: 'Generate CSV Output',
        prompt: `Create a CSV file from {step_2_output}. 

CSV COLUMNS (in this exact order):
1. Handle - X handle with @ symbol
2. Name - Full name
3. Followers - Follower count as number
4. Company - Company name
5. Role - Job title/role
6. Bio - One sentence bio summary
7. Topics - Key topics they post about (comma-separated)
8. X_DM_Template - Personalized X DM (max 280 chars)

For X_DM_Template:
- Reference something specific from their recent posts
- Mention you're at xAI hackathon (Dec 5-9)
- Casual coffee invite in SF
- Keep under 280 characters
- Make it feel genuine and personal
- Include your pitch: "{your_pitch}"

OUTPUT FORMAT:
- First line: Column headers
- Following lines: One person per line
- Use quotes for fields containing commas
- Escape any internal quotes by doubling them
- No markdown, just raw CSV

Example row:
@username,"Jane Doe",15000,"xAI","ML Engineer","Building AGI systems","AI safety, LLMs, robotics","Hey! Saw your post on LLM safety. I'm {your_pitch}. Dec 5-9 I'm at xAI hackathon—coffee in SF? Would love to hear about your work!"

Output ONLY the CSV data, nothing else.`,
        usePreviousOutput: true,
        config: {}
      }
    ]
  },
];

// Preset templates for quick access
export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Deep dive into any topic with multi-step web research',
    icon: '🔍',
    mode: 'research',
    systemPrompt: `You are an expert research assistant. When given a research question:
1. Break it down into sub-questions
2. Search the web for each sub-question
3. Analyze and synthesize the findings
4. Provide a comprehensive answer with citations
5. Highlight key insights and contradictions

Always cite your sources and be thorough.`,
    userPromptTemplate: 'Research this topic: [Enter your research question]',
    tools: ['web_search', 'news_search'],
  },
  {
    id: 'fact-checker',
    name: 'Fact Checker',
    description: 'Verify claims and statements with multiple sources',
    icon: '✓',
    mode: 'research',
    systemPrompt: `You are a meticulous fact-checker. For any claim:
1. Search for supporting evidence
2. Search for contradicting evidence
3. Check multiple reliable sources
4. Evaluate source credibility
5. Provide a verdict: TRUE, FALSE, PARTIALLY TRUE, or UNVERIFIED

Always show your research process and cite sources.`,
    userPromptTemplate: 'Verify this claim: [Enter claim to fact-check]',
    tools: ['web_search', 'news_search'],
  },
  {
    id: 'stock-analyzer',
    name: 'Stock Market Analyzer',
    description: 'Research stocks and provide data-driven insights',
    icon: '📈',
    mode: 'agent',
    systemPrompt: `You are a financial analyst. For any stock:
1. Search for latest news and developments
2. Analyze price trends and market sentiment
3. Use Python to calculate metrics if needed
4. Provide investment insights with risk assessment

Be data-driven and cite all sources.`,
    userPromptTemplate: 'Analyze this stock: [Enter ticker symbol]',
    tools: ['web_search', 'news_search', 'code_execution'],
    workflow: AGENT_WORKFLOWS.find(w => w.id === 'stock-analyzer'),
  },
  {
    id: 'news-aggregator',
    name: 'News Aggregator',
    description: 'Get latest news on any topic with smart summaries',
    icon: '📰',
    mode: 'research',
    systemPrompt: `You are a news curator. For any topic:
1. Search for the most recent and relevant news
2. Identify key themes and developments
3. Summarize each major story
4. Highlight contradictions or different perspectives
5. Provide a concise executive summary

Focus on recency and relevance.`,
    userPromptTemplate: 'Latest news on: [Enter topic]',
    tools: ['news_search', 'web_search'],
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    description: 'Search for data, analyze with Python, visualize results',
    icon: '📊',
    mode: 'agent',
    systemPrompt: `You are a data scientist. For any data analysis task:
1. Search for relevant datasets or information
2. Write Python code to analyze the data
3. Execute the code and interpret results
4. Provide insights and visualizations (describe them)
5. Make data-driven recommendations

Show all code and explain your methodology.`,
    userPromptTemplate: 'Analyze: [Enter data analysis request]',
    tools: ['web_search', 'code_execution'],
  },
  {
    id: 'competitive-intel',
    name: 'Competitive Intelligence',
    description: 'Research competitors and market positioning',
    icon: '🎯',
    mode: 'research',
    systemPrompt: `You are a competitive intelligence analyst. For any company:
1. Research the company's latest developments
2. Search for competitor information
3. Analyze market positioning and strategies
4. Identify strengths, weaknesses, opportunities, threats
5. Provide strategic insights

Be comprehensive and cite all sources.`,
    userPromptTemplate: 'Analyze competitor: [Enter company name]',
    tools: ['web_search', 'news_search'],
  },
  {
    id: 'trend-spotter',
    name: 'Trend Spotter',
    description: 'Identify and analyze emerging trends',
    icon: '📡',
    mode: 'agent',
    systemPrompt: `You are a trend analyst. For any topic:
1. Search recent news and developments
2. Identify patterns and emerging trends
3. Use data analysis to quantify trends if possible
4. Predict future developments
5. Provide actionable insights

Focus on what's new and changing.`,
    userPromptTemplate: 'Spot trends in: [Enter topic/industry]',
    tools: ['news_search', 'web_search', 'code_execution'],
    workflow: AGENT_WORKFLOWS.find(w => w.id === 'trend-analyzer'),
  },
  {
    id: 'code-debugger',
    name: 'Code Debugger',
    description: 'Debug code with web search and execution',
    icon: '🐛',
    mode: 'agent',
    systemPrompt: `You are an expert debugger. For any code issue:
1. Analyze the code and error
2. Search for similar issues and solutions
3. Test fixes with code execution
4. Verify the solution works
5. Explain the root cause and fix

Provide working code and explanations.`,
    userPromptTemplate: 'Debug this code:\n[Paste your code and error]',
    tools: ['web_search', 'code_execution'],
  },
  {
    id: 'academic-researcher',
    name: 'Academic Researcher',
    description: 'Research academic topics with scholarly rigor',
    icon: '🎓',
    mode: 'research',
    systemPrompt: `You are an academic researcher. For any scholarly question:
1. Search for academic sources and papers
2. Search for latest research developments
3. Synthesize findings with proper attribution
4. Identify knowledge gaps and controversies
5. Provide a literature review style summary

Maintain academic rigor and cite all sources.`,
    userPromptTemplate: 'Research academic topic: [Enter research question]',
    tools: ['web_search', 'news_search'],
  },
  {
    id: 'tech-explainer',
    name: 'Tech Explainer',
    description: 'Explain complex tech with code examples',
    icon: '💻',
    mode: 'agent',
    systemPrompt: `You are a technical educator. For any tech concept:
1. Search for authoritative explanations
2. Find practical examples and use cases
3. Write code demonstrations
4. Execute code to show it works
5. Provide a clear, comprehensive explanation

Make complex topics accessible with hands-on examples.`,
    userPromptTemplate: 'Explain this technology: [Enter tech concept]',
    tools: ['web_search', 'code_execution'],
  },
];

// Group presets by category
export const PRESET_CATEGORIES = {
  research: PRESET_TEMPLATES.filter(p => p.mode === 'research'),
  agent: PRESET_TEMPLATES.filter(p => p.mode === 'agent'),
  all: PRESET_TEMPLATES,
};
