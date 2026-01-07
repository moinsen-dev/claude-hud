import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
export const DEFAULT_QUALITY_SCAN_CONFIG = {
    enabled: true, // Enabled by default
    patterns: {
        todo: true,
        stub: true,
        mock: true,
        placeholder: true,
    },
    exclude: [],
    treatAsError: ['todo', 'stub'], // TODOs and stubs block by default
};
export const DEFAULT_AUTOMATION_CONFIG = {
    autoContinue: {
        enabled: false, // Disabled by default - user must opt-in
        maxIterations: 10,
    },
    checklist: {
        enabled: true,
        paths: [], // Empty = use default hierarchy
    },
    qualityScan: DEFAULT_QUALITY_SCAN_CONFIG,
};
export const DEFAULT_CONFIG = {
    layout: 'default',
    pathLevels: 1,
    gitStatus: {
        enabled: true,
        showDirty: true,
        showAheadBehind: false,
    },
    display: {
        showModel: true,
        showContextBar: true,
        showConfigCounts: true,
        showDuration: true,
        showTokenBreakdown: true,
        showUsage: true,
        showTools: true,
        showAgents: true,
        showTodos: true,
    },
    automation: DEFAULT_AUTOMATION_CONFIG,
};
export function getConfigPath() {
    const homeDir = os.homedir();
    return path.join(homeDir, '.claude', 'plugins', 'claude-hud', 'config.json');
}
function validatePathLevels(value) {
    return value === 1 || value === 2 || value === 3;
}
function validateLayout(value) {
    return value === 'default' || value === 'separators';
}
function mergeConfig(userConfig) {
    const layout = validateLayout(userConfig.layout)
        ? userConfig.layout
        : DEFAULT_CONFIG.layout;
    const pathLevels = validatePathLevels(userConfig.pathLevels)
        ? userConfig.pathLevels
        : DEFAULT_CONFIG.pathLevels;
    const gitStatus = {
        enabled: typeof userConfig.gitStatus?.enabled === 'boolean'
            ? userConfig.gitStatus.enabled
            : DEFAULT_CONFIG.gitStatus.enabled,
        showDirty: typeof userConfig.gitStatus?.showDirty === 'boolean'
            ? userConfig.gitStatus.showDirty
            : DEFAULT_CONFIG.gitStatus.showDirty,
        showAheadBehind: typeof userConfig.gitStatus?.showAheadBehind === 'boolean'
            ? userConfig.gitStatus.showAheadBehind
            : DEFAULT_CONFIG.gitStatus.showAheadBehind,
    };
    const display = {
        showModel: typeof userConfig.display?.showModel === 'boolean'
            ? userConfig.display.showModel
            : DEFAULT_CONFIG.display.showModel,
        showContextBar: typeof userConfig.display?.showContextBar === 'boolean'
            ? userConfig.display.showContextBar
            : DEFAULT_CONFIG.display.showContextBar,
        showConfigCounts: typeof userConfig.display?.showConfigCounts === 'boolean'
            ? userConfig.display.showConfigCounts
            : DEFAULT_CONFIG.display.showConfigCounts,
        showDuration: typeof userConfig.display?.showDuration === 'boolean'
            ? userConfig.display.showDuration
            : DEFAULT_CONFIG.display.showDuration,
        showTokenBreakdown: typeof userConfig.display?.showTokenBreakdown === 'boolean'
            ? userConfig.display.showTokenBreakdown
            : DEFAULT_CONFIG.display.showTokenBreakdown,
        showUsage: typeof userConfig.display?.showUsage === 'boolean'
            ? userConfig.display.showUsage
            : DEFAULT_CONFIG.display.showUsage,
        showTools: typeof userConfig.display?.showTools === 'boolean'
            ? userConfig.display.showTools
            : DEFAULT_CONFIG.display.showTools,
        showAgents: typeof userConfig.display?.showAgents === 'boolean'
            ? userConfig.display.showAgents
            : DEFAULT_CONFIG.display.showAgents,
        showTodos: typeof userConfig.display?.showTodos === 'boolean'
            ? userConfig.display.showTodos
            : DEFAULT_CONFIG.display.showTodos,
    };
    // Helper to validate PatternCategory array
    const validCategories = ['todo', 'stub', 'mock', 'placeholder'];
    const isValidCategory = (c) => typeof c === 'string' && validCategories.includes(c);
    const qualityScan = {
        enabled: typeof userConfig.automation?.qualityScan?.enabled === 'boolean'
            ? userConfig.automation.qualityScan.enabled
            : DEFAULT_QUALITY_SCAN_CONFIG.enabled,
        patterns: {
            todo: typeof userConfig.automation?.qualityScan?.patterns?.todo === 'boolean'
                ? userConfig.automation.qualityScan.patterns.todo
                : DEFAULT_QUALITY_SCAN_CONFIG.patterns.todo,
            stub: typeof userConfig.automation?.qualityScan?.patterns?.stub === 'boolean'
                ? userConfig.automation.qualityScan.patterns.stub
                : DEFAULT_QUALITY_SCAN_CONFIG.patterns.stub,
            mock: typeof userConfig.automation?.qualityScan?.patterns?.mock === 'boolean'
                ? userConfig.automation.qualityScan.patterns.mock
                : DEFAULT_QUALITY_SCAN_CONFIG.patterns.mock,
            placeholder: typeof userConfig.automation?.qualityScan?.patterns?.placeholder === 'boolean'
                ? userConfig.automation.qualityScan.patterns.placeholder
                : DEFAULT_QUALITY_SCAN_CONFIG.patterns.placeholder,
        },
        exclude: Array.isArray(userConfig.automation?.qualityScan?.exclude)
            ? userConfig.automation.qualityScan.exclude.filter((p) => typeof p === 'string')
            : DEFAULT_QUALITY_SCAN_CONFIG.exclude,
        treatAsError: Array.isArray(userConfig.automation?.qualityScan?.treatAsError)
            ? userConfig.automation.qualityScan.treatAsError.filter(isValidCategory)
            : DEFAULT_QUALITY_SCAN_CONFIG.treatAsError,
    };
    const automation = {
        autoContinue: {
            enabled: typeof userConfig.automation?.autoContinue?.enabled === 'boolean'
                ? userConfig.automation.autoContinue.enabled
                : DEFAULT_AUTOMATION_CONFIG.autoContinue.enabled,
            maxIterations: typeof userConfig.automation?.autoContinue?.maxIterations === 'number' &&
                userConfig.automation.autoContinue.maxIterations > 0
                ? userConfig.automation.autoContinue.maxIterations
                : DEFAULT_AUTOMATION_CONFIG.autoContinue.maxIterations,
        },
        checklist: {
            enabled: typeof userConfig.automation?.checklist?.enabled === 'boolean'
                ? userConfig.automation.checklist.enabled
                : DEFAULT_AUTOMATION_CONFIG.checklist.enabled,
            paths: Array.isArray(userConfig.automation?.checklist?.paths)
                ? userConfig.automation.checklist.paths.filter((p) => typeof p === 'string')
                : DEFAULT_AUTOMATION_CONFIG.checklist.paths,
        },
        qualityScan,
    };
    return { layout, pathLevels, gitStatus, display, automation };
}
export async function loadConfig() {
    const configPath = getConfigPath();
    try {
        if (!fs.existsSync(configPath)) {
            return DEFAULT_CONFIG;
        }
        const content = fs.readFileSync(configPath, 'utf-8');
        const userConfig = JSON.parse(content);
        return mergeConfig(userConfig);
    }
    catch {
        return DEFAULT_CONFIG;
    }
}
//# sourceMappingURL=config.js.map