import * as core from '@actions/core';

import { ActionInputs, SizeLabel, SizeLabelConfig } from '../types';

/** Maximum allowed length for a label name. */
const MAX_LABEL_NAME_LENGTH = 50;

/**
 * Validates a label name.
 *
 * @param name - Label name to validate
 * @throws Error if the name is invalid
 */
export function validateLabelName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('Label name cannot be empty.');
  }

  if (name.length > MAX_LABEL_NAME_LENGTH) {
    throw new Error(`Label name "${name}" is too long. Maximum length is ${MAX_LABEL_NAME_LENGTH} characters.`);
  }
}

/**
 * Validates a single size label configuration.
 *
 * @param label - The label to validate
 * @param index - The index of the label in the array (for error messages)
 * @param isLast - Whether this is the last label in the array
 * @throws Error if the label is invalid
 */
export function validateSizeLabel(label: SizeLabel, index: number, isLast: boolean): void {
  if (!label.name) {
    throw new Error(`Label at index ${index} is missing the "name" field.`);
  }

  validateLabelName(label.name);

  if (!isLast && label.max_lines === undefined) {
    throw new Error(`Label "${label.name}" is missing the "max_lines" field. Only the last label can omit this.`);
  }

  if (label.max_lines !== undefined && (typeof label.max_lines !== 'number' || label.max_lines < 0)) {
    throw new Error(`Label "${label.name}" has an invalid "max_lines" value. Must be a non-negative number.`);
  }

  if (label.fail !== undefined && typeof label.fail !== 'boolean') {
    throw new Error(`Label "${label.name}" has an invalid "fail" value. Must be a boolean.`);
  }

  if (label.message !== undefined && typeof label.message !== 'string') {
    throw new Error(`Label "${label.name}" has an invalid "message" value. Must be a string.`);
  }
}

/**
 * Validates the entire size label configuration.
 *
 * @param config - Size label configuration to validate
 * @throws Error if the configuration is invalid
 */
export function validateSizeLabelConfig(config: SizeLabelConfig): void {
  if (!config) {
    throw new Error('Configuration must not be null or undefined.');
  }

  if (!config.labels) {
    throw new Error('Configuration is missing the required "labels" array.');
  }

  if (!Array.isArray(config.labels)) {
    throw new TypeError('Configuration property "labels" must be an array.');
  }

  if (config.labels.length === 0) {
    throw new Error('Configuration must contain at least one label.');
  }

  config.labels.forEach((label, index) => {
    const isLast = index === config.labels.length - 1;
    validateSizeLabel(label, index, isLast);
  });

  const labelNames = config.labels.map((l) => l.name.toLowerCase());
  const duplicates = labelNames.filter((name, index) => labelNames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    throw new Error(`Duplicate label names detected: ${[...new Set(duplicates)].join(', ')}.`);
  }

  let previousMax = -1;
  for (const label of config.labels) {
    if (label.max_lines !== undefined) {
      if (label.max_lines <= previousMax) {
        throw new Error(
          `Labels must be in ascending order by max_lines. "${label.name}" has max_lines ${label.max_lines} but previous label had ${previousMax}.`
        );
      }
      previousMax = label.max_lines;
    }
  }

  core.info(`Configuration validated successfully: ${config.labels.length} size labels found.`);
}

/**
 * Validates the action inputs.
 *
 * @param inputs - The action inputs to validate
 * @throws Error if the inputs are invalid
 */
export function validateInputs(inputs: ActionInputs): void {
  if (!inputs.configFile || inputs.configFile.trim().length === 0) {
    throw new Error('Input "config_file" must not be empty.');
  }

  if (!inputs.githubToken || inputs.githubToken.trim().length === 0) {
    throw new Error('Input "github_token" must not be empty.');
  }
}
