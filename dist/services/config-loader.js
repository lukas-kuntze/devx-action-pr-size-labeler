"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const yaml = __importStar(require("js-yaml"));
const validators_1 = require("../utils/validators");
/** Pattern for matching GitHub repository paths (e.g., "owner/repo/path/to/file.yml"). */
const GITHUB_REPO_PATH_REGEX = /^[\w-]+\/[\w-]+\/.+\.ya?ml$/i;
/**
 * Checks if a path is a URL.
 *
 * @param path - Path to check
 * @returns True if the path is a URL
 */
function isUrl(path) {
    return path.startsWith('http://') || path.startsWith('https://');
}
/**
 * Checks if a path is a GitHub repository path.
 *
 * @param path - Path to check
 * @returns True if the path matches the GitHub repository path pattern
 */
function isGitHubRepoPath(path) {
    return GITHUB_REPO_PATH_REGEX.test(path);
}
/**
 * Loads the configuration from a URL.
 *
 * @param url - URL to the YAML configuration file
 * @returns Parsed size label configuration
 */
async function loadFromUrl(url) {
    core.info(`Loading configuration from URL: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const content = await response.text();
        const config = yaml.load(content);
        return config;
    }
    catch (error) {
        throw new Error(`Failed to load configuration from URL "${url}": ${error.message}`);
    }
}
/**
 * Loads the configuration from a GitHub repository.
 *
 * @param repoPath - Repository path in the format "owner/repo/path/to/file.yml"
 * @param token - GitHub token used for authentication
 * @returns Parsed size label configuration
 */
async function loadFromGitHub(repoPath, token) {
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
        const octokit = (0, github_1.getOctokit)(token);
        const pullRequest = github_1.context.payload.pull_request;
        const ref = pullRequest?.head?.sha || github_1.context.sha;
        core.debug(`Using ref: ${ref}`);
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref
        });
        if (Array.isArray(data) || data.type !== 'file') {
            throw new Error(`Path "${path}" is not a file`);
        }
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const config = yaml.load(content);
        return config;
    }
    catch (error) {
        throw new Error(`Failed to load configuration from GitHub "${repoPath}": ${error.message}`);
    }
}
/**
 * Resolves the configuration path and loads from the appropriate source.
 *
 * @param configPath - Path to the configuration (local file, URL, or repo path)
 * @param githubToken - GitHub token for API authentication
 * @returns Parsed size label configuration
 */
async function resolveAndLoadConfig(configPath, githubToken) {
    if (isUrl(configPath)) {
        return loadFromUrl(configPath);
    }
    if (isGitHubRepoPath(configPath)) {
        return loadFromGitHub(configPath, githubToken);
    }
    const { owner, repo } = github_1.context.repo;
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
async function loadConfig(configPath, githubToken) {
    core.info(`Loading configuration from: ${configPath}`);
    const config = await resolveAndLoadConfig(configPath, githubToken);
    (0, validators_1.validateSizeLabelConfig)(config);
    core.info('Configuration loaded successfully.');
    return config;
}
//# sourceMappingURL=config-loader.js.map