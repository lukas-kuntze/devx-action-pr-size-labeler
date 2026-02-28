import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import * as yaml from 'js-yaml';

import { SizeLabelConfig } from '../types';
import { validateSizeLabelConfig } from '../utils/validators';

/** Pattern for matching GitHub repository paths (e.g., "owner/repo/path/to/file.yml"). */
const GITHUB_REPO_PATH_REGEX = /^[\w-]+\/[\w-]+\/.+\.ya?ml$/i;

/**
 * Checks if a path is a URL.
 *
 * @param path - Path to check
 * @returns True if the path is a URL
 */
function isUrl(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://');
}

/**
 * Checks if a path is a GitHub repository path.
 *
 * @param path - Path to check
 * @returns True if the path matches the GitHub repository path pattern
 */
function isGitHubRepoPath(path: string): boolean {
  return GITHUB_REPO_PATH_REGEX.test(path);
}

/**
 * Loads the configuration from a URL.
 *
 * @param url - URL to the YAML configuration file
 * @returns Parsed size label configuration
 */
async function loadFromUrl(url: string): Promise<SizeLabelConfig> {
  core.info(`Loading configuration from URL: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    const config = yaml.load(content) as SizeLabelConfig;
    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration from URL "${url}": ${(error as Error).message}`);
  }
}

/**
 * Loads the configuration from a GitHub repository.
 *
 * @param repoPath - Repository path in the format "owner/repo/path/to/file.yml"
 * @param token - GitHub token used for authentication
 * @returns Parsed size label configuration
 */
async function loadFromGitHub(repoPath: string, token: string): Promise<SizeLabelConfig> {
  core.info(`Loading configuration from GitHub repository: ${repoPath}`);

  try {
    const parts = repoPath.split('/');
    if (parts.length < 3) {
      throw new Error('Invalid GitHub repository path. Expected format: "owner/repo/path/to/file.yml"');
    }

    const owner = parts[0];
    const repo = parts[1];
    const path = parts.slice(2).join('/');

    core.debug(`Owner: ${owner}, Repo: ${repo}, Path: ${path}`);

    const octokit = getOctokit(token);
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Path "${path}" is not a file`);
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const config = yaml.load(content) as SizeLabelConfig;
    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration from GitHub "${repoPath}": ${(error as Error).message}`);
  }
}

/**
 * Resolves the configuration path and loads from the appropriate source.
 *
 * @param configPath - Path to the configuration (local file, URL, or repo path)
 * @param githubToken - GitHub token for API authentication
 * @returns Parsed size label configuration
 */
async function resolveAndLoadConfig(configPath: string, githubToken: string): Promise<SizeLabelConfig> {
  if (isUrl(configPath)) {
    return loadFromUrl(configPath);
  }

  if (isGitHubRepoPath(configPath)) {
    return loadFromGitHub(configPath, githubToken);
  }

  const { owner, repo } = context.repo;
  const repoPath = `${owner}/${repo}/${configPath}`;
  core.info(`Loading local file from current repository: ${repoPath}`);
  return loadFromGitHub(repoPath, githubToken);
}

/**
 * Loads and validates the size label configuration.
 *
 * @param configPath - Path to the configuration (local file, URL, or repo path)
 * @param githubToken - GitHub token for API authentication
 * @returns Parsed and validated size label configuration
 */
export async function loadConfig(configPath: string, githubToken: string): Promise<SizeLabelConfig> {
  core.info(`Loading configuration from: ${configPath}`);

  const config = await resolveAndLoadConfig(configPath, githubToken);
  validateSizeLabelConfig(config);

  core.info('Configuration loaded successfully.');
  return config;
}
