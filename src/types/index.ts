/**
 * Configuration for a single size label.
 */
export interface SizeLabel {
  /** Name of the label */
  name: string;

  /** Maximum number of lines for this size category (undefined = Infinity) */
  max_lines?: number;

  /** Optional comment message to post when this label is applied */
  message?: string;

  /** If true, the workflow will fail when this label is applied */
  fail?: boolean;
}

/**
 * Structure of the YAML configuration file.
 */
export interface SizeLabelConfig {
  /** List of size label definitions */
  labels: SizeLabel[];
}

/**
 * Input parameters for the GitHub Action.
 */
export interface ActionInputs {
  /** Path to the configuration file */
  configFile: string;

  /** Glob patterns to exclude from the calculation */
  filesToIgnore: string[];

  /** Base URL of the GitHub API (for GitHub Enterprise Server) */
  githubApiUrl: string;

  /** GitHub token used for API authentication */
  githubToken: string;

  /** If true, deleted files are not counted */
  ignoreFileDeletions: boolean;

  /** If true, deleted lines are not counted */
  ignoreLineDeletions: boolean;
}

/**
 * Output values of the GitHub Action.
 */
export interface ActionOutputs {
  /** The size label that was applied */
  label: string;

  /** Total number of lines added */
  linesAdded: number;

  /** Total number of lines deleted */
  linesDeleted: number;

  /** Total number of lines changed */
  totalLines: number;
}

/**
 * Input parameter names for the GitHub Action.
 */
export const INPUT = {
  CONFIG_FILE: 'config_file',
  FILES_TO_IGNORE: 'files_to_ignore',
  GITHUB_API_URL: 'github_api_url',
  GITHUB_TOKEN: 'github_token',
  IGNORE_FILE_DELETIONS: 'ignore_file_deletions',
  IGNORE_LINE_DELETIONS: 'ignore_line_deletions'
} as const;

/**
 * Output parameter names for the GitHub Action.
 */
export const OUTPUT = {
  LABEL: 'label',
  LINES_ADDED: 'lines_added',
  LINES_DELETED: 'lines_deleted',
  TOTAL_LINES: 'total_lines'
} as const;

/**
 * Represents a file in a pull request.
 */
export interface PullRequestFile {
  /** Filename with path */
  filename: string;

  /** File status (added, removed, modified, renamed, etc.) */
  status: string;

  /** Number of lines added */
  additions: number;

  /** Number of lines deleted */
  deletions: number;

  /** Total changes */
  changes: number;
}

/**
 * Result of calculating PR size.
 */
export interface SizeCalculationResult {
  /** Total lines added */
  linesAdded: number;

  /** Total lines deleted */
  linesDeleted: number;

  /** Total lines changed */
  totalLines: number;

  /** The determined size label */
  label: SizeLabel;
}
