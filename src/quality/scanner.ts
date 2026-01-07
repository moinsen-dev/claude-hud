/**
 * Quality scanner for detecting placeholders, mocks, stubs, and incomplete implementations
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ALL_PATTERNS,
  PatternCategory,
  PatternDefinition,
  isCodeFile,
  shouldExclude,
} from './patterns.js';

const execFileAsync = promisify(execFile);

export interface QualityIssue {
  type: PatternCategory;
  file: string;
  line: number;
  column: number;
  pattern: string;
  message: string;
  severity: 'warning' | 'error';
  context: string; // The line content
}

export interface ScanSummary {
  todo: number;
  stub: number;
  mock: number;
  placeholder: number;
  total: number;
  blocking: number; // Issues that should block completion
}

export interface ScanResult {
  issues: QualityIssue[];
  summary: ScanSummary;
  scannedFiles: number;
  changedFilesOnly: boolean;
}

export interface ScanOptions {
  patterns?: {
    todo?: boolean;
    stub?: boolean;
    mock?: boolean;
    placeholder?: boolean;
  };
  exclude?: string[];
  treatAsError?: PatternCategory[]; // Which categories block completion
  changedFilesOnly?: boolean;
}

const DEFAULT_OPTIONS: Required<ScanOptions> = {
  patterns: {
    todo: true,
    stub: true,
    mock: true,
    placeholder: true,
  },
  exclude: [],
  treatAsError: ['todo', 'stub'], // TODOs and stubs block by default
  changedFilesOnly: true,
};

/**
 * Get list of changed files from git
 */
export async function getChangedFiles(cwd: string): Promise<string[]> {
  try {
    // Get unstaged changes
    const { stdout: unstaged } = await execFileAsync('git', ['diff', '--name-only'], { cwd });
    // Get staged changes
    const { stdout: staged } = await execFileAsync('git', ['diff', '--cached', '--name-only'], { cwd });
    // Get untracked files
    const { stdout: untracked } = await execFileAsync('git', ['ls-files', '--others', '--exclude-standard'], { cwd });

    const files = [
      ...unstaged.split('\n'),
      ...staged.split('\n'),
      ...untracked.split('\n'),
    ]
      .map(f => f.trim())
      .filter(f => f.length > 0)
      .filter(f => isCodeFile(f))
      .filter(f => !shouldExclude(f));

    return [...new Set(files)];
  } catch {
    // Not a git repo or git not available
    return [];
  }
}

/**
 * Scan a single file for quality issues
 */
