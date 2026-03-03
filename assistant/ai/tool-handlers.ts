import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT, validateReadPath, validateWritePath } from '../utils/security';

export async function handleTool(
  name: string,
  input: Record<string, string>,
): Promise<string> {
  try {
    switch (name) {
      case 'list_tests':
        return listTests();
      case 'read_file':
        return readFile(input.path);
      case 'write_file':
        return writeFile(input.path, input.content);
      case 'run_tests':
        return await runTests(input.file, input.grep);
      case 'git_status':
        return gitStatus();
      case 'create_branch':
        return createBranch(input.name);
      case 'create_pr':
        return createPR(input.title, input.body, input.commit_message);
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

function listTests(): string {
  const testsDir = path.join(PROJECT_ROOT, 'tests');
  const files = fs.readdirSync(testsDir).filter((f) => f.endsWith('.spec.ts'));

  const result = files.map((file) => {
    const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
    const tests: string[] = [];

    // Extract test names
    const testRegex = /test\(\s*[`'"](.*?)[`'"]/g;
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      tests.push(match[1]);
    }

    // Extract describe block name
    const describeMatch = content.match(/test\.describe\(\s*[`'"](.*?)[`'"]/);
    const describe = describeMatch ? describeMatch[1] : file;

    return { file: `tests/${file}`, describe, tests };
  });

  return JSON.stringify(result, null, 2);
}

function readFile(filePath: string): string {
  const resolved = validateReadPath(filePath);
  if (!fs.existsSync(resolved)) {
    return `File not found: ${filePath}`;
  }
  return fs.readFileSync(resolved, 'utf-8');
}

function writeFile(filePath: string, content: string): string {
  const resolved = validateWritePath(filePath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(resolved, content, 'utf-8');
  return `File written: ${filePath}`;
}

function runTests(file?: string, grep?: string): Promise<string> {
  return new Promise((resolve) => {
    const args = ['npx', 'playwright', 'test', '--reporter=line'];
    if (file) args.push(file);
    if (grep) args.push('-g', grep);

    try {
      const output = execSync(args.join(' '), {
        cwd: PROJECT_ROOT,
        timeout: 120_000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      resolve(output);
    } catch (err: any) {
      // execSync throws on non-zero exit code, but we still want the output
      const stdout = err.stdout || '';
      const stderr = err.stderr || '';
      resolve(`Exit code: ${err.status}\n\n${stdout}\n${stderr}`);
    }
  });
}

function gitStatus(): string {
  const branch = execSync('git branch --show-current', {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  }).trim();

  const status = execSync('git status --short', {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  }).trim();

  return `Branch: ${branch}\n\n${status || '(clean, no changes)'}`;
}

function createBranch(name: string): string {
  // Sanitize branch name
  const safeName = name.replace(/[^a-zA-Z0-9\-_\/]/g, '-');
  execSync(`git checkout -b ${safeName}`, {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  });
  return `Created and switched to branch: ${safeName}`;
}

function createPR(title: string, body: string, commitMessage: string): string {
  // Stage all changes
  execSync('git add tests/ pages/', {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  });

  // Commit
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  });

  // Push
  execSync('git push -u origin HEAD', {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  });

  // Create PR
  const prUrl = execSync(
    `gh pr create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}"`,
    {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    },
  ).trim();

  return `PR created: ${prUrl}`;
}
