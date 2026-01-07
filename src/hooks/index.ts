import { fileURLToPath } from 'node:url';
import { runStopHook } from './stop-hook.js';

/**
 * Hook entry point
 * Determines which hook to run based on argv
 *
 * Usage: node dist/hooks/index.js [hook-type]
 * - stop: Stop hook (default)
 */
async function main(): Promise<void> {
  const hookType = process.argv[2] || 'stop';

  switch (hookType) {
    case 'stop':
      await runStopHook();
      break;
    default:
      console.error(JSON.stringify({
        continue: false,
        stopReason: `Unknown hook type: ${hookType}`,
      }));
      process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}

export { main };
