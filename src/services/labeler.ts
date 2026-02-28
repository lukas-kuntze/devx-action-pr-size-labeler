import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { minimatch } from 'minimatch';

import { ActionInputs, PullRequestFile, SizeCalculationResult, SizeLabel, SizeLabelConfig } from '../types';

type OctokitClient = ReturnType<typeof getOctokit>;

/**
 * Fetches all files changed in a pull request with pagination.
 *
 * @param octokit - GitHub API client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @returns Array of pull request files
 */
async function fetchPullRequestFiles(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<PullRequestFile[]> {
  core.info(`Fetching files for PR #${pullNumber}...`);

  const files: PullRequestFile[] = [];
  let page = 1;
  const perPage = 100;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: perPage,
      page
    });

    files.push(...(response.data as PullRequestFile[]));

    if (response.data.length < perPage) {
      hasMorePages = false;
    } else {
      page++;
    }
  }

  core.info(`Found ${files.length} files in PR.`);
  return files;
}

/**
 * Filters files based on ignore patterns.
 *
 * @param files - Array of pull request files
 * @param ignorePatterns - Glob patterns to exclude
 * @returns Filtered array of files
 */
function filterFiles(files: PullRequestFile[], ignorePatterns: string[]): PullRequestFile[] {
  if (ignorePatterns.length === 0) {
    return files;
  }

  const filtered = files.filter((file) => {
    const shouldIgnore = ignorePatterns.some((pattern) => minimatch(file.filename, pattern));
    if (shouldIgnore) {
      core.debug(`Ignoring file: ${file.filename}`);
    }
    return !shouldIgnore;
  });

  core.info(`Files after filtering: ${filtered.length} (ignored ${files.length - filtered.length})`);
  return filtered;
}

/**
 * Calculates the total lines changed in the pull request.
 *
 * @param files - Array of pull request files
 * @param ignoreLineDeletions - Whether to ignore line deletions
 * @param ignoreFileDeletions - Whether to ignore fully deleted files
 * @returns Object with lines added, deleted, and total
 */
function calculateLines(
  files: PullRequestFile[],
  ignoreLineDeletions: boolean,
  ignoreFileDeletions: boolean
): { linesAdded: number; linesDeleted: number; totalLines: number } {
  let linesAdded = 0;
  let linesDeleted = 0;

  for (const file of files) {
    if (ignoreFileDeletions && file.status === 'removed') {
      core.debug(`Ignoring deleted file: ${file.filename}`);
      continue;
    }

    linesAdded += file.additions;

    if (!ignoreLineDeletions) {
      linesDeleted += file.deletions;
    }
  }

  const totalLines = linesAdded + linesDeleted;

  core.info(`Lines added: ${linesAdded}, deleted: ${linesDeleted}, total: ${totalLines}`);
  return { linesAdded, linesDeleted, totalLines };
}

/**
 * Determines the appropriate size label based on total lines.
 *
 * @param totalLines - Total number of lines changed
 * @param labels - Array of size labels from config
 * @returns The matching size label
 */
function determineSizeLabel(totalLines: number, labels: SizeLabel[]): SizeLabel {
  for (const label of labels) {
    const maxLines = label.max_lines ?? Infinity;
    if (totalLines <= maxLines) {
      core.info(`Determined size label: ${label.name} (total: ${totalLines}, max: ${maxLines})`);
      return label;
    }
  }

  const lastLabel = labels[labels.length - 1];
  core.info(`Using last label as fallback: ${lastLabel.name}`);
  return lastLabel;
}

/**
 * Removes old size labels from the pull request.
 *
 * @param octokit - GitHub API client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @param sizeLabels - Array of all size labels from config
 * @param currentLabels - Array of current label names on the PR
 */
async function removeOldSizeLabels(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  pullNumber: number,
  sizeLabels: SizeLabel[],
  currentLabels: string[]
): Promise<void> {
  const sizeLabelNames = sizeLabels.map((l) => l.name.toLowerCase());

  for (const labelName of currentLabels) {
    if (sizeLabelNames.includes(labelName.toLowerCase())) {
      core.info(`Removing old size label: ${labelName}`);
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: pullNumber,
        name: labelName
      });
    }
  }
}

/**
 * Checks if a comment with similar content already exists.
 *
 * @param octokit - GitHub API client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @param message - Message content to check for
 * @returns True if a similar comment already exists
 */
async function hasExistingComment(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  pullNumber: number,
  message: string
): Promise<boolean> {
  const comments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber
  });

  const messageFirstLine = message.trim().split('\n')[0];

  return comments.data.some((comment: { body?: string }) => comment.body?.includes(messageFirstLine));
}

/**
 * Posts a comment on the pull request if not already posted.
 *
 * @param octokit - GitHub API client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @param message - Comment message to post
 */
async function postComment(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  pullNumber: number,
  message: string
): Promise<void> {
  const alreadyCommented = await hasExistingComment(octokit, owner, repo, pullNumber, message);

  if (alreadyCommented) {
    core.info('Comment already exists, skipping.');
    return;
  }

  core.info('Posting comment on PR...');
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body: message
  });
}

/**
 * Main function to calculate PR size and apply labels.
 *
 * @param inputs - Action inputs
 * @param config - Size label configuration
 * @returns Size calculation result
 */
export async function labelPullRequest(inputs: ActionInputs, config: SizeLabelConfig): Promise<SizeCalculationResult> {
  const octokit = getOctokit(inputs.githubToken, { baseUrl: inputs.githubApiUrl });
  const { owner, repo } = context.repo;
  const pullNumber = context.payload.pull_request?.number;

  if (!pullNumber) {
    throw new Error('This action can only be run on pull_request events.');
  }

  core.startGroup('Fetching PR files');
  const allFiles = await fetchPullRequestFiles(octokit, owner, repo, pullNumber);
  const files = filterFiles(allFiles, inputs.filesToIgnore);
  core.endGroup();

  core.startGroup('Calculating PR size');
  const { linesAdded, linesDeleted, totalLines } = calculateLines(
    files,
    inputs.ignoreLineDeletions,
    inputs.ignoreFileDeletions
  );
  const label = determineSizeLabel(totalLines, config.labels);
  core.endGroup();

  core.startGroup('Updating PR labels');
  const prResponse = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
  const currentLabels = prResponse.data.labels.map((l: { name: string }) => l.name);

  await removeOldSizeLabels(octokit, owner, repo, pullNumber, config.labels, currentLabels);

  core.info(`Adding size label: ${label.name}`);
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pullNumber,
    labels: [label.name]
  });
  core.endGroup();

  if (label.message) {
    core.startGroup('Posting comment');
    await postComment(octokit, owner, repo, pullNumber, label.message);
    core.endGroup();
  }

  return { linesAdded, linesDeleted, totalLines, label };
}
