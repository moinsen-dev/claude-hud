---
description: Enable or disable claude-hud automation (auto-continue, checklist)
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Enable/Disable Claude HUD Automation

This command configures automation features for claude-hud:
- **Auto-Continue**: Automatically continue when todos are incomplete
- **Checklist Runner**: Run verification checklist when todos complete

## Step 1: Detect Platform & Runtime

**macOS/Linux** (if `uname -s` returns "Darwin", "Linux", or a MINGW*/MSYS*/CYGWIN* variant):

1. Get plugin path:
   ```bash
   ls -td ~/.claude/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | head -1
   ```
   If empty, the plugin is not installed. Tell user to install via marketplace first.

2. Get runtime absolute path (prefer bun for performance, fallback to node):
   ```bash
   command -v bun 2>/dev/null || command -v node 2>/dev/null
   ```

3. Determine source file based on runtime:
   If result basename is "bun", use `src/hooks/index.ts`. Otherwise use `dist/hooks/index.js`.

**Windows** (native PowerShell):

1. Get plugin path:
   ```powershell
   (Get-ChildItem "$env:USERPROFILE\.claude\plugins\cache\claude-hud\claude-hud" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
   ```

2. Get runtime:
   ```powershell
   if (Get-Command bun -ErrorAction SilentlyContinue) { (Get-Command bun).Source } elseif (Get-Command node -ErrorAction SilentlyContinue) { (Get-Command node).Source }
   ```

## Step 2: Read Current Configuration

Read `~/.claude/plugins/claude-hud/config.json` to get current automation settings.

Default values if not configured:
- `automation.autoContinue.enabled`: false
- `automation.autoContinue.maxIterations`: 10
- `automation.checklist.enabled`: true
- `automation.checklist.paths`: [] (empty = use hierarchy search)

## Step 3: Ask User for Features

Use AskUserQuestion:
- header: "Automation"
- question: "Which automation features do you want to enable?"
- multiSelect: true
- options:
  - label: "Auto-Continue"
    description: "Automatically continue when todos are incomplete (disabled by default)"
  - label: "Checklist Runner"
    description: "Run verification checklist when all todos complete (enabled by default)"

## Step 4: Safety Warning for Auto-Continue

If user enables Auto-Continue, show this warning and ask for confirmation:

```
SAFETY WARNING: Auto-continue will keep Claude working until all todos
are completed or the maximum iteration limit (default: 10) is reached.

This prevents infinite loops but may still use significant API credits.

Do you want to proceed with enabling auto-continue?
```

Use AskUserQuestion:
- header: "Confirm"
- question: "Enable auto-continue with these safety limits?"
- options:
  - label: "Yes, enable"
    description: "Enable with default max 10 iterations"
  - label: "No, skip"
    description: "Keep auto-continue disabled"

## Step 5: Update Plugin Configuration

Update `~/.claude/plugins/claude-hud/config.json` with the automation settings:

```json
{
  "automation": {
    "autoContinue": {
      "enabled": true,
      "maxIterations": 10
    },
    "checklist": {
      "enabled": true,
      "paths": []
    }
  }
}
```

Merge with existing config, preserving other settings.

## Step 6: Configure Stop Hook

If any automation is enabled, add the Stop hook to `~/.claude/settings.json`:

**macOS/Linux command format:**
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": {},
        "hooks": [
          {
            "type": "command",
            "command": "bash -c '\"{RUNTIME}\" \"$(ls -td ~/.claude/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | head -1){SOURCE}\" stop'"
          }
        ]
      }
    ]
  }
}
```

**Windows command format:**
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": {},
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"& {$p=(Get-ChildItem $env:USERPROFILE\\.claude\\plugins\\cache\\claude-hud\\claude-hud | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName; & '{RUNTIME}' (Join-Path $p '{SOURCE}') stop}\""
          }
        ]
      }
    ]
  }
}
```

Replace `{RUNTIME}` with the detected runtime path and `{SOURCE}` with the appropriate source file.

If all automation is disabled, remove the Stop hook entry for claude-hud.

Merge with existing hooks config, preserving other hooks.

## Step 7: Verify Configuration

Read back both config files and confirm:
1. Plugin config has correct automation settings
2. Settings.json has the Stop hook configured (if automation enabled)

Report success to user with summary of what was configured.

## Step 8: Next Steps

Tell the user:
- If checklist is enabled, create a `checklist.md` file (run `/claude-hud:create-checklist`)
- The automation will take effect on the next Claude session
- To test, start a new session with a todo list and complete all items