export function scanFile(
  filePath: string,
  content: string,
  options: ScanOptions = {}
): QualityIssue[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const issues: QualityIssue[] = [];
  const lines = content.split('\n');

  for (const [category, patterns] of Object.entries(ALL_PATTERNS)) {
    const cat = category as PatternCategory;

    // Skip disabled pattern categories
    if (opts.patterns && opts.patterns[cat] === false) {
      continue;
    }

    for (const patternDef of patterns as PatternDefinition[]) {
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const match = line.match(patternDef.pattern);

        if (match) {
          issues.push({
            type: cat,
            file: filePath,
            line: lineNum + 1,
            column: match.index ?? 0,
            pattern: patternDef.pattern.source,
            message: patternDef.message,
            severity: opts.treatAsError?.includes(cat) ? 'error' : 'warning',
            context: line.trim().slice(0, 100),
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Scan a directory for quality issues
 */
export async function scanDirectory(
  cwd: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let files: string[];

  if (opts.changedFilesOnly) {
    files = await getChangedFiles(cwd);
  } else {
    files = getAllCodeFiles(cwd, opts.exclude);
  }

  const issues: QualityIssue[] = [];

  // Process files in parallel
  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.isAbsolute(file) ? file : path.join(cwd, file);

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const fileIssues = scanFile(file, content, opts);
        issues.push(...fileIssues);
      } catch {
        // Skip files that can't be read
      }
    })
  );

  // Sort by file, then line
  issues.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  // Calculate summary
  const summary: ScanSummary = {
    todo: issues.filter(i => i.type === 'todo').length,
    stub: issues.filter(i => i.type === 'stub').length,
    mock: issues.filter(i => i.type === 'mock').length,
    placeholder: issues.filter(i => i.type === 'placeholder').length,
    total: issues.length,
    blocking: issues.filter(i => i.severity === 'error').length,
  };

  return {
    issues,
    summary,
    scannedFiles: files.length,
    changedFilesOnly: opts.changedFilesOnly ?? true,
  };
}

/**
 * Get all code files in a directory (recursive)
 */
function getAllCodeFiles(dir: string, excludePatterns: string[] = []): string[] {
  const files: string[] = [];

  function walk(currentDir: string, relativePath: string = '') {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          if (!shouldExclude(relPath) && !excludePatterns.some(p => relPath.includes(p))) {
            walk(fullPath, relPath);
          }
        } else if (entry.isFile() && isCodeFile(entry.name)) {
          if (!excludePatterns.some(p => relPath.includes(p))) {
            files.push(relPath);
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  walk(dir);
  return files;
}

/**
 * Format scan results for checklist integration
 */
export function formatForChecklist(result: ScanResult): string {
  if (result.issues.length === 0) {
    return '';
  }

  const lines: string[] = [];
  const { summary } = result;

  lines.push(`⚠️ Quality Issues Found (${summary.total} in ${result.changedFilesOnly ? 'changed' : 'all'} files):`);
  lines.push('');

  // Group by type
  if (summary.todo > 0) {
    lines.push(`📍 TODOs/FIXMEs: ${summary.todo} found`);
    const todoIssues = result.issues.filter(i => i.type === 'todo').slice(0, 5);
    for (const issue of todoIssues) {
      lines.push(`  ${issue.file}:${issue.line} - ${issue.context.slice(0, 60)}`);
    }
    if (summary.todo > 5) {
      lines.push(`  ... and ${summary.todo - 5} more`);
    }
    lines.push('');
  }

  if (summary.stub > 0) {
    lines.push(`🔧 Stub Functions: ${summary.stub} found`);
    const stubIssues = result.issues.filter(i => i.type === 'stub').slice(0, 5);
    for (const issue of stubIssues) {
      lines.push(`  ${issue.file}:${issue.line} - ${issue.message}`);
    }
    if (summary.stub > 5) {
      lines.push(`  ... and ${summary.stub - 5} more`);
    }
    lines.push('');
  }

  if (summary.mock > 0) {
    lines.push(`📝 Mock Data: ${summary.mock} found`);
    const mockIssues = result.issues.filter(i => i.type === 'mock').slice(0, 3);
    for (const issue of mockIssues) {
      lines.push(`  ${issue.file}:${issue.line} - ${issue.message}`);
    }
    if (summary.mock > 3) {
      lines.push(`  ... and ${summary.mock - 3} more`);
    }
    lines.push('');
  }

  if (summary.placeholder > 0) {
    lines.push(`🏷️ Placeholders: ${summary.placeholder} found`);
    const placeholderIssues = result.issues.filter(i => i.type === 'placeholder').slice(0, 3);
    for (const issue of placeholderIssues) {
      lines.push(`  ${issue.file}:${issue.line} - ${issue.message}`);
    }
    if (summary.placeholder > 3) {
      lines.push(`  ... and ${summary.placeholder - 3} more`);
    }
    lines.push('');
  }

  if (summary.blocking > 0) {
    lines.push(`Please fix these ${summary.blocking} blocking issues before marking the task as complete.`);
    lines.push('Focus on the TODO comments and stub implementations first.');
  } else {
    lines.push('These are warnings - review if they are intentional.');
  }

  return lines.join('\n');
}

/**
 * Format scan results for detailed report (manual command)
 */
export function formatDetailedReport(result: ScanResult): string {
  const lines: string[] = [];
  const { summary } = result;

  lines.push('Quality Scan Results');
  lines.push('====================');
  lines.push('');
  lines.push(`Scanned ${result.scannedFiles} ${result.changedFilesOnly ? 'changed' : ''} files`);
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('✅ No quality issues found!');
    return lines.join('\n');
  }

  // Group by file
  const byFile = new Map<string, QualityIssue[]>();
  for (const issue of result.issues) {
    const existing = byFile.get(issue.file) ?? [];
    existing.push(issue);
    byFile.set(issue.file, existing);
  }

  for (const [file, issues] of byFile) {
    lines.push(`📄 ${file}`);
    for (const issue of issues) {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      lines.push(`  ${icon} Line ${issue.line}: ${issue.message}`);
      lines.push(`     ${issue.context}`);
    }
    lines.push('');
  }

  lines.push('Summary');
  lines.push('-------');
  lines.push(`📍 TODOs/FIXMEs: ${summary.todo}`);
  lines.push(`🔧 Stubs: ${summary.stub}`);
  lines.push(`📝 Mocks: ${summary.mock}`);
  lines.push(`🏷️ Placeholders: ${summary.placeholder}`);
  lines.push('');
  lines.push(`Total: ${summary.total} issues (${summary.blocking} blocking)`);

  return lines.join('\n');
}
