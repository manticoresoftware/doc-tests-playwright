import { Router } from 'express';
import { execSync } from 'child_process';
import { handleTool } from '../ai/tool-handlers';
import { PROJECT_ROOT } from '../utils/security';

const router = Router();

// GET /api/tests — list all test files
router.get('/', async (_req, res) => {
  const result = await handleTool('list_tests', {});
  try {
    res.json(JSON.parse(result));
  } catch {
    res.json([]);
  }
});

// POST /api/tests/run — run tests, return structured JSON results
router.post('/run', (req, res) => {
  const { file, grep } = req.body || {};

  const args = ['npx', 'playwright', 'test', '--reporter=json'];
  if (file) args.push(file);
  if (grep) args.push('-g', grep);

  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    stdout = execSync(args.join(' '), {
      cwd: PROJECT_ROOT,
      timeout: 180_000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: any) {
    stdout = err.stdout || '';
    stderr = err.stderr || '';
    exitCode = err.status || 1;
  }

  try {
    const report = JSON.parse(stdout);
    const suites = report.suites || [];
    const results = parseResults(suites);
    const stats = report.stats || {};

    res.json({
      ok: exitCode === 0,
      duration: stats.duration || 0,
      passed: results.filter((r: any) => r.status === 'passed').length,
      failed: results.filter((r: any) => r.status === 'failed').length,
      skipped: results.filter((r: any) => r.status === 'skipped').length,
      total: results.length,
      tests: results,
    });
  } catch {
    // JSON parse failed — return raw output
    res.json({
      ok: exitCode === 0,
      duration: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      tests: [],
      raw: (stdout + '\n' + stderr).trim(),
    });
  }
});

function parseResults(suites: any[]): any[] {
  const results: any[] = [];

  for (const suite of suites) {
    const file = suite.file || '';
    const specs = suite.specs || [];
    const childSuites = suite.suites || [];

    for (const spec of specs) {
      for (const test of spec.tests || []) {
        const result = test.results?.[test.results.length - 1];
        // Playwright JSON: test.status = "expected"|"unexpected"|"flaky"|"skipped"
        // result.status = "passed"|"failed"|"timedOut"|"skipped"
        const rawStatus = result?.status || test.status;
        const status = rawStatus === 'passed' ? 'passed'
          : rawStatus === 'expected' ? 'passed'
          : rawStatus === 'skipped' ? 'skipped'
          : rawStatus === 'failed' || rawStatus === 'unexpected' || rawStatus === 'timedOut' ? 'failed'
          : 'unknown';

        results.push({
          file,
          title: spec.title,
          suite: suite.title,
          status,
          duration: result?.duration || 0,
          error: result?.error?.message || null,
          errorSnippet: result?.error?.snippet || null,
        });
      }
    }

    // Recurse into nested suites (test.describe blocks)
    for (const child of childSuites) {
      const childResults = parseResults([{ ...child, file }]);
      results.push(...childResults);
    }
  }

  return results;
}

export { router as testsRouter };
