/**
 * Quality scanner pattern definitions
 * Detects placeholders, mocks, stubs, and incomplete implementations
 */

export interface PatternDefinition {
  pattern: RegExp;
  message: string;
}

export type PatternCategory = 'todo' | 'stub' | 'mock' | 'placeholder';

/**
 * TODO/FIXME comment patterns
 */
export const TODO_PATTERNS: PatternDefinition[] = [
  { pattern: /\bTODO\b/i, message: 'TODO comment found' },
  { pattern: /\bFIXME\b/i, message: 'FIXME comment found' },
  { pattern: /\bHACK\b/i, message: 'HACK comment found' },
  { pattern: /\bXXX\b/i, message: 'XXX marker found' },
  { pattern: /\bBUG\b/i, message: 'BUG comment found' },
  { pattern: /\bUNDONE\b/i, message: 'UNDONE marker found' },
  { pattern: /@todo\b/i, message: '@todo annotation found' },
  { pattern: /@fixme\b/i, message: '@fixme annotation found' },
];

/**
 * Stub/not-implemented patterns
 */
export const STUB_PATTERNS: PatternDefinition[] = [
  // JavaScript/TypeScript
  { pattern: /throw\s+new\s+Error\s*\(\s*['"`]not\s+implemented/i, message: 'Not implemented error thrown' },
  { pattern: /throw\s+new\s+Error\s*\(\s*['"`]TODO/i, message: 'TODO error thrown' },
  { pattern: /throw\s+new\s+NotImplementedError/i, message: 'NotImplementedError thrown' },

  // Python
  { pattern: /raise\s+NotImplementedError/i, message: 'NotImplementedError raised' },
  { pattern: /^\s*pass\s*$/m, message: 'Empty pass statement (potential stub)' },

  // Rust
  { pattern: /todo!\s*\(\s*\)/, message: 'todo!() macro used' },
  { pattern: /unimplemented!\s*\(\s*\)/, message: 'unimplemented!() macro used' },
  { pattern: /panic!\s*\(\s*['"`]not\s+implemented/i, message: 'Not implemented panic' },

  // Empty returns (potential stubs)
  { pattern: /return\s+null\s*;/, message: 'Returns null (potential stub)' },
  { pattern: /return\s+undefined\s*;/, message: 'Returns undefined (potential stub)' },
  { pattern: /return\s+\[\]\s*;/, message: 'Returns empty array (potential stub)' },
  { pattern: /return\s+\{\}\s*;/, message: 'Returns empty object (potential stub)' },

  // Promise stubs
  { pattern: /return\s+Promise\.resolve\s*\(\s*\)/, message: 'Returns empty resolved promise' },
  { pattern: /return\s+Promise\.resolve\s*\(\s*null\s*\)/, message: 'Returns promise resolving to null' },
  { pattern: /return\s+new\s+Promise\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/, message: 'Returns empty promise' },
];

/**
 * Mock/placeholder data patterns
 */
export const MOCK_PATTERNS: PatternDefinition[] = [
  // Fake emails
  { pattern: /test@example\.com/i, message: 'Mock email: test@example.com' },
  { pattern: /user@test\.com/i, message: 'Mock email: user@test.com' },
  { pattern: /foo@bar\.com/i, message: 'Mock email: foo@bar.com' },
  { pattern: /example@domain\.com/i, message: 'Mock email: example@domain.com' },
  { pattern: /admin@localhost/i, message: 'Mock email: admin@localhost' },
  { pattern: /noreply@example/i, message: 'Mock email: noreply@example' },

  // Fake names (be careful - these can have false positives)
  { pattern: /['"`]John\s+Doe['"`]/i, message: 'Mock name: John Doe' },
  { pattern: /['"`]Jane\s+Doe['"`]/i, message: 'Mock name: Jane Doe' },
  { pattern: /['"`]Test\s+User['"`]/i, message: 'Mock name: Test User' },

  // Lorem ipsum
  { pattern: /Lorem\s+ipsum/i, message: 'Lorem ipsum placeholder text' },

  // Placeholder files
  { pattern: /placeholder\.(png|jpg|jpeg|svg|gif|webp)/i, message: 'Placeholder image file' },
  { pattern: /sample\.(png|jpg|jpeg|svg|gif|webp)/i, message: 'Sample image file (potential placeholder)' },

  // Placeholder URLs
  { pattern: /https?:\/\/example\.com/i, message: 'Example.com URL (placeholder)' },
  { pattern: /https?:\/\/placeholder\.com/i, message: 'Placeholder URL' },
  { pattern: /https?:\/\/test\.com/i, message: 'Test.com URL (placeholder)' },
  { pattern: /https?:\/\/localhost:\d+/i, message: 'Localhost URL (may need configuration)' },
];

/**
 * General placeholder patterns
 */
export const PLACEHOLDER_PATTERNS: PatternDefinition[] = [
  // Obvious placeholders
  { pattern: /['"`]PLACEHOLDER['"`]/i, message: 'PLACEHOLDER string found' },
  { pattern: /['"`]CHANGEME['"`]/i, message: 'CHANGEME string found' },
  { pattern: /['"`]REPLACE_ME['"`]/i, message: 'REPLACE_ME string found' },
  { pattern: /['"`]YOUR_.*_HERE['"`]/i, message: 'YOUR_*_HERE placeholder found' },
  { pattern: /['"`]<.*>['"`]/, message: 'Angle bracket placeholder found' },

  // API keys/secrets placeholders
  { pattern: /['"`]sk-[x]+['"`]/i, message: 'Placeholder API key' },
  { pattern: /['"`]api[_-]?key[_-]?here['"`]/i, message: 'API key placeholder' },
  { pattern: /['"`]your[_-]?api[_-]?key['"`]/i, message: 'API key placeholder' },
  { pattern: /['"`]secret[_-]?key[_-]?here['"`]/i, message: 'Secret key placeholder' },
];

/**
 * All patterns grouped by category
 */
export const ALL_PATTERNS: Record<PatternCategory, PatternDefinition[]> = {
  todo: TODO_PATTERNS,
  stub: STUB_PATTERNS,
  mock: MOCK_PATTERNS,
  placeholder: PLACEHOLDER_PATTERNS,
};

/**
 * File extensions to scan by default
 */
export const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.pyi',
  '.rs',
  '.go',
  '.java', '.kt', '.kts',
  '.rb',
  '.php',
  '.swift',
  '.dart',
  '.vue', '.svelte',
  '.c', '.cpp', '.h', '.hpp',
  '.cs',
  '.scala',
  '.ex', '.exs',
]);

/**
 * Directories to exclude from scanning
 */
export const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '__pycache__',
  '.pytest_cache',
  'target',
  'vendor',
  '.venv',
  'venv',
  'env',
  '.tox',
  'coverage',
  '.nyc_output',
]);

/**
 * Check if a file should be scanned based on extension
 */
export function isCodeFile(filePath: string): boolean {
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  return CODE_EXTENSIONS.has(ext.toLowerCase());
}

/**
 * Check if a path should be excluded
 */
export function shouldExclude(filePath: string): boolean {
  const parts = filePath.split(/[/\\]/);
  return parts.some(part => EXCLUDED_DIRS.has(part));
}
