import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  reasoningTokens: number,
  model: string,
  toolUsage?: Record<string, number>
): number {
  // Pricing in USD cents per 100M tokens (from xAI API /v1/language-models endpoint)
  // Converting to price per 1M tokens for calculation
  const pricing: Record<string, { input: number; cachedInput: number; output: number }> = {
    // Grok 4 models
    'grok-4-0709': { input: 0.20, cachedInput: 0, output: 1.00 },
    'grok-4': { input: 0.20, cachedInput: 0, output: 1.00 },
    'grok-4-latest': { input: 0.20, cachedInput: 0, output: 1.00 },
    'grok-4-fast': { input: 0.20, cachedInput: 0, output: 1.00 },
    'grok-4-fast-non-reasoning': { input: 0.20, cachedInput: 0, output: 1.00 },
    'grok-code-fast-1': { input: 0.20, cachedInput: 0, output: 1.00 },
    
    // Grok 3 models
    'grok-3': { input: 0.30, cachedInput: 0.075, output: 1.50 },
    'grok-3-latest': { input: 0.30, cachedInput: 0.075, output: 1.50 },
    'grok-3-mini': { input: 0.03, cachedInput: 0.0075, output: 0.05 },
    'grok-3-mini-latest': { input: 0.03, cachedInput: 0.0075, output: 0.05 },
    
    // Grok 2 Vision/Image models
    'grok-2-vision-1212': { input: 0.20, cachedInput: 0, output: 1.00 },
    'grok-2-image-1212': { input: 1.00, cachedInput: 0, output: 1.00 },
    'grok-2-image': { input: 1.00, cachedInput: 0, output: 1.00 },
  };

  const modelPricing = pricing[model] || pricing['grok-4-0709'];
  
  let totalCost = 
    (promptTokens / 1_000_000) * modelPricing.input +
    (completionTokens / 1_000_000) * modelPricing.output;
  
  // Add reasoning token cost (same as completion tokens for reasoning models)
  if (reasoningTokens > 0) {
    totalCost += (reasoningTokens / 1_000_000) * modelPricing.output;
  }

  // Tool costs (per 1000 calls, free until Nov 21, 2025 - but included for future)
  if (toolUsage) {
    const toolCosts: Record<string, number> = {
      'web_search': 10 / 1000,
      'x_search': 10 / 1000,
      'code_execution': 10 / 1000,
      'document_search': 10 / 1000,
      'collections_search': 2.50 / 1000,
    };

    Object.entries(toolUsage).forEach(([tool, count]) => {
      const cost = toolCosts[tool] || 0;
      totalCost += count * cost;
    });
  }

  return totalCost;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(3)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
