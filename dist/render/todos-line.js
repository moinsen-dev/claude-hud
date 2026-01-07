import { yellow, green, dim, cyan } from './colors.js';
export function renderTodosLine(ctx) {
    const { todos } = ctx.transcript;
    const { checklist } = ctx;
    // Format checklist info if available
    const checklistPart = formatChecklistPart(checklist);
    if (!todos || todos.length === 0) {
        // Show checklist even if no todos
        if (checklistPart) {
            return checklistPart;
        }
        return null;
    }
    const inProgress = todos.find((t) => t.status === 'in_progress');
    const completed = todos.filter((t) => t.status === 'completed').length;
    const total = todos.length;
    if (!inProgress) {
        if (completed === total && total > 0) {
            const todoPart = `${green('✓')} All todos complete ${dim(`(${completed}/${total})`)}`;
            return checklistPart ? `${todoPart} ${dim('|')} ${checklistPart}` : todoPart;
        }
        // Show checklist even when no in-progress todo
        if (checklistPart) {
            return checklistPart;
        }
        return null;
    }
    const content = truncateContent(inProgress.content);
    const progress = dim(`(${completed}/${total})`);
    const todoPart = `${yellow('▸')} ${content} ${progress}`;
    return checklistPart ? `${todoPart} ${dim('|')} ${checklistPart}` : todoPart;
}
function formatChecklistPart(checklist) {
    if (!checklist)
        return null;
    const { requiredCount, optionalCount } = checklist;
    const total = requiredCount + optionalCount;
    if (total === 0)
        return null;
    // Format: 📋 3 required, 2 optional
    const parts = [];
    if (requiredCount > 0) {
        parts.push(`${requiredCount} required`);
    }
    if (optionalCount > 0) {
        parts.push(`${optionalCount} optional`);
    }
    return `${cyan('📋')} ${dim(parts.join(', '))}`;
}
function truncateContent(content, maxLen = 50) {
    if (content.length <= maxLen)
        return content;
    return content.slice(0, maxLen - 3) + '...';
}
//# sourceMappingURL=todos-line.js.map