# Description

Please provide a brief summary of the change and explain which problem it solves. Also describe the motivation and context. List any dependencies that are required by this change.

Fixes # (Issue)

---

## Type of Change

Please select the applicable option(s):

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (change that breaks existing functionality)
- [ ] This change requires a documentation update

---

## How Has This Been Tested?

Please describe the tests you ran to verify the change. Provide instructions on how to reproduce the tests and describe relevant details about the test configuration.

**Test Configuration:**
- Node version:
- Operating system:

---

## Checklist

- [ ] No secrets (e.g., passwords, tokens, API keys) are included in plain text in this pull request
- [ ] The pull request title is formatted as: `[ISSUE-XXXX] – Short description` or `<type>: Short description`, where `ISSUE-XXXX` is replaced with the corresponding ticket number from the issue tracker.
      Best practice: Use the issue title in the PR title and in the first line of the commit message.
- [ ] Code follows the project conventions
- [ ] Self-review of the code has been performed
- [ ] Relevant documentation has been updated
- [ ] New and existing tests pass successfully
- [ ] The pull request is labeled with at least one of the known labels for release notes:
  - **feat** / **feature**: New features or enhancements (minor version)
  - **fix**: Bug fix (patch version)
  - **docs**: Documentation added/changed
  - **style**: Changes without impact on functionality (formatting, whitespace, etc.)
  - **refactor**: Code restructuring without bug fix or new feature
  - **perf**: Performance improvement
  - **test**: Adding/correcting tests
  - **build**: Changes to build system or dependencies
  - **ci**: Changes to CI configuration/scripts
  - **chore**: Other changes
  - **revert**: Revert a change

**Note:** If your branch was created with one of these prefixes, the label will be set automatically.
Example: If the source branch is `feat/<branch-name>`, the PR will automatically receive the `feature` label.
