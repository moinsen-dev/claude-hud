---
description: Create a checklist.md template for verification workflows
allowed-tools: Read, Write, AskUserQuestion
---

# Create Checklist Template

This command creates a `checklist.md` file that Claude will verify when all todos are completed.

## Checklist Format

The checklist uses a simple markdown checkbox format:
- `- [ ]` Normal item - verified but not required to pass
- `- [!]` Required item - MUST pass for checklist to succeed
- `- [x]` Already verified - skipped during verification

## Step 1: Ask Location

Use AskUserQuestion:
- header: "Location"
- question: "Where should the checklist be created?"
- options:
  - label: "Project (.claude/checklist.md)"
    description: "Only for this project, hidden in .claude folder"
  - label: "Global (~/.claude/checklist.md)"
    description: "Default for all projects without a project checklist"
  - label: "Project Root (checklist.md)"
    description: "Visible in project root directory"

## Step 2: Check for Existing File

Check if a checklist already exists at the chosen location:
- If exists, ask user if they want to overwrite or cancel
- If not exists, proceed to template selection

## Step 3: Ask Template

Use AskUserQuestion:
- header: "Template"
- question: "Choose a checklist template:"
- options:
  - label: "Basic"
    description: "General development checks (tests, lint, build)"
  - label: "TypeScript"
    description: "TypeScript-specific (tsc, eslint, types)"
  - label: "Flutter"
    description: "Flutter app checks (analyze, test, build)"
  - label: "Empty"
    description: "Start with minimal template"

## Step 4: Write Checklist

Write the chosen template to the selected location.

### Basic Template

```markdown
# Completion Checklist

## Required
- [!] All tests pass
- [!] No lint errors
- [!] Code builds successfully

## Recommended
- [ ] Documentation updated if needed
- [ ] No TODO comments left in code
- [ ] Changes follow project conventions
```

### TypeScript Template

```markdown
# TypeScript Checklist

## Required
- [!] `npm run build` succeeds with no errors
- [!] `npm test` passes all tests
- [!] No TypeScript errors (`npx tsc --noEmit`)

## Code Quality
- [ ] No eslint warnings (`npm run lint`)
- [ ] Types are explicit (avoid `any`)
- [ ] Public functions have JSDoc comments
- [ ] No unused imports or variables

## Best Practices
- [ ] Error handling is appropriate
- [ ] No hardcoded values that should be config
- [ ] Tests cover new functionality
```

### Flutter Template

```markdown
# Flutter Checklist

## Required
- [!] `flutter analyze` passes with no issues
- [!] `flutter test` passes all tests
- [!] `flutter build` succeeds for target platform

## Code Quality
- [ ] No dart warnings or hints
- [ ] Widget tests exist for new widgets
- [ ] Localization strings added for new text
- [ ] Proper state management used

## Best Practices
- [ ] Follows project architecture patterns
- [ ] No hardcoded colors/sizes (use theme)
- [ ] Accessibility labels on interactive widgets
- [ ] Loading and error states handled
```

### Empty Template

```markdown
# Completion Checklist

## Required
- [!] Add your required checks here

## Recommended
- [ ] Add your optional checks here
```

## Step 5: Confirm Creation

Tell the user:
- The checklist was created at [path]
- How to customize it (edit the file, add more items)
- When it will run (after all todos are completed)
- How to mark items as required ([!]) vs optional ([ ])

## Step 6: Remind About Automation

If automation is not yet enabled, remind the user:
- Run `/claude-hud:enable-automation` to enable checklist verification
- The checklist won't run automatically until automation is enabled
