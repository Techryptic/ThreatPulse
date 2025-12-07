export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Prompt {
  id?: number;
  timestamp?: string;
  model: string;
  system_prompt: string;
  systemPrompt?: string;
  user_prompt: string;
  userPrompt?: string;
  response?: string;
  responseContent?: string;
  temperature: number;
  max_tokens: number;
  maxTokens?: number;
  topP?: number;
  cost?: number;
  usage?: string;
  promptTokens?: number;
  completionTokens?: number;
  reasoningTokens?: number;
  cachedTokens?: number;
  totalTokens?: number;
  toolsEnabled?: boolean;
  citations?: any[];
  error?: string;
}

export interface PromptRequest {
  systemPrompt?: string;
  userPrompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  toolsEnabled?: string[];
  functions?: any[];
  reasoningEffort?: 'low' | 'high';
  searchParameters?: any;
  images?: string[];
  tools?: any[];
  toolChoice?: string | { type: 'function'; function: { name: string } };
}

export const AVAILABLE_MODELS = [
  // Grok 4 Models (Latest)
  { id: 'grok-4', name: 'Grok 4', value: 'grok-4', label: 'Grok 4 (recommended)' },
  { id: 'grok-4-latest', name: 'Grok 4 Latest', value: 'grok-4-latest', label: 'Grok 4 (latest)' },
  { id: 'grok-4-0709', name: 'Grok 4 (07/09)', value: 'grok-4-0709', label: 'Grok 4 (07/09)' },
  { id: 'grok-4-fast', name: 'Grok 4 Fast', value: 'grok-4-fast', label: 'Grok 4 Fast (best for tools)' },
  { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning', value: 'grok-4-fast-reasoning', label: 'Grok 4 Fast reasoning' },
  { id: 'grok-4-fast-non-reasoning', name: 'Grok 4 Fast Non-Reasoning', value: 'grok-4-fast-non-reasoning', label: 'Grok 4 Fast (non-reasoning)' },
  
  // Grok 3 Models
  { id: 'grok-3', name: 'Grok 3', value: 'grok-3', label: 'Grok 3' },
  { id: 'grok-3-latest', name: 'Grok 3 Latest', value: 'grok-3-latest', label: 'Grok 3 (latest)' },
  { id: 'grok-3-beta', name: 'Grok 3 Beta', value: 'grok-3-beta', label: 'Grok 3 (beta)' },
  { id: 'grok-3-fast', name: 'Grok 3 Fast', value: 'grok-3-fast', label: 'Grok 3 Fast' },
  { id: 'grok-3-fast-latest', name: 'Grok 3 Fast Latest', value: 'grok-3-fast-latest', label: 'Grok 3 Fast (latest)' },
  { id: 'grok-3-fast-beta', name: 'Grok 3 Fast Beta', value: 'grok-3-fast-beta', label: 'Grok 3 Fast (beta)' },
  { id: 'grok-3-mini', name: 'Grok 3 Mini', value: 'grok-3-mini', label: 'Grok 3 Mini (reasoning)' },
  { id: 'grok-3-mini-latest', name: 'Grok 3 Mini Latest', value: 'grok-3-mini-latest', label: 'Grok 3 Mini (latest)' },
  { id: 'grok-3-mini-beta', name: 'Grok 3 Mini Beta', value: 'grok-3-mini-beta', label: 'Grok 3 Mini (beta)' },
  { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast', value: 'grok-3-mini-fast', label: 'Grok 3 Mini Fast' },
  { id: 'grok-3-mini-fast-latest', name: 'Grok 3 Mini Fast Latest', value: 'grok-3-mini-fast-latest', label: 'Grok 3 Mini Fast (latest)' },
  { id: 'grok-3-mini-fast-beta', name: 'Grok 3 Mini Fast Beta', value: 'grok-3-mini-fast-beta', label: 'Grok 3 Mini Fast (beta)' },
  
  // Grok 2 Models
  { id: 'grok-2-1212', name: 'Grok 2 (12/12)', value: 'grok-2-1212', label: 'Grok 2 (12/12)' },
  { id: 'grok-2', name: 'Grok 2', value: 'grok-2', label: 'Grok 2' },
  { id: 'grok-2-latest', name: 'Grok 2 Latest', value: 'grok-2-latest', label: 'Grok 2 (latest)' },
  { id: 'grok-2-vision-1212', name: 'Grok 2 Vision (12/12)', value: 'grok-2-vision-1212', label: 'Grok 2 Vision (12/12)' },
  { id: 'grok-2-vision', name: 'Grok 2 Vision', value: 'grok-2-vision', label: 'Grok 2 Vision' },
  { id: 'grok-2-vision-latest', name: 'Grok 2 Vision Latest', value: 'grok-2-vision-latest', label: 'Grok 2 Vision (latest)' },
  
  // Image Generation Models
  { id: 'grok-2-image-1212', name: 'Grok 2 Image (12/12)', value: 'grok-2-image-1212', label: 'Grok 2 Image (12/12)' },
  { id: 'grok-2-image', name: 'Grok 2 Image', value: 'grok-2-image', label: 'Grok 2 Image' },
  { id: 'grok-2-image-latest', name: 'Grok 2 Image Latest', value: 'grok-2-image-latest', label: 'Grok 2 Image (latest)' },
  
  // Legacy/Beta
  { id: 'grok-beta', name: 'Grok Beta', value: 'grok-beta', label: 'Grok (beta)' },
];

export const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', value: 'web_search', label: 'Web Search' },
  { id: 'x_search', name: 'X Search', value: 'x_search', label: 'X Search' },
  { id: 'news_search', name: 'News Search', value: 'news_search', label: 'News Search' },
  { id: 'collections_search', name: 'Collections Search', value: 'collections_search', label: 'Collections Search' },
  { id: 'code_execution', name: 'Code Execution', value: 'code_execution', label: 'Code Execution' },
];

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export interface FunctionParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enum?: string[];
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: FunctionParameter[];
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
}

