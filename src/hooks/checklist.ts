import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface ChecklistItem {
  text: string;
  required: boolean; // Items prefixed with [!] are required
  verified: boolean; // Items prefixed with [x] are already verified
}

export interface ChecklistResult {
  path: string;
  items: ChecklistItem[];
}

/**
 * Find checklist.md in hierarchy:
 * 1. cwd/checklist.md
 * 2. cwd/.claude/checklist.md
 * 3. ~/.claude/checklist.md
 *
 * @param cwd Current working directory
 * @param overridePaths Optional paths to search first (from config)
 * @returns Path to checklist file, or null if not found
 */
export function findChecklist(cwd: string, overridePaths?: string[]): string | null {
  // If override paths are provided, search them first
  if (overridePaths && overridePaths.length > 0) {
    for (const p of overridePaths) {
      const expanded = p.replace(/^~/, os.homedir());
      if (fs.existsSync(expanded)) {
        return expanded;
      }
    }
  }

  // Default search hierarchy
  const searchPaths = [
    path.join(cwd, 'checklist.md'),
    path.join(cwd, '.claude', 'checklist.md'),
    path.join(os.homedir(), '.claude', 'checklist.md'),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Parse checklist.md format:
 * - [ ] Normal item - checked but not required
 * - [!] Required item - MUST pass for checklist to succeed
 * - [x] Already verified - skip verification
 *
 * Lines starting with # or ## are section headers (ignored)
 * Empty lines and other content are ignored
 */
export function parseChecklist(checklistPath: string): ChecklistItem[] {
  try {
    const content = fs.readFileSync(checklistPath, 'utf-8');
    const items: ChecklistItem[] = [];

    for (const line of content.split('\n')) {
      // Match checkbox patterns: - [ ], - [!], - [x]
      const match = line.match(/^-\s*\[([!\sx])\]\s*(.+)$/);
      if (match) {
        const marker = match[1];
        const text = match[2].trim();

        items.push({
          text,
          required: marker === '!',
          verified: marker.toLowerCase() === 'x',
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Get unverified checklist items (items that need to be checked)
 */
export function getUnverifiedItems(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((item) => !item.verified);
}

/**
 * Get required unverified items (items that MUST pass)
 */
export function getRequiredUnverifiedItems(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((item) => item.required && !item.verified);
}

/**
 * Format checklist items for display in systemMessage
 */
export function formatChecklistForMessage(items: ChecklistItem[], checklistPath: string): string {
  const unverified = getUnverifiedItems(items);
  const required = getRequiredUnverifiedItems(items);

  if (unverified.length === 0) {
    return `All ${items.length} checklist items already verified.`;
  }

  const lines: string[] = [
    `Running checklist from ${checklistPath}`,
    `${unverified.length} items to verify (${required.length} required):`,
    '',
  ];

  for (const item of unverified) {
    const prefix = item.required ? '[!]' : '[ ]';
    lines.push(`${prefix} ${item.text}`);
  }

  return lines.join('\n');
}
