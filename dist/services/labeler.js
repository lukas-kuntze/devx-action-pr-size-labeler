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
exports.labelPullRequest = labelPullRequest;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const minimatch_1 = require("minimatch");
/**
 * Fetches all files changed in a pull request with pagination.
 *
 * @param octokit - GitHub API client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @returns Array of pull request files
 */
async function fetchPullRequestFiles(octokit, owner, repo, pullNumber) {
    core.info(`Fetching files for PR #${pullNumber}...`);
    const files = [];
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
        files.push(...response.data);
        if (response.data.length < perPage) {
            hasMorePages = false;
        }
        else {
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
function filterFiles(files, ignorePatterns) {
    if (ignorePatterns.length === 0) {
        return files;
    }
    const filtered = files.filter((file) => {
        const shouldIgnore = ignorePatterns.some((pattern) => (0, minimatch_1.minimatch)(file.filename, pattern));
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
function calculateLines(files, ignoreLineDeletions, ignoreFileDeletions) {
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
function determineSizeLabel(totalLines, labels) {
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
async function removeOldSizeLabels(octokit, owner, repo, pullNumber, sizeLabels, currentLabels) {
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
async function hasExistingComment(octokit, owner, repo, pullNumber, message) {
    const comments = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: pullNumber
    });
    const messageFirstLine = message.trim().split('\n')[0];
    return comments.data.some((comment) => comment.body?.includes(messageFirstLine));
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
async function postComment(octokit, owner, repo, pullNumber, message) {
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
async function labelPullRequest(inputs, config) {
    const octokit = (0, github_1.getOctokit)(inputs.githubToken, { baseUrl: inputs.githubApiUrl });
    const { owner, repo } = github_1.context.repo;
    const pullNumber = github_1.context.payload.pull_request?.number;
    if (!pullNumber) {
        throw new Error('This action can only be run on pull_request events.');
    }
    core.startGroup('Fetching PR files');
    const allFiles = await fetchPullRequestFiles(octokit, owner, repo, pullNumber);
    const files = filterFiles(allFiles, inputs.filesToIgnore);
    core.endGroup();
    core.startGroup('Calculating PR size');
    const { linesAdded, linesDeleted, totalLines } = calculateLines(files, inputs.ignoreLineDeletions, inputs.ignoreFileDeletions);
    const label = determineSizeLabel(totalLines, config.labels);
    core.endGroup();
    core.startGroup('Updating PR labels');
    const prResponse = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
    const currentLabels = prResponse.data.labels.map((l) => l.name);
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
//# sourceMappingURL=labeler.js.map