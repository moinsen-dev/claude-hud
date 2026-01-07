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
