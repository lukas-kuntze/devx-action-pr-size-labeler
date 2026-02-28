import * as core from '@actions/core';
import * as github from '@actions/github';

import { loadConfig } from './services/config-loader';
import { labelPullRequest } from './services/labeler';
import { ActionInputs, INPUT, OUTPUT, SizeCalculationResult } from './types';
import { validateInputs } from './utils/validators';

/**
 * Retrieves all action inputs from the workflow.
 *
 * @returns The action inputs
 */
function getActionInputs(): ActionInputs {
  const filesToIgnoreRaw = core.getInput(INPUT.FILES_TO_IGNORE);
  const filesToIgnore = filesToIgnoreRaw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    configFile: core.getInput(INPUT.CONFIG_FILE) || '.github/config/size-labels.yml',
    filesToIgnore,
    githubApiUrl: core.getInput(INPUT.GITHUB_API_URL) || 'https://api.github.com',
    githubToken: core.getInput(INPUT.GITHUB_TOKEN, { required: true }),
    ignoreFileDeletions: core.getBooleanInput(INPUT.IGNORE_FILE_DELETIONS),
    ignoreLineDeletions: core.getBooleanInput(INPUT.IGNORE_LINE_DELETIONS)
  };
}

/**
 * Logs the action inputs for debugging purposes.
 *
 * @param inputs - The action inputs to log
 */
function logInputs(inputs: ActionInputs): void {
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
function setOutputs(result: SizeCalculationResult): void {
  core.setOutput(OUTPUT.LABEL, result.label.name);
  core.setOutput(OUTPUT.LINES_ADDED, result.linesAdded.toString());
  core.setOutput(OUTPUT.LINES_DELETED, result.linesDeleted.toString());
  core.setOutput(OUTPUT.TOTAL_LINES, result.totalLines.toString());
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
async function run(): Promise<void> {
  try {
    core.info('Starting Pull Request Size Labeler Action.');

    core.startGroup('Configuration');
    const inputs = getActionInputs();
    logInputs(inputs);
    validateInputs(inputs);
    const { owner, repo } = github.context.repo;
    core.info(`Repository: ${owner}/${repo}`);
    core.endGroup();

    const config = await loadConfig(inputs.configFile, inputs.githubToken);

    const result = await labelPullRequest(inputs, config);

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
  } catch (error) {
    if (error instanceof Error) {
      core.debug(`Stack trace: ${error.stack}`);
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed(`Action failed: ${String(error)}`);
    }
  }
}

void run();
