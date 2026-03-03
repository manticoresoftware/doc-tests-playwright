import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const tools: Tool[] = [
  {
    name: 'list_tests',
    description:
      'List all Playwright test spec files with their describe blocks and test names. Returns JSON array.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'read_file',
    description:
      'Read contents of a file in the project. Use to understand existing tests and patterns before generating new ones.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from project root, e.g. "tests/search.spec.ts"',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      'Create or overwrite a file. Only allowed in tests/ and pages/ directories, only .ts files.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Relative path, e.g. "tests/new-feature.spec.ts"',
        },
        content: {
          type: 'string',
          description: 'Full file content to write',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_tests',
    description:
      'Run Playwright tests. Can run all tests or a specific file/grep pattern. Returns stdout/stderr with results.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file: {
          type: 'string',
          description: 'Optional: specific test file, e.g. "tests/search.spec.ts"',
        },
        grep: {
          type: 'string',
          description: 'Optional: filter tests by name, e.g. "switch to Russian"',
        },
      },
      required: [],
    },
  },
  {
    name: 'git_status',
    description: 'Show current git branch, staged/unstaged changes, and untracked files.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_branch',
    description: 'Create and checkout a new git branch from current HEAD.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Branch name, e.g. "test/add-footer-tests"',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_pr',
    description:
      'Stage all changes, commit, push current branch, and create a GitHub Pull Request using gh CLI.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'PR title',
        },
        body: {
          type: 'string',
          description: 'PR description in markdown',
        },
        commit_message: {
          type: 'string',
          description: 'Commit message for the changes',
        },
      },
      required: ['title', 'body', 'commit_message'],
    },
  },
];
