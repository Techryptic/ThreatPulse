import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('prompt-lab.db');
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
export function initializeDatabase() {
  try {
    // Create prompts table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        timestamp INTEGER DEFAULT (unixepoch()),
        model TEXT NOT NULL,
        system_prompt TEXT,
        user_prompt TEXT NOT NULL,
        temperature REAL,
        max_tokens INTEGER,
        top_p REAL,
        tools_enabled TEXT,
        search_parameters TEXT,
        enable_reasoning INTEGER,
        functions TEXT,
        tool_calls TEXT,
        tool_results TEXT,
        reasoning_content TEXT,
        encrypted_content TEXT,
        reasoning_effort TEXT,
        file_ids TEXT,
        response_content TEXT,
        citations TEXT,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        reasoning_tokens INTEGER,
        cached_tokens INTEGER,
        total_tokens INTEGER,
        tool_usage TEXT,
        images TEXT,
        error TEXT,
        tags TEXT,
        response_time INTEGER
      )
    `);

    // Create comparisons table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS comparisons (
        id TEXT PRIMARY KEY,
        prompt_a_id TEXT NOT NULL,
        prompt_b_id TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // Create workflows table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        steps TEXT NOT NULL,
        variables TEXT,
        is_preset INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// For backwards compatibility
export function runMigrations() {
  initializeDatabase();
}
