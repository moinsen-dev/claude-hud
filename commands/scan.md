---
description: Scan codebase for quality issues (TODOs, stubs, mocks, placeholders)
allowed-tools: Bash
---

# Quality Scan Command

Run a quality scan on the codebase to detect incomplete implementations.

## What It Detects

### Code Comments
- `TODO`, `FIXME`, `HACK`, `XXX`, `BUG`, `UNDONE`
- `@todo`, `@fixme` annotations

### Stub Functions
- `throw new Error('not implemented')`
- `raise NotImplementedError` (Python)
- `todo!()`, `unimplemented!()` (Rust)
- Functions returning `null`, `undefined`, `[]`, `{}`
- Empty promise returns

### Mock/Placeholder Data
- Test emails: `test@example.com`, `user@test.com`
- Fake names: `John Doe`, `Jane Doe`, `Test User`
- Lorem ipsum text
- Placeholder URLs: `http://example.com`
- Placeholder images: `placeholder.png`

### Placeholder Strings
- `PLACEHOLDER`, `CHANGEME`, `REPLACE_ME`
- `YOUR_*_HERE` patterns
- Placeholder API keys

## Execution

Run the quality scanner on changed files (git diff):

```bash
PLUGIN_DIR=$(ls -td ~/.claude/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | head -1)
node "${PLUGIN_DIR}dist/commands/scan.js"
```

## Output Format

The scan produces a detailed report:

```
Quality Scan Results
====================

Scanned 8 changed files

📄 src/auth.ts
  ❌ Line 42: TODO comment found
     // TODO: implement password hashing
  ❌ Line 50: Not implemented error thrown
     throw new Error('not implemented')

📄 src/test/fixtures.ts
  ⚠️ Line 10: Mock email: test@example.com
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

## Configuration

Quality scan settings in `~/.claude/plugins/claude-hud/config.json`:

```json
{
  "automation": {
    "qualityScan": {
      "enabled": true,
      "patterns": {
        "todo": true,
        "stub": true,
        "mock": true,
        "placeholder": true
      },
      "exclude": ["test/", "fixtures/"],
      "treatAsError": ["todo", "stub"]
    }
  }
}
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable/disable quality scanning |
| `patterns.todo` | `true` | Scan for TODO/FIXME comments |
| `patterns.stub` | `true` | Scan for stub functions |
| `patterns.mock` | `true` | Scan for mock data |
| `patterns.placeholder` | `true` | Scan for placeholder strings |
| `exclude` | `[]` | Glob patterns to skip |
| `treatAsError` | `["todo", "stub"]` | Categories that block completion |
