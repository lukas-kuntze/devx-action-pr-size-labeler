# Pull Request Size Labeler

A lightweight GitHub Action that automatically applies size-based labels to pull requests based on the number of lines changed. Helps teams improve review efficiency, prioritize work effectively, and maintain a consistent developer workflow.

---

## Table of Contents

- [Features](#features)
- [Usage](#usage)
  - [Basic Setup](#basic-setup)
  - [With Options](#with-options)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [Additional Resources](#additional-resources)

---

## Features

- **Automatic Size Labels** – Apply labels based on lines changed
- **Customizable Thresholds** – Define your own size categories
- **Enterprise Support** – Works with GitHub Enterprise Server
- **Fail Workflow** – Optionally fail the workflow for oversized PRs
- **File Filtering** – Exclude files using glob patterns
- **Old Labels Removed** – Automatically removes outdated size labels
- **PR Comments** – Post warnings for large pull requests
- **YAML Configuration** – Define labels in a simple, human-readable format

---

## Usage

### Basic Setup

```yaml
name: PR Size Labeler
on:
  pull_request:
    types: [ opened, reopened, synchronize ]

jobs:
  label-pr-size:
    permissions:
      contents: read
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - name: Apply size label
        uses: lukas-kuntze/devx-action-pr-size-labeler@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### With Options

#### Custom Configuration File

```yaml
- uses: lukas-kuntze/devx-action-pr-size-labeler@v1
  with:
    config_file: .github/config/size-labels.yml
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

#### Ignore Specific Files

```yaml
- uses: lukas-kuntze/devx-action-pr-size-labeler@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    files_to_ignore: |
      *.md
      package-lock.json
      **/*.snap
```

#### Ignore Deletions

```yaml
- uses: lukas-kuntze/devx-action-pr-size-labeler@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    ignore_line_deletions: true
    ignore_file_deletions: true
```

#### GitHub Enterprise Server

```yaml
- uses: lukas-kuntze/devx-action-pr-size-labeler@v1
  with:
    github_api_url: https://github.example.com/api/v3
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Input                   | Description                                      | Default                           | Required |
|-------------------------|--------------------------------------------------|-----------------------------------|----------|
| `config_file`           | Path to YAML configuration file                  | `.github/config/size-labels.yml`  | No       |
| `files_to_ignore`       | Glob patterns to exclude (one per line)          | –                                 | No       |
| `github_token`          | GitHub token for authentication                  | –                                 | **Yes**  |
| `github_api_url`        | GitHub API URL (for Enterprise Server)           | `https://api.github.com`          | No       |
| `ignore_file_deletions` | If true, fully deleted files are not counted     | `false`                           | No       |
| `ignore_line_deletions` | If true, deleted lines are not counted           | `false`                           | No       |

### Outputs

| Output          | Description                                    |
|-----------------|------------------------------------------------|
| `label`         | The size label that was applied                |
| `lines_added`   | Total number of lines added                    |
| `lines_deleted` | Total number of lines deleted                  |
| `total_lines`   | Total number of lines changed                  |

---

## Configuration

Create a YAML file (e.g. `.github/config/size-labels.yml`):

```yaml
labels:
  - name: teeny
    max_lines: 10

  - name: small
    max_lines: 100

  - name: medium
    max_lines: 500

  - name: large
    max_lines: 2000

  - name: oh lawd he comin
    message: |
      This PR exceeds the recommended size of 2000 lines.
      Please make sure you are NOT addressing multiple issues with one PR.
      Note this PR might be rejected due to its size.
```

### Label Properties

| Property    | Description                                         | Required |
|-------------|-----------------------------------------------------|----------|
| `name`      | Label name (max 50 chars)                           | **Yes**  |
| `max_lines` | Maximum lines for this category (omit for largest)  | No       |
| `message`   | Comment to post when this label is applied          | No       |
| `fail`      | Fail the workflow when this label is applied        | No       |

---

## How It Works

1. **Load** – Fetches configuration from file, URL, or repository
2. **Fetch** – Retrieves all files changed in the pull request
3. **Filter** – Excludes files matching ignore patterns
4. **Calculate** – Counts lines added and deleted
5. **Label** – Removes old size labels and applies the new one
6. **Comment** – Posts a message if configured for the label
7. **Report** – Outputs statistics

---

## Requirements

| Permission          | Purpose                        |
|---------------------|--------------------------------|
| `contents: read`    | Read configuration files       |
| `pull-requests: write` | Apply labels and post comments |

> **Note:** No checkout required – configuration is loaded via GitHub API.

---

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pull Request API](https://docs.github.com/en/rest/pulls)
- [YAML Syntax](https://yaml.org/spec/1.2.2/)
