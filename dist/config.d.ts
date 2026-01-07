import type { PatternCategory } from './quality/patterns.js';
export type LayoutType = 'default' | 'separators';
export interface QualityScanConfig {
    enabled: boolean;
    patterns: {
        todo: boolean;
        stub: boolean;
        mock: boolean;
        placeholder: boolean;
    };
    exclude: string[];
    treatAsError: PatternCategory[];
}
export interface AutomationConfig {
    autoContinue: {
        enabled: boolean;
        maxIterations: number;
    };
    checklist: {
        enabled: boolean;
        paths: string[];
    };
    qualityScan?: QualityScanConfig;
}
export interface HudConfig {
    layout: LayoutType;
    pathLevels: 1 | 2 | 3;
    gitStatus: {
        enabled: boolean;
        showDirty: boolean;
        showAheadBehind: boolean;
    };
    display: {
        showModel: boolean;
        showContextBar: boolean;
        showConfigCounts: boolean;
        showDuration: boolean;
        showTokenBreakdown: boolean;
        showUsage: boolean;
        showTools: boolean;
        showAgents: boolean;
        showTodos: boolean;
    };
    automation?: AutomationConfig;
}
export declare const DEFAULT_QUALITY_SCAN_CONFIG: QualityScanConfig;
export declare const DEFAULT_AUTOMATION_CONFIG: AutomationConfig;
export declare const DEFAULT_CONFIG: HudConfig;
export declare function getConfigPath(): string;
export declare function loadConfig(): Promise<HudConfig>;
//# sourceMappingURL=config.d.ts.map