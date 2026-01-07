/**
 * Quality scanner module
 * Exports all quality scanning functionality
 */

export {
  scanFile,
  scanDirectory,
  getChangedFiles,
  formatForChecklist,
  formatDetailedReport,
  type QualityIssue,
  type ScanResult,
  type ScanSummary,
  type ScanOptions,
} from './scanner.js';

export {
  ALL_PATTERNS,
  TODO_PATTERNS,
  STUB_PATTERNS,
  MOCK_PATTERNS,
  PLACEHOLDER_PATTERNS,
  CODE_EXTENSIONS,
  EXCLUDED_DIRS,
  isCodeFile,
  shouldExclude,
  type PatternCategory,
  type PatternDefinition,
} from './patterns.js';
