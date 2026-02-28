"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUT = exports.INPUT = void 0;
/**
 * Input parameter names for the GitHub Action.
 */
exports.INPUT = {
    CONFIG_FILE: 'config_file',
    FILES_TO_IGNORE: 'files_to_ignore',
    GITHUB_API_URL: 'github_api_url',
    GITHUB_TOKEN: 'github_token',
    IGNORE_FILE_DELETIONS: 'ignore_file_deletions',
    IGNORE_LINE_DELETIONS: 'ignore_line_deletions'
};
/**
 * Output parameter names for the GitHub Action.
 */
exports.OUTPUT = {
    LABEL: 'label',
    LINES_ADDED: 'lines_added',
    LINES_DELETED: 'lines_deleted',
    TOTAL_LINES: 'total_lines'
};
//# sourceMappingURL=index.js.map