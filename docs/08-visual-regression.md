# Visual Regression

Visual regression tests capture screenshots and compare them against stored baselines. If the screenshots differ beyond a threshold, the test fails.

## How it works

1. First run: Playwright takes a screenshot and saves it as the **baseline** in `tests/visual/*.spec.ts-snapshots/`
2. Next runs: Playwright takes a new screenshot and compares it pixel-by-pixel against the baseline
3. If the diff exceeds the threshold, the test fails and produces a diff image

## Two comparison functions

Both live in `src/utils/visual.ts`.

### `compareFullPage` — entire page

```typescript
import { compareFullPage, dynamicContentMasks } from '../../src/utils/visual';

test('login page matches snapshot', async ({ loginPage }) => {
  await loginPage.navigate();

  await compareFullPage(loginPage.page, 'login-full', {
    mask: dynamicContentMasks(loginPage.page),
  });
});
```

Parameters:
- `page` — the Playwright page
- `name` — snapshot name (becomes `<name>.png`)
- `options.mask` — array of Locators to mask (replaced with pink boxes)
- `options.maxDiffPixelRatio` — max ratio of different pixels (default: 100)
- `options.threshold` — per-pixel color tolerance 0-1 (default: 0.2)

### `compareElement` — single element

```typescript
import { compareElement } from '../../src/utils/visual';

test('login form matches snapshot', async ({ loginPage }) => {
  await loginPage.navigate();

  await compareElement(loginPage.form, 'login-form');
});
```

Use this when you only care about a specific component, not the full page.

## Masking dynamic content

Timestamps, avatars, notification counts — these change on every run. Mask them to avoid false positives.

The `dynamicContentMasks()` helper returns locators for common dynamic elements:

```typescript
import { dynamicContentMasks } from '../../src/utils/visual';

// Masks elements with these test IDs: timestamp, avatar, dynamic-id
// Also masks all <time> elements
const masks = dynamicContentMasks(page);

await compareFullPage(page, 'my-page', { mask: masks });
```

Add custom masks by extending the array:

```typescript
await compareFullPage(page, 'my-page', {
  mask: [
    ...dynamicContentMasks(page),
    page.locator('[data-testid="notification-count"]'),
    page.locator('.animated-banner'),
  ],
});
```

> [!tip] When in doubt, mask it
> A flaky visual test is worse than no visual test. If an element changes between runs, mask it.

## Creating baselines

The first time you run visual tests, there are no baselines. Playwright creates them automatically:

```bash
npm run test:visual
```

To update existing baselines after intentional UI changes:

```bash
npx playwright test --project=visual --update-snapshots
```

> [!tip] Always review before committing
> Updated baselines go in `tests/visual/*.spec.ts-snapshots/`. Review the diff images before committing — an accidental baseline update can hide real regressions.

## What a failure looks like

When a visual test fails, Playwright generates three images in `test-results/`:

| File | What it shows |
|------|--------------|
| `*-expected.png` | The stored baseline |
| `*-actual.png` | What the test captured |
| `*-diff.png` | Highlighted pixel differences |

Open `*-diff.png` to see exactly what changed. Pink areas are the differences.

## Configuration

Visual test settings in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.01,  // 1% pixel difference allowed
  },
},
```

The `visual` project in `playwright.config.ts` runs tests from `tests/visual/` with Desktop Chrome and admin auth state:

```typescript
{
  name: 'visual',
  testDir: './tests/visual',
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'auth/admin.json',
  },
},
```

## Best practices

- Run visual tests in **headless mode** only — headed mode renders differently
- Use a **consistent viewport** (set in `playwright.config.ts`: 1440x900)
- Mask **all dynamic content** — timestamps, counters, avatars, animations
- Keep visual tests **separate** from E2E tests (`tests/visual/` directory)
- Review baselines in **PR diffs** before merging

