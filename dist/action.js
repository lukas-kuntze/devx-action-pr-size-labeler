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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const config_loader_1 = require("./services/config-loader");
const labeler_1 = require("./services/labeler");
const types_1 = require("./types");
const validators_1 = require("./utils/validators");
/**
 * Retrieves all action inputs from the workflow.
 *
 * @returns The action inputs
 */
function getActionInputs() {
    const filesToIgnoreRaw = core.getInput(types_1.INPUT.FILES_TO_IGNORE);
    const filesToIgnore = filesToIgnoreRaw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    return {
        configFile: core.getInput(types_1.INPUT.CONFIG_FILE) || '.github/config/size-labels.yml',
        filesToIgnore,
        githubApiUrl: core.getInput(types_1.INPUT.GITHUB_API_URL) || 'https://api.github.com',
        githubToken: core.getInput(types_1.INPUT.GITHUB_TOKEN, { required: true }),
        ignoreFileDeletions: core.getBooleanInput(types_1.INPUT.IGNORE_FILE_DELETIONS),
        ignoreLineDeletions: core.getBooleanInput(types_1.INPUT.IGNORE_LINE_DELETIONS)
    };
}
/**
 * Logs the action inputs for debugging purposes.
 *
 * @param inputs - The action inputs to log
 */
function logInputs(inputs) {
    core.info(`Configuration file: ${inputs.configFile}`);
    core.info(`Files to ignore: ${inputs.filesToIgnore.length > 0 ? inputs.filesToIgnore.join(', ') : 'none'}`);
    core.info(`Ignore line deletions: ${inputs.ignoreLineDeletions}`);
    core.info(`Ignore file deletions: ${inputs.ignoreFileDeletions}`);
    if (inputs.githubApiUrl !== 'https://api.github.com') {
        core.info(`GitHub API URL: ${inputs.githubApiUrl}`);
    }
}
/**
 * Sets the action outputs based on the calculation result.
 *
 * @param result - The size calculation result
 */
function setOutputs(result) {
    core.setOutput(types_1.OUTPUT.LABEL, result.label.name);
    core.setOutput(types_1.OUTPUT.LINES_ADDED, result.linesAdded.toString());
    core.setOutput(types_1.OUTPUT.LINES_DELETED, result.linesDeleted.toString());
    core.setOutput(types_1.OUTPUT.TOTAL_LINES, result.totalLines.toString());
}
/**
 * Main entry point for the GitHub Action.
 *
 * Orchestrates the PR size labeling process:
 * 1. Loads and validates configuration
 * 2. Calculates PR size and determines label
 * 3. Applies label and posts comments if configured
 * 4. Reports results as action outputs
 */
async function run() {
    try {
        core.info('Starting Pull Request Size Labeler Action.');
        core.startGroup('Configuration');
        const inputs = getActionInputs();
        logInputs(inputs);
        (0, validators_1.validateInputs)(inputs);
        const { owner, repo } = github.context.repo;
        core.info(`Repository: ${owner}/${repo}`);
        core.endGroup();
        const config = await (0, config_loader_1.loadConfig)(inputs.configFile, inputs.githubToken);
        const result = await (0, labeler_1.labelPullRequest)(inputs, config);
        core.startGroup('Results');
        setOutputs(result);
        core.info(`Applied label: ${result.label.name}`);
        core.info(`Total lines changed: ${result.totalLines}`);
        core.endGroup();
        if (result.label.fail) {
            core.setFailed(`PR size exceeds threshold. Label "${result.label.name}" is configured to fail the workflow.`);
            return;
        }
        core.info('Pull Request Size Labeler Action completed successfully.');
    }
    catch (error) {
        if (error instanceof Error) {
            core.debug(`Stack trace: ${error.stack}`);
            core.setFailed(`Action failed: ${error.message}`);
        }
        else {
            core.setFailed(`Action failed: ${String(error)}`);
        }
    }
}
void run();
//# sourceMappingURL=action.js.map