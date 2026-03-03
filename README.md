# Manticore Search Documentation — Playwright UI Tests

Automated UI tests for [manual.manticoresearch.com](https://manual.manticoresearch.com) using [Playwright](https://playwright.dev/) + TypeScript.

Tests run against the **live documentation website**, checking that key user flows work correctly: page loading, search, tab switching, language selection, etc.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Install browser (Chromium)
npx playwright install chromium

# 3. Run all tests
npm test
```

---

## What is tested

### `basic-connection.spec.ts` — Smoke test
Checks that the documentation website loads and returns meaningful content.

| Test | What it verifies |
|---|---|
| `website loads successfully` | Page opens, title is non-empty, page contains "manticore" or "search" |

### `search.spec.ts` — Documentation search
Verifies the sidebar search functionality works end-to-end.

| Test | What it verifies |
|---|---|
| `search returns relevant results` | Typing "installation" in search shows dropdown with results containing relevant text |
| `clicking search result navigates to page` | Clicking the first search result navigates to a documentation page |

### `code-tabs.spec.ts` — Code language tabs
Tests the SQL / HTTP / PHP / Python code example tabs on the [Quick start guide](https://manual.manticoresearch.com/Quick_start_guide) page.

| Test | What it verifies |
|---|---|
| `default tab is SQL` | SQL is the initially active tab in code examples |
| `switch to HTTP tab` | Clicking HTTP tab changes the active tab and content |
| `switch to PHP tab` | Same for PHP |
| `switch to Python tab` | Same for Python |
| `tab content changes on switch and restores` | SQL → HTTP → SQL: content changes and restores correctly |
| `global tab sync across code blocks` | Switching tab in one code block syncs all other code blocks on the page |

### `language-switcher.spec.ts` — Language switching
Tests the language selector dropdown (English / Russian / Chinese).

| Test | What it verifies |
|---|---|
| `switch to Russian` | Selecting Russian changes URL to `/ru/` and heading to Cyrillic |
| `switch to Chinese` | Selecting Chinese changes URL to `/zh/` |
| `switch back to English` | Switching RU → EN restores English content |
| `language persists across navigation` | After selecting Russian, navigating to another page keeps Russian |

### `os-tabs.spec.ts` — OS installation tabs
Tests the OS tab switching on the [Installation](https://manual.manticoresearch.com/Installation/Installation) page.

| Test | What it verifies |
|---|---|
| `default tab is RHEL` | RHEL tab is active by default, content contains `yum` |
| `switch to Debian` | Debian tab shows `apt` or `wget` commands |
| `switch to Docker` | Docker tab shows `docker` commands |
| `switch to MacOS` | MacOS tab shows `brew` commands |
| `switch to Kubernetes` | Kubernetes tab shows `helm` commands |
| `switching tabs changes content and restores` | RHEL → Docker → RHEL: content changes and restores |

### `navigation.spec.ts` — Sidebar navigation
Checks that the sidebar contains expected sections and links work correctly.

| Test | What it verifies |
|---|---|
| `sidebar contains expected sections` | Page body contains Introduction, Installation, Quick start guide, Searching |
| `clicking sidebar link navigates to correct page` | Clicking "Quick start guide" navigates to `/Quick_start_guide` |
| `page heading matches page content` | Quick Start page contains "quick start" text |
| `page title reflects current page` | Browser tab title contains "quick start" |

### `anchors.spec.ts` — Page anchors and deep linking
Verifies that anchor links point to existing elements and deep linking works.

| Test | What it verifies |
|---|---|
| `anchor links on Quick Start page point to existing elements` | All `#` anchor links have valid targets on the page |
| `headings have named anchors for deep linking` | Page has `<a class="anchor" name="...">` elements for section linking |

### `copy-button.spec.ts` — Code block copy button
Tests the clipboard copy button on code examples.

| Test | What it verifies |
|---|---|
| `code blocks have a copy button` | Code examples have visible `.copy-btn` buttons |
| `copy button responds to click` | Clicking a copy button doesn't throw an error |

### `broken-links.spec.ts` — Link integrity
Checks that links on the page return valid HTTP responses.

| Test | What it verifies |
|---|---|
| `sidebar navigation links return 200` | All sidebar links return HTTP 200 |
| `main page external links are reachable` | External links return HTTP status < 400 |

### `page-404.spec.ts` — 404 error handling
Tests behavior when navigating to a non-existent page.

| Test | What it verifies |
|---|---|
| `non-existent page redirects or shows error` | Non-existent URL returns status < 500 (no server error) |
| `non-existent page still has working navigation` | Page still has links and meaningful content |

### `mobile-viewport.spec.ts` — Mobile responsiveness
Tests the documentation on an iPhone 12 viewport (390×844).

| Test | What it verifies |
|---|---|
| `page loads on mobile viewport` | Title is non-empty, H1 is visible |
| `content is readable without horizontal scroll` | Body width ≤ viewport width |
| `code blocks are visible on mobile` | Code examples are rendered on small screens |

---

## How to run tests

### Basic commands

```bash
npm test                # Run all tests (headless)
npm run test:headed     # Run with visible browser window
npm run test:ui         # Interactive UI mode (recommended for development)
npm run test:docker     # Run inside Docker (same environment as CI)
npm run report          # Open last HTML report in browser
```

### Run specific tests

```bash
# By file
npx playwright test tests/search.spec.ts

# By test name (grep)
npx playwright test -g "switch to Russian"

# Multiple files
npx playwright test tests/code-tabs.spec.ts tests/os-tabs.spec.ts
```

### Useful flags

| Flag | What it does |
|---|---|
| `--headed` | Shows browser window during test execution |
| `--debug` | Step-by-step execution with pause between actions |
| `--ui` | Opens interactive UI with timeline, DOM snapshots, and network |
| `-g "text"` | Runs only tests matching the text |
| `--last-failed` | Re-runs only tests that failed in the previous run |
| `--reporter=line` | Compact one-line-per-test output |
| `--repeat-each=3` | Runs each test 3 times (useful for detecting flaky tests) |
| `--project=chromium` | Run only in Chromium (default, but useful when more browsers are added) |

### Generate tests automatically

Opens a browser — you click around the site, Playwright writes the test code:

```bash
npx playwright codegen manual.manticoresearch.com
```

---

## Understanding test results

### When tests pass

```
  34 passed (50.1s)
```

### When tests fail

The output shows exactly what failed and why:

```
  Error: expect(received).toContain(expected)

    Expected substring: "helm"
    Received string:    "sudo yum install ..."

    > 60 |     expect(content.toLowerCase()).toContain('helm');
```

This means: the Kubernetes tab was clicked, but the content still shows RHEL commands instead of Helm commands. The tab switch didn't work.

### HTML report (with video)

After any test run:

```bash
npm run report
```

Opens a web page with:
- List of all tests (passed / failed / flaky)
- Click on a failed test to see **video** of what happened
- **Screenshot** at the moment of failure
- **Trace** link for detailed step-by-step analysis

### Trace Viewer (detailed debugging)

For failed tests that have traces (captured on retry):

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

Shows:
- Every action (goto, click, fill, expect) with DOM snapshots
- Network requests and responses
- Browser console logs
- Timeline with exact timing of each step

### UI Mode (best for development)

```bash
npm run test:ui
```

- Run/re-run individual tests with one click
- See DOM state at every step
- Pick locators by clicking on page elements
- Watch mode: tests re-run automatically when you save a file

---

## Project structure

```
doc-tests-playwright/
├── tests/                            # Test files (34 tests)
│   ├── basic-connection.spec.ts      # Smoke test
│   ├── search.spec.ts                # Search functionality
│   ├── code-tabs.spec.ts             # SQL/HTTP/PHP/Python tabs
│   ├── language-switcher.spec.ts     # EN/RU/ZH switching
│   ├── os-tabs.spec.ts               # OS installation tabs
│   ├── navigation.spec.ts            # Sidebar navigation
│   ├── anchors.spec.ts               # Page anchors and deep linking
│   ├── copy-button.spec.ts           # Code block copy button
│   ├── broken-links.spec.ts          # Link integrity
│   ├── page-404.spec.ts              # 404 error handling
│   └── mobile-viewport.spec.ts       # Mobile responsiveness
├── pages/                            # Page Object Models
│   ├── manual.page.ts                # Common page elements (language selector, heading)
│   └── code-tabs.page.ts             # Tab block logic (code tabs + OS tabs)
├── playwright.config.ts              # Playwright configuration
├── docker-compose.yml                # Docker setup for local runs
├── Dockerfile                        # Docker image for tests
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
└── .github/
    ├── workflows/playwright.yml      # CI pipeline
    └── FUNDING.yml
```

---

## CI/CD

Tests run automatically via GitHub Actions:

| Trigger | When |
|---|---|
| Pull Request | On every PR to `main` |
| Schedule | Daily at 00:00 UTC |

### What happens on CI

1. Tests run with **2 automatic retries** per failed test
2. If still failing — re-runs only failed tests with `--last-failed`
3. **HTML report** (with video and traces) uploaded as artifact for **14 days**
4. GitHub PR gets annotations showing which tests failed

### How to check CI results

1. Go to **Actions** tab in GitHub → **Playwright UI Tests**
2. Green checkmark = all tests passed
3. Red X = download artifact **playwright-report-attempt-1**
4. Unzip → open `index.html` → see report with video of failures

---

## How to add a new test

1. Create a file `tests/my-feature.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    // Navigate
    await page.goto('/some-page');

    // Interact
    await page.locator('#my-button').click();

    // Assert
    await expect(page.locator('h1')).toContainText('Expected Title');
    await expect(page).toHaveURL(/expected-path/);
  });
});
```

2. Run it:

```bash
npx playwright test tests/my-feature.spec.ts
```

3. Debug it:

```bash
npx playwright test tests/my-feature.spec.ts --debug
```

---

## Configuration

Key settings in `playwright.config.ts`:

| Setting | Value | Description |
|---|---|---|
| `baseURL` | `https://manual.manticoresearch.com` | All `page.goto('/')` calls go here |
| `retries` | `2` on CI, `0` locally | Auto-retry failed tests on CI |
| `video` | `retain-on-failure` | Records video, keeps only if test fails |
| `trace` | `on-first-retry` | Captures detailed trace on first retry |
| `screenshot` | `only-on-failure` | Takes screenshot when test fails |
| `timeout` | `30s` | Maximum time per test |
| `actionTimeout` | `10s` | Maximum time per action (click, fill, etc.) |
