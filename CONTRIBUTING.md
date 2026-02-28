# Contributing to Pull Request Size Labeler

Thank you for your interest in contributing!  
This document explains how to contribute effectively and consistently to this repository.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Commit Message Format](#commit-message-format)
  - [Format](#format)
  - [Examples](#examples)
  - [Allowed Types](#allowed-types)
- [Branch Naming Conventions](#branch-naming-conventions)
  - [Format](#format-1)
  - [Examples](#examples-1)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Questions](#questions)

---

## Development Setup

To work on this action locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/lukas-kuntze/devx-action-pr-size-labeler.git
   cd devx-action-pr-size-labeler
   ```

2. Activate git hooks:
   ```bash
   git config core.hooksPath .githooks
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run linting and formatting:
   ```bash
   npm run lint      # Check code quality
   npm run format    # Format code with Prettier
   ```

5. Build the action:
   ```bash
   npm run build     # Compile TypeScript
   npm run package   # Bundle with ncc
   npm run all       # Run all steps (format, lint, build, package)
   ```

6. Test your changes:
   - Create a test repository with a pull request
   - Add a size label configuration file
   - Run the action in a workflow

---

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) convention to keep the commit history structured and machine-readable.

### Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Examples

```text
feat(config): add support for custom size thresholds
fix(labeler): correct line count calculation for renamed files
docs(readme): add file ignore pattern examples
chore(deps): update @actions/github to latest version
```

### Allowed Types

- **build** – Build system or dependency updates
- **chore** – Maintenance, config, or tooling changes
- **ci** – Continuous Integration related changes
- **docs** – Documentation updates
- **feat / feature** – New features or functionality
- **fix** – Bug fixes
- **perf** – Performance improvements
- **refactor** – Code restructuring without feature or fix
- **style** – Formatting or stylistic changes
- **test** – Adding or updating tests

---

## Branch Naming Conventions

Branches should be named clearly and consistently to make it easy to identify the purpose of a change.

### Format

```text
<type>/<short-description>
```

### Examples

```text
feat/add-fail-on-size-option
fix/ignore-deleted-files
docs/update-configuration-examples
chore/update-dependencies
```

**Allowed types:**
`build/`, `chore/`, `ci/`, `docs/`, `feat/`, `feature/`, `fix/`, `perf/`, `refactor/`, `style/`, `test/`

---

## Pull Request Guidelines

Before opening a pull request, please ensure the following:

1. Your branch is **rebased** on the latest `main`.  
2. The PR title follows the **Conventional Commit** format (`feat: short description`).  
3. The **Pull Request Template** has been filled out completely.  
4. The change is **small and focused** – aim for ≤ 500 lines where possible.  
5. The **size labeler** will automatically assign labels based on lines changed.  
6. PRs exceeding **2000 lines** should be split into smaller parts.  
7. Documentation has been updated if behavior or configuration changed.  
8. All tests and CI checks pass successfully.

A valid PR should also include:

- A clear summary of the change in the *Description* section  
- The issue reference (e.g., `Fixes: #42`)  
- Confirmation that no secrets (tokens, passwords, etc.) are included  

Refer to the [Pull Request Template](.github/pull_request_template.md) for the exact structure.

---

## Questions

If you have questions, feedback, or ideas for improvement:  
Please create an [issue](../../issues).
