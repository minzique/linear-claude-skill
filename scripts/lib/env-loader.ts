/**
 * Auto-load LINEAR_API_KEY from known .env locations.
 *
 * Bun auto-loads .env only when CWD matches the project root.
 * When scripts are invoked via absolute path from another directory
 * (e.g. `bun run ~/.claude/skills/linear/scripts/query.ts`),
 * the .env isn't found. This module checks fallback locations.
 *
 * Import this BEFORE reading process.env.LINEAR_API_KEY.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

function loadEnvFile(filePath: string): boolean {
  if (!existsSync(filePath)) return false;

  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  return true;
}

if (!process.env.LINEAR_API_KEY) {
  const home = homedir();
  const candidates = [
    join(home, '.claude', '.env'),           // Claude Code env
    join(home, '.claude', 'skills', 'linear', '.env'),  // Skill-local .env
  ];

  for (const candidate of candidates) {
    if (loadEnvFile(candidate) && process.env.LINEAR_API_KEY) break;
  }
}
