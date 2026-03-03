import { ChildProcess, spawn } from 'child_process';
import { PROJECT_ROOT } from './security';

let activeRun: ChildProcess | null = null;

export function spawnTestRun(
  args: string[],
  onData: (chunk: string) => void,
  onClose: (code: number | null) => void,
): ChildProcess {
  if (activeRun) {
    activeRun.kill('SIGTERM');
  }

  const child = spawn('npx', ['playwright', 'test', '--reporter=line', ...args], {
    cwd: PROJECT_ROOT,
    shell: true,
    timeout: 120_000,
  });

  activeRun = child;

  child.stdout.on('data', (d: Buffer) => onData(d.toString()));
  child.stderr.on('data', (d: Buffer) => onData(d.toString()));
  child.on('close', (code) => {
    activeRun = null;
    onClose(code);
  });

  return child;
}

export function abortActiveRun(): boolean {
  if (activeRun) {
    activeRun.kill('SIGTERM');
    activeRun = null;
    return true;
  }
  return false;
}
