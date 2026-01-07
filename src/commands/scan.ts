#!/usr/bin/env node
/**
 * Manual quality scan command
 * Run: node dist/commands/scan.js [--all]
 */

import { scanDirectory, formatDetailedReport } from '../quality/index.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const scanAll = args.includes('--all');
  const cwd = process.cwd();

  console.log(`Scanning ${scanAll ? 'all files' : 'changed files'} in ${cwd}...\n`);

  const result = await scanDirectory(cwd, {
    changedFilesOnly: !scanAll,
  });

  console.log(formatDetailedReport(result));
}

main().catch((error) => {
  console.error('Scan failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
