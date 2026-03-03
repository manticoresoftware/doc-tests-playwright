import path from 'path';

export const PROJECT_ROOT = path.resolve(__dirname, '../..');

const ALLOWED_WRITE_DIRS = ['tests', 'pages'];
const FORBIDDEN_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'playwright.config.ts',
  '.env',
  '.gitignore',
];

export function validateReadPath(relativePath: string): string {
  const cleaned = relativePath.replace(/^\/+/, '');
  const resolved = path.resolve(PROJECT_ROOT, cleaned);

  if (!resolved.startsWith(PROJECT_ROOT + path.sep) && resolved !== PROJECT_ROOT) {
    throw new Error(`Access denied: path "${relativePath}" is outside the project`);
  }

  return resolved;
}

export function validateWritePath(relativePath: string): string {
  const resolved = validateReadPath(relativePath);
  const relFromRoot = path.relative(PROJECT_ROOT, resolved);
  const topDir = relFromRoot.split(path.sep)[0];

  if (!ALLOWED_WRITE_DIRS.includes(topDir)) {
    throw new Error(`Write denied: can only write to ${ALLOWED_WRITE_DIRS.join(', ')}`);
  }

  const basename = path.basename(resolved);
  if (FORBIDDEN_FILES.includes(basename)) {
    throw new Error(`Write denied: "${basename}" is a protected file`);
  }

  if (!resolved.endsWith('.ts')) {
    throw new Error('Write denied: can only write TypeScript files (.ts)');
  }

  return resolved;
}
