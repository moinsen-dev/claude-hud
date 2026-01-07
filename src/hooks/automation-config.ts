import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { PatternCategory } from '../quality/patterns.js';

export interface QualityScanConfig {
  enabled: boolean;
  patterns?: {
    todo?: boolean;
    stub?: boolean;
    mock?: boolean;
    placeholder?: boolean;
  };
  exclude?: string[];
  treatAsError?: PatternCategory[];
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

export const DEFAULT_QUALITY_SCAN_CONFIG: QualityScanConfig = {
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

export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
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

export function getAutomationConfigPath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'claude-hud', 'config.json');
}

function validateAutomationConfig(config: unknown): config is Partial<AutomationConfig> {
  if (typeof config !== 'object' || config === null) return false;
  return true;
}

function mergeAutomationConfig(userConfig: Partial<AutomationConfig>): AutomationConfig {
  const autoContinue = {
    enabled:
      typeof userConfig.autoContinue?.enabled === 'boolean'
        ? userConfig.autoContinue.enabled
        : DEFAULT_AUTOMATION_CONFIG.autoContinue.enabled,
    maxIterations:
      typeof userConfig.autoContinue?.maxIterations === 'number' &&
      userConfig.autoContinue.maxIterations > 0
        ? userConfig.autoContinue.maxIterations
        : DEFAULT_AUTOMATION_CONFIG.autoContinue.maxIterations,
  };

  const checklist = {
    enabled:
      typeof userConfig.checklist?.enabled === 'boolean'
        ? userConfig.checklist.enabled
        : DEFAULT_AUTOMATION_CONFIG.checklist.enabled,
    paths: Array.isArray(userConfig.checklist?.paths)
      ? userConfig.checklist.paths.filter((p) => typeof p === 'string')
      : DEFAULT_AUTOMATION_CONFIG.checklist.paths,
  };

  // Helper to validate PatternCategory array
  const validCategories: PatternCategory[] = ['todo', 'stub', 'mock', 'placeholder'];
  const isValidCategory = (c: unknown): c is PatternCategory =>
    typeof c === 'string' && validCategories.includes(c as PatternCategory);

  const qualityScan: QualityScanConfig = {
    enabled:
      typeof userConfig.qualityScan?.enabled === 'boolean'
        ? userConfig.qualityScan.enabled
        : DEFAULT_QUALITY_SCAN_CONFIG.enabled,
    patterns: {
      todo:
        typeof userConfig.qualityScan?.patterns?.todo === 'boolean'
          ? userConfig.qualityScan.patterns.todo
          : DEFAULT_QUALITY_SCAN_CONFIG.patterns?.todo ?? true,
      stub:
        typeof userConfig.qualityScan?.patterns?.stub === 'boolean'
          ? userConfig.qualityScan.patterns.stub
          : DEFAULT_QUALITY_SCAN_CONFIG.patterns?.stub ?? true,
      mock:
        typeof userConfig.qualityScan?.patterns?.mock === 'boolean'
          ? userConfig.qualityScan.patterns.mock
          : DEFAULT_QUALITY_SCAN_CONFIG.patterns?.mock ?? true,
      placeholder:
        typeof userConfig.qualityScan?.patterns?.placeholder === 'boolean'
          ? userConfig.qualityScan.patterns.placeholder
          : DEFAULT_QUALITY_SCAN_CONFIG.patterns?.placeholder ?? true,
    },
    exclude: Array.isArray(userConfig.qualityScan?.exclude)
      ? userConfig.qualityScan.exclude.filter((p): p is string => typeof p === 'string')
      : DEFAULT_QUALITY_SCAN_CONFIG.exclude,
    treatAsError: Array.isArray(userConfig.qualityScan?.treatAsError)
      ? userConfig.qualityScan.treatAsError.filter(isValidCategory)
      : DEFAULT_QUALITY_SCAN_CONFIG.treatAsError,
  };

  return { autoContinue, checklist, qualityScan };
}

export async function loadAutomationConfig(): Promise<AutomationConfig> {
  const configPath = getAutomationConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      return DEFAULT_AUTOMATION_CONFIG;
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const fullConfig = JSON.parse(content);

    // Automation config is nested under 'automation' key in the main config
    const automationConfig = fullConfig?.automation;
    if (!validateAutomationConfig(automationConfig)) {
      return DEFAULT_AUTOMATION_CONFIG;
    }

    return mergeAutomationConfig(automationConfig);
  } catch {
    return DEFAULT_AUTOMATION_CONFIG;
  }
}
