# Visual Regression Testing Guide

This guide details setting up and running visual regression tests with Playwright against Storybook.

## 8. Visual Regression with Playwright
We use Playwright to render Storybook stories and snapshot them. We run Playwright against the built Storybook static site to ensure deterministic backgrounds.

### 8.1 Install Playwright
(Already included in dependencies)
```bash
pnpm dlx playwright@1.46 install --with-deps
```

### 8.2 Playwright Config (`apps/web/playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'playwright',
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.0001 } },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:6006', trace: 'on-first-retry', headless: true },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
})
```

### 8.3 Playwright Test File (`apps/web/playwright/tests/visual.spec.ts`)
```typescript
import { test, expect } from '@playwright/test'

const stories = [
  { path: '/iframe.html?id=ui-button--primary', name: 'button-primary' },
  { path: '/iframe.html?id=ui-button--secondary', name: 'button-secondary' }
]

for (const s of stories) {
  test(`visual: ${s.name}`, async ({ page }) => {
    await page.goto(s.path)
    const root = page.locator('#root') // Storybook mounts story in #root
    await expect(root).toHaveScreenshot(`${s.name}.png`, { animations: 'disabled' })
  })
}
```
*Note: Storybook iframe path format is `iframe.html?id=story-id` where `story-id` is the kebab-case of the story title and story name.*

### 8.4 Local Run (Dev)
1. Start Storybook: `pnpm storybook` (port 6006).
2. In another terminal: `pnpm playwright test`.

Playwright will create snapshot images under `playwright/test-results` (or configured folder). The first run creates baseline images. Subsequent runs compare and fail on diffs.

## 9. CI: GitHub Actions Example
Create `.github/workflows/visual-regression.yml` with steps to build storybook and run tests.

```yaml
name: Visual Regression
on: [pull_request]
jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install pnpm
        run: npm i -g pnpm@9
      - name: Install deps
        run: pnpm install --frozen-lockfile
        working-directory: apps/web
      - name: Build Storybook
        run: pnpm build-storybook --output-dir storybook-static
        working-directory: apps/web
      - name: Start Storybook
        run: npx http-server ./storybook-static -p 6006 &
        working-directory: apps/web
      - name: Install Playwright browsers
        run: pnpm dlx playwright@1.46 install --with-deps
        working-directory: apps/web
      - name: Run Playwright Visual Tests
        run: pnpm playwright test --reporter=list
        working-directory: apps/web
      - name: Upload diff artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: vr-diffs
          path: apps/web/playwright/test-results
```

## 10. Baseline Management Strategies
* Keep baseline images in a dedicated folder under `apps/web/playwright/baseline/` and commit them (only if small).
* **Preferred pattern**: Baselines published as a release artifact from the main build and downloaded into the PR job for comparisons. This avoids merge conflicts on large binary files.
* If visual diffs are expected, use a process to accept the updated baseline.

## 12. Acceptance Criteria
* `pnpm storybook` runs locally and shows stories.
* MSW successfully mocks endpoints and stories render stable data.
* `pnpm playwright test` runs against Storybook and creates baseline screenshots on the first run.
* GitHub Actions runs build + test on PR and fails when visual diffs exceed the threshold.

## 13. Troubleshooting Tips
* **Flickering / animations**: Disable animations in stories (add global CSS `* { animation: none !important; transition: none !important }`) or use `await page.waitForTimeout(100)` before screenshot.
* **Fonts**: Load consistent fonts in Storybook so snapshots are deterministic.
* **Non-deterministic content**: Seed random IDs/time with deterministic values in stories or mock clocks.

## 14. Roadmap
* Integrate **Chromatic** (paid) for cloud visual regression & UI review.
* Add **Percy** or **Applitools** for advanced visual diffs (AI smart diffs).
* Add per-component accessibility tests via **axe** in the storybook test runner.
