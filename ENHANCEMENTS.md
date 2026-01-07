# Claude HUD Enhancements

This document describes the automation features added to Claude HUD to improve AI coding agent workflows.

## Overview

These enhancements address a common problem: AI coding agents often stop prematurely or claim completion when work is incomplete. The automation features help ensure tasks are truly finished before stopping.

## Features

### 1. Auto-Continue (Phase 1)

**Problem:** Claude Code stops and waits for user confirmation when it could continue working on remaining todos.

**Solution:** A Stop hook that automatically continues when todos remain incomplete.

**How it works:**
- Parses the session transcript to detect todo states
- If incomplete todos exist, returns `{ continue: true }` with a status message
- Safety features prevent infinite loops (max iterations, `stop_hook_active` flag)

**Files:**
- [src/hooks/stop-hook.ts](src/hooks/stop-hook.ts) - Main hook logic
- [src/hooks/automation-config.ts](src/hooks/automation-config.ts) - Configuration

### 2. Completion Checklist (Phase 1)

**Problem:** No automated verification that work meets quality standards before completion.

**Solution:** A checklist system that runs when all todos are marked complete.

**How it works:**
- Searches for `checklist.md` in hierarchy: `./` → `./.claude/` → `~/.claude/`
- Parses markdown checkboxes with required `[!]` and optional `[ ]` items
- Prompts Claude to verify each item before stopping

**Checklist format:**
```markdown
## Required
- [!] All tests pass
- [!] No lint errors

## Recommended
- [ ] Documentation updated
```

**Files:**
- [src/hooks/checklist.ts](src/hooks/checklist.ts) - Discovery and parsing
- [commands/create-checklist.md](commands/create-checklist.md) - Template generator

### 3. Quality Scanner (Phase 2)

**Problem:** AI agents claim "done" when they've only added TODOs, stubs, or placeholder data.

**Solution:** Automatic detection of incomplete code patterns in changed files.

**What it detects:**

| Category | Examples |
|----------|----------|
| **TODOs** | `TODO`, `FIXME`, `HACK`, `XXX`, `@todo` |
| **Stubs** | `throw new Error('not implemented')`, `raise NotImplementedError`, `todo!()`, empty returns |
| **Mocks** | `test@example.com`, `John Doe`, `Lorem ipsum` |
| **Placeholders** | `PLACEHOLDER`, `CHANGEME`, `YOUR_API_KEY_HERE` |

**How it works:**
- Uses `git diff` to identify changed files (fast, focused)
- Scans with regex patterns for each category
- Reports issues with file locations and context
- Prompts Claude to fix blocking issues (TODOs, stubs by default)

**Files:**
- [src/quality/patterns.ts](src/quality/patterns.ts) - Regex pattern definitions
- [src/quality/scanner.ts](src/quality/scanner.ts) - Core scanning logic
- [src/quality/index.ts](src/quality/index.ts) - Module exports
- [src/commands/scan.ts](src/commands/scan.ts) - Manual scan command

## Architecture

```
Claude Code stops
    │
    ▼
Stop Hook invoked
    │ stdin: {transcript_path, stop_hook_active, cwd}
    │
    ├─► stop_hook_active=true? → { continue: false }
    │
    ├─► parseTranscript() → check todos
    │
    ├─► Todos incomplete? → { continue: true, systemMessage }
    │
    ├─► Todos complete? → Run quality scan + checklist
    │   │
    │   ├─► Issues found? → { continue: true, systemMessage }
    │   │
    │   └─► All clear? → { continue: false }
    │
    └─► Otherwise → { continue: false }
```

## Configuration

All features are configured in `~/.claude/plugins/claude-hud/config.json`:

```json
{
  "automation": {
    "autoContinue": {
      "enabled": false,
      "maxIterations": 10
    },
    "checklist": {
      "enabled": true,
      "paths": []
    },
    "qualityScan": {
      "enabled": true,
      "patterns": {
        "todo": true,
        "stub": true,
        "mock": true,
        "placeholder": true
      },
      "exclude": [],
      "treatAsError": ["todo", "stub"]
    }
  }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/claude-hud:enable-automation` | Interactive setup for automation features |
| `/claude-hud:create-checklist` | Create checklist.md from templates |
| `/claude-hud:scan` | Manual quality scan of changed files |

## Safety Features

1. **`stop_hook_active` flag** - Claude Code sets this when a hook is running, preventing recursive loops

2. **`maxIterations` limit** - Tracks iterations per session in temp file, stops at limit (default: 10)

3. **Disabled by default** - Auto-continue requires explicit opt-in

4. **Graceful errors** - Any error returns `{ continue: false }` to avoid blocking

5. **Changed files only** - Quality scan focuses on git diff, not entire codebase

## Version History

- **v0.0.5** - Added automation features (auto-continue, checklist, quality scanner)
- **v0.0.4** - Initial release with HUD statusline
