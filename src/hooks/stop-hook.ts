import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseTranscript } from '../transcript.js';
import { loadAutomationConfig } from './automation-config.js';
import {
  findChecklist,
  parseChecklist,
  getUnverifiedItems,
  formatChecklistForMessage,
} from './checklist.js';
import { scanDirectory, formatForChecklist } from '../quality/index.js';

export interface StopHookInput {
  session_id?: string;
  transcript_path?: string;
  hook_event_name?: string;
  stop_hook_active?: boolean;
  cwd?: string;
}

export interface StopHookOutput {
  continue: boolean;
  systemMessage?: string;
  stopReason?: string;
}

/**
 * Read JSON from stdin (piped from Claude Code)
 */
async function readStdinJson(): Promise<StopHookInput> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve({});
      return;
    }

    let data = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });

    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data) as StopHookInput);
      } catch {
        resolve({});
      }
    });

    // Timeout after 1 second if no data
    setTimeout(() => resolve({}), 1000);
  });
}

/**
 * Output JSON to stdout for Claude Code to consume
 */
function outputJson(output: StopHookOutput): void {
  console.log(JSON.stringify(output));
}

/**
 * Get iteration state file path for a session
 */
function getIterationStatePath(sessionId: string): string {
  return path.join(os.tmpdir(), `claude-hud-iterations-${sessionId}.json`);
}

/**
 * Track and check iteration count to prevent infinite loops
 */
function checkAndIncrementIterations(sessionId: string, maxIterations: number): boolean {
  const statePath = getIterationStatePath(sessionId);

  let iterations = 0;
  try {
    if (fs.existsSync(statePath)) {
      const content = fs.readFileSync(statePath, 'utf-8');
      const state = JSON.parse(content);
      iterations = state.iterations ?? 0;
    }
  } catch {
    // Start fresh if state file is corrupted
  }

  if (iterations >= maxIterations) {
    return false; // Limit reached
  }

  // Increment and save
  try {
    fs.writeFileSync(statePath, JSON.stringify({ iterations: iterations + 1 }), 'utf-8');
  } catch {
    // Continue even if we can't save state
  }

  return true;
}

/**
 * Main stop hook logic
 */
export async function runStopHook(): Promise<void> {
  try {
    const stdin = await readStdinJson();
    const config = await loadAutomationConfig();

    // Guard: If stop_hook_active is true, Claude Code is already running a hook
    // Return immediately to prevent recursive loops
    if (stdin.stop_hook_active) {
      outputJson({ continue: false, stopReason: 'Hook already active' });
      return;
    }

    // If auto-continue is disabled and checklist is disabled, don't interfere
    if (!config.autoContinue.enabled && !config.checklist.enabled) {
      outputJson({ continue: false });
      return;
    }

    // Parse transcript to get todo state
    const transcriptPath = stdin.transcript_path ?? '';
    const transcript = await parseTranscript(transcriptPath);
    const { todos } = transcript;

    // Count todo states
    const pending = todos.filter((t) => t.status === 'pending');
    const inProgress = todos.filter((t) => t.status === 'in_progress');
    const completed = todos.filter((t) => t.status === 'completed');
    const total = todos.length;

    // Case 1: All todos completed (or no todos) - check if we should run quality scan and/or checklist
    if (pending.length === 0 && inProgress.length === 0) {
      const cwd = stdin.cwd ?? process.cwd();
      const messages: string[] = total > 0 ? [`All ${total} todos completed!`] : [];
      let shouldContinue = false;

      // Run quality scan on changed files
      if (config.qualityScan?.enabled !== false) {
        const scanResult = await scanDirectory(cwd, {
          patterns: config.qualityScan?.patterns,
          exclude: config.qualityScan?.exclude,
          treatAsError: config.qualityScan?.treatAsError,
          changedFilesOnly: true,
        });

        if (scanResult.issues.length > 0) {
          const qualityMessage = formatForChecklist(scanResult);
          if (qualityMessage) {
            messages.push('');
            messages.push(qualityMessage);
            shouldContinue = true;
          }
        }
      }

      // Run checklist if enabled
      if (config.checklist.enabled) {
        const checklistPath = findChecklist(cwd, config.checklist.paths);

        if (checklistPath) {
          const items = parseChecklist(checklistPath);
          const unverified = getUnverifiedItems(items);

          if (unverified.length > 0) {
            const checklistMessage = formatChecklistForMessage(items, checklistPath);
            messages.push('');
            messages.push(checklistMessage);
            shouldContinue = true;
          }
        }
      }

      if (shouldContinue) {
        outputJson({
          continue: true,
          systemMessage: messages.join('\n'),
        });
        return;
      }

      // All done, no issues found
      outputJson({
        continue: false,
        stopReason: total > 0 ? 'All todos completed' : 'No pending work',
      });
      return;
    }

    // Case 2: Incomplete todos - auto-continue if enabled
    if (config.autoContinue.enabled && (pending.length > 0 || inProgress.length > 0)) {
      const sessionId = stdin.session_id ?? 'unknown';

      // Check iteration limit
      if (!checkAndIncrementIterations(sessionId, config.autoContinue.maxIterations)) {
        outputJson({
          continue: false,
          stopReason: `Reached max iterations (${config.autoContinue.maxIterations})`,
        });
        return;
      }

      const remaining = pending.length + inProgress.length;
      const currentTask = inProgress.length > 0 ? inProgress[0].content : pending[0]?.content;

      outputJson({
        continue: true,
        systemMessage: `Auto-continuing: ${remaining} of ${total} todos remaining. Current: "${currentTask}"`,
      });
      return;
    }

    // Case 3: No todos or auto-continue disabled - stop normally
    outputJson({ continue: false });
  } catch (error) {
    // On any error, fail safe by allowing Claude to stop
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    outputJson({
      continue: false,
      stopReason: `Hook error: ${errorMessage}`,
    });
  }
}