export interface ChatRequest {
  messages: (Message | { role: 'user'; content: Array<{ type: 'text'; text: string } | ImageContent> })[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: string | { type: 'function'; function: { name: string } };
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ToolUsageDetail {
  tool_name: string;
  count: number;
  cost: number;
}

export interface CostBreakdown {
  token_cost: number;
  tool_cost: number;
  tool_usage: ToolUsageDetail[];
  total_cost: number;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
  usage: Usage;
  cost_breakdown?: CostBreakdown;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  model: string;
  system_prompt: string;
  user_prompt: string;
  response: string;
  temperature: number;
  max_tokens: number;
  cost: number;
  usage: string;
  images?: string;
  tools_used?: string;
  mode?: string;
  workflow?: string;
}

// New types for advanced modes
export type AppMode = 'standard' | 'research' | 'agent' | 'threat' | 'rl_threat';

export interface ResearchStep {
  id: string;
  type: 'search' | 'analyze' | 'code' | 'synthesize';
  status: 'pending' | 'running' | 'completed' | 'failed';
  query?: string;
  results?: string;
  timestamp?: number;
  cost?: number;
}

export interface ResearchSession {
  question: string;
  steps: ResearchStep[];
  finalSynthesis?: string;
  totalCost: number;
  startTime: number;
  endTime?: number;
}

export interface AgentStep {
  id: string;
  type: 'web_search' | 'x_search' | 'news_search' | 'code_execution' | 'collections_search' | 'synthesis';
  label: string;
  prompt: string;  // The instruction/prompt for this step
  usePreviousOutput: boolean;  // Whether to include previous step's output
  config: {
    query?: string;
    code?: string;
    max_results?: number;
    time_filter?: string;
    from_date?: string;
    to_date?: string;
    allowed_x_handles?: string[];
    excluded_x_handles?: string[];
    allowed_domains?: string[];
    excluded_domains?: string[];
    enable_image_understanding?: boolean;
    enable_video_understanding?: boolean;
    [key: string]: any;  // Allow additional dynamic properties
  };
}

export interface WorkflowVariable {
  name: string;
  value: string;
  description?: string;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: AgentStep[];
  variables?: WorkflowVariable[];  // Initial input variables
  isPreset?: boolean;
}

export interface AgentExecution {
  workflowId: string;
  startTime: number;
  endTime?: number;
  steps: Array<{
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    input?: string;
    output?: string;
    cost?: number;
    timestamp: number;
  }>;
  totalCost: number;
}

// Preset templates
export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  mode: AppMode;
  systemPrompt: string;
  userPromptTemplate: string;
  tools?: string[];
  workflow?: AgentWorkflow;
}

// Live Streaming Types
export interface ThreatAlert {
  id: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: 'cve' | 'breach' | 'exploit' | 'ransomware' | 'general';
  title: string;
  description: string;
  source: {
    tweet_id: string;
    author: string;
    author_handle: string;
    content: string;
    url: string;
  };
  entities?: {
    cve_ids?: string[];
    companies?: string[];
    products?: string[];
    threat_actors?: string[];
  };
  analysis?: {
    exploitability: string;
    impact: string;
    recommendation: string;
  };
}

export interface StreamStats {
  totalTweets: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
}

export interface StreamConfig {
  id: string;
  name: string;
  keywords: string[];
  accounts?: string[];
  active: boolean;
  alertCount: number;
}

export interface LiveStreamSession {
  sessionId: string;
  config: StreamConfig;
  alerts: ThreatAlert[];
  startTime: number;
  stats: {
    totalTweets: number;
    criticalAlerts: number;
    highAlerts: number;
    mediumAlerts: number;
    lowAlerts: number;
  };
}

// RL Threat Intelligence Types
export interface RLThreatPrediction {
  id: string;
  cve_id: string;
  tweet_id: string;
  timestamp: number;
  predicted_severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  x_engagement: {
    retweets: number;
    likes: number;
    replies: number;
    expert_engagement: number;
    velocity: number; // retweets per hour
  };
  grok_analysis?: {
    reasoning: string;
    impact_assessment: string;
    recommendation: string;
  };
  actual_severity?: 'critical' | 'high' | 'medium' | 'low';
  was_correct?: boolean;
}

export interface RLModelStats {
  total_predictions: number;
  correct_predictions: number;
  false_positives: number;
  false_negatives: number;
  accuracy: number;
  precision: number;
  recall: number;
}

export interface RLLearningProgress {
  week: number;
  accuracy: number;
  total_samples: number;
  start_date: string;
  end_date: string;
}

export interface EngagementPattern {
  pattern_type: 'fast_spike' | 'slow_burn' | 'expert_consensus' | 'community_doubt';
  description: string;
  typical_outcome: 'critical' | 'false_alarm' | 'moderate';
  confidence: number;
  example_cves: string[];
}
