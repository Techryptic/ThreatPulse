import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  
  // Model and prompts
  model: text('model').notNull(),
  systemPrompt: text('system_prompt'),
  userPrompt: text('user_prompt').notNull(),
  
  // Parameters
  temperature: real('temperature').default(0.7),
  maxTokens: integer('max_tokens').default(2000),
  topP: real('top_p').default(0.9),
  
  // xAI specific features
  toolsEnabled: text('tools_enabled', { mode: 'json' }).$type<string[]>(),
  searchParameters: text('search_parameters', { mode: 'json' }).$type<Record<string, any>>(),
  enableReasoning: integer('enable_reasoning', { mode: 'boolean' }).default(false),
  functions: text('functions', { mode: 'json' }).$type<any[]>(),
  toolCalls: text('tool_calls', { mode: 'json' }).$type<any[]>(),
  toolResults: text('tool_results', { mode: 'json' }).$type<any[]>(),
  reasoningContent: text('reasoning_content'),
  encryptedContent: text('encrypted_content'),
  reasoningEffort: text('reasoning_effort'),
  fileIds: text('file_ids', { mode: 'json' }).$type<string[]>(),
  
  // Response
  responseContent: text('response_content'),
  citations: text('citations', { mode: 'json' }).$type<string[]>(),
  
  // Usage tracking
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  reasoningTokens: integer('reasoning_tokens'),
  cachedTokens: integer('cached_tokens'),
  totalTokens: integer('total_tokens'),
  toolUsage: text('tool_usage', { mode: 'json' }).$type<Record<string, number>>(),
  
  // Metadata
  images: text('images', { mode: 'json' }).$type<string[]>(),
  error: text('error'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  
  // Timing
  responseTime: integer('response_time'), // milliseconds
});

export const comparisons = sqliteTable('comparisons', {
  id: text('id').primaryKey(),
  promptAId: text('prompt_a_id').notNull().references(() => prompts.id),
  promptBId: text('prompt_b_id').notNull().references(() => prompts.id),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  steps: text('steps', { mode: 'json' }).$type<any[]>().notNull(),
  variables: text('variables', { mode: 'json' }).$type<any[]>(),
  isPreset: integer('is_preset', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
export type Comparison = typeof comparisons.$inferSelect;
export type NewComparison = typeof comparisons.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
