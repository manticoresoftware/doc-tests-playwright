# Manticore Search Documentation - Playwright UI Tests

Automated UI tests for the [Manticore Search documentation website](https://manual.manticoresearch.com) using [Playwright](https://playwright.dev/) and TypeScript.

## What is tested

| Test suite | Description |
|---|---|
| `basic-connection` | Smoke test — verifies the website loads |
| `search` | Searches documentation and verifies result navigation |
| `code-tabs` | SQL / HTTP / PHP / Python tab switching and global sync |
| `language-switcher` | Language switching (EN / RU / ZH) and cookie persistence |
| `os-tabs` | OS installation tabs (RHEL / Debian / Docker / MacOS / Kubernetes) |

## Features

- **Video on failure** — records video of test execution, keeps only on failure
- **Trace on retry** — captures detailed trace (DOM snapshots, network, console) on first retry
- **Auto-retries** — 2 retries on CI to handle flaky tests
- **CI retry of failures** — re-runs only failed tests with `--last-failed`
- **HTML report** — with embedded videos, traces, and screenshots
- **Docker parity** — same Playwright image locally and in CI

## Quick start

### Prerequisites

- Node.js 18+

### Install

```bash
npm install
npx playwright install chromium
```

### Run tests

```bash
# Run all tests (headless)
npm test

# Run with visible browser
npm run test:headed

# Run with interactive UI mode
npm run test:ui

# Open last HTML report
npm run report
```

### Run with Docker

Ensures identical browser environment as CI:

```bash
npm run test:docker
```

## Project structure

```
├── tests/                    # Test specs
│   ├── basic-connection.spec.ts
│   ├── search.spec.ts
│   ├── code-tabs.spec.ts
│   ├── language-switcher.spec.ts
│   └── os-tabs.spec.ts
├── pages/                    # Page Object Models
│   ├── manual.page.ts
│   ├── search.page.ts
│   └── code-tabs.page.ts
├── playwright.config.ts      # Playwright configuration
├── docker-compose.yml        # Docker setup for local runs
├── Dockerfile                # Production image
└── .github/workflows/        # CI pipeline
```

## CI/CD

Tests run automatically via GitHub Actions:
- On every **pull request** to `main`
- **Daily** at midnight UTC (scheduled)

On failure, the HTML report (with video and traces) is uploaded as an artifact and kept for 14 days.

## Viewing test results

### HTML Report
After running tests locally, open the report:
```bash
npm run report
```

### Trace Viewer
For failed tests with traces:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### UI Mode
Interactive mode for developing and debugging tests:
```bash
npm run test:ui
```
