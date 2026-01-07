---
description: Scan codebase for quality issues (TODOs, stubs, mocks, placeholders)
allowed-tools: Grep, Bash, Read
---

# Quality Scan Command

Run a quality scan on the codebase to detect incomplete implementations.

## Execution Steps

### Step 1: Get Changed Files

First, get the list of changed files (or scan all source files if no changes):

```bash
# Get changed files
git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|py|rs|go|java|dart|swift|kt)$'

# If no changes, fall back to status
git status --porcelain 2>/dev/null | awk '{print $2}' | grep -E '\.(ts|tsx|js|jsx|py|rs|go|java|dart|swift|kt)$'
```

### Step 2: Run Pattern Scans

Run these Grep searches in parallel on the source directories (typically `src/`, `lib/`, or project root).

**Exclude pattern definition files** like `patterns.ts`, `scanner.ts`, test fixtures, and `node_modules`.

#### TODOs/FIXMEs (Blocking ❌)
```
pattern: //\s*(TODO|FIXME|HACK|XXX|BUG|UNDONE):
```

#### Stub Functions (Blocking ❌)
```
pattern: throw\s+new\s+Error\s*\(\s*['"`](not implemented|TODO)
pattern: raise\s+NotImplementedError
pattern: todo!\s*\(\)|unimplemented!\s*\(\)
```

#### Mock Data (Warning ⚠️)
```
pattern: test@example\.com|user@test\.com
pattern: ['"`]John\s+Doe['"`]|['"`]Jane\s+Doe['"`]
pattern: Lorem\s+ipsum
pattern: placeholder\.(png|jpg|svg)
```

#### Placeholders (Warning ⚠️)
```
pattern: ['"`](PLACEHOLDER|CHANGEME|REPLACE_ME)['"`]
pattern: YOUR_[A-Z_]+_HERE
```

### Step 3: Format Report

Present findings in this format:

```
Quality Scan Results
====================

Scanned: [directory or file list]

📄 src/auth.ts
  ❌ Line 42: TODO comment found
     // TODO: implement password hashing
  ❌ Line 50: Not implemented error thrown
     throw new Error('not implemented')

📄 src/test/fixtures.ts
  ⚠️ Line 10: Mock email found
     email: 'test@example.com',

Summary
-------
📍 TODOs/FIXMEs: 1
🔧 Stubs: 1
📝 Mocks: 1
🏷️ Placeholders: 0

Total: 3 issues (2 blocking)
```

## Issue Severity

- **Blocking (❌)**: TODOs and stubs - should be fixed before completion
- **Warning (⚠️)**: Mocks and placeholders - review if intentional

## Important Notes

- **Exclude pattern definitions**: Files like `patterns.ts` or `scanner.ts` that define the patterns themselves should be excluded from results
- **Exclude test fixtures**: Test data files are expected to have mock data
- **Focus on source files**: Only scan code files, not configs or docs
