<p align="center">
  <img src="https://img.shields.io/badge/Playwright-2D4F67?style=for-the-badge&logo=playwright&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Biome-60A5FA?style=for-the-badge&logo=biome&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<h1 align="center">histrion</h1>

<p align="center">
  <strong>Playwright testing toolkit — scaffold projects and generate Page Objects.</strong><br>
  Page Object Model · Typed fixtures · Data builders · Visual regression · CI/CD · Page scanner
</p>

<p align="center">
  <em>A <strong>histrion</strong> is a dramatic actor — and the perfect companion for <a href="https://playwright.dev">Playwright</a>.</em>
</p>
<br>

## What you get

Run one command. Answer a few questions. Get a fully configured project with:

- **Page Object Model architecture** — 7-layer separation of concerns
- **Reusable components** — Table, Modal, Form, Toast out of the box
- **Type-safe fixtures** — Page Objects injected into tests automatically
- **Fluent data builders** — chainable test data construction with optional Faker.js
- **Faker.js integration** — generate realistic random test data (optional)
- **API helpers** — setup/teardown without touching the UI
- **Visual regression** — screenshot comparison with smart masking
- **Custom HTML reporter** — dark-mode, filterable, tag-aware, auto-open on failure
- **Structured logger** — every action traced with color-coded timestamps, fully customizable theme
- **Custom expect matchers** — domain-specific assertions
- **Biome** — linting + formatting, zero config
- **GitHub Actions** — CI/CD with matrix strategy, manual dispatch
- **16 documentation guides** — from getting started to best practices
- **Starter templates** — Page Object, fixture & test boilerplate ready to fill in
- **Page scanner** — analyze any live page and generate a Page Object automatically

## Quick start

```bash
npx histrion create              # interactive — prompts for project name
npx histrion create my-e2e-tests # create in a new folder
npx histrion create .            # scaffold in current directory
```

The CLI scaffolds the project, installs dependencies, downloads Playwright browsers, runs a lint check, and initializes git. You walk away with a ready-to-use test suite.

```
  ⚡ histrion create — scaffold a production-grade Playwright project

  - Project name: my-e2e-tests
  - Application base URL: https://your-app.com
  - Include starter template files? Yes
  - Install Faker.js? Yes
  - Include visual regression tests? Yes
  - Include API helpers for setup/teardown? Yes
  - Include GitHub Actions CI/CD? Yes

  ✓ Scaffolded 36 files
  ✓ Dependencies installed
  ✓ Playwright browsers installed
  ✓ All files pass lint & format
  ✓ Git repository initialized with first commit

  ✓ Project ready!

  Get started:

    cd my-e2e-tests
    code .
```

## Page scanner

Don't write Page Objects from scratch. Point the scanner at any page and get a ready-to-use file:

```bash
npx histrion scan https://myapp.com/login
```

```
  🔍 histrion scan — analyze page & generate Page Object

  ✓ Page loaded — "Login"
  ✓ Found 5 interactive elements

  Scan results:

  Element               Strategy
  ────────────────────────────────────
  emailInput            getByTestId
  passwordInput         getByTestId
  loginButton           getByTestId
  forgotPasswordLink    getByRole
  navLogoLink           locator(css)

  ✓ Page Object generated

  File: src/pages/login.page.ts
  Stable locators: 3/5 (60%)
```

The scanner prioritizes stable, language-independent locators (`data-testid`, `id`) over locale-dependent ones (`getByRole`, `getByLabel`). Works on any website — no Histrion project required.

## Built-in structured logger

Every Page Object, Component, and API action is traced automatically:

```
14:32:01 ■ LoginPage       │ 🔹 Filling credentials for user@test.com
14:32:01 ■ LoginPage       │    ▸ Fill "username" with "user@test.com"
14:32:02 ■ LoginPage       │    ▸ Fill "password" with "***"
14:32:02 ■ LoginPage       │ 🔹 Submitting login form
14:32:03 ■ LoginPage       │ ✓ Dashboard visible
```

Five log levels (`step`, `action`, `success`, `warn`, `error`) with customizable colors, icons, and formatting. Add your own levels in one file — see `src/utils/logger.ts`.

## The golden rule

> **Tests never contain selectors.** They read like specifications.

```typescript
test('user can log in', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.fillCredentials({ username: 'user@test.com', password: 's3cret' });
  await loginPage.submit();
  await loginPage.expectDashboard();
});
```

If you see a `page.click()` or a `data-testid` in a test file, something went wrong.

## Architecture

```
src/
├── core/           Abstract base classes (BasePage, BaseComponent, BaseAPI)
├── components/     Reusable UI components (Table, Modal, Form, Toast)
├── pages/          Page Objects — one per page of your app
├── fixtures/       Type-safe dependency injection into tests
├── api/            HTTP clients for test setup/teardown
├── data/
│   ├── builders/   Fluent test data builders (with Faker.js)
│   └── types/      Domain types
├── config/         Environment & user configuration
├── reporters/      Custom HTML reporter
└── utils/          Logger, visual helpers, custom matchers

tests/
├── e2e/            End-to-end test specs
└── visual/         Visual regression specs

docs/               Local-only documentation (13 guides, gitignored)
```

Dependencies flow **down** only. Tests → Fixtures → Pages → Components → Core → Config.

## Starter templates

The scaffolded project includes ready-to-use boilerplate:

- **Page Object** — `src/pages/example.page.ts` with locators, actions, and assertions sections
- **Test file** — `tests/e2e/example.spec.ts` with describe block, beforeEach, and test structure
- **Type definition** — `src/data/types/example.ts` for your page's data shape
- **Fixture wiring** — `src/fixtures/index.ts` pre-configured

Open `example.page.ts` and follow `docs/15-writing-your-first-test.md` to adapt them to your app.

## Available scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests |
| `npm run test:smoke` | Run `@smoke` tagged tests |
| `npm run test:regression` | Run `@regression` tagged tests |
| `npm run test:visual` | Visual regression tests |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run test:debug` | Step-by-step debugger |
| `npm run test:staging` | Run against staging env |
| `npm run lint` | Check with Biome |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run codegen` | Playwright code generator |

## Adding a new page — 3 steps

**1. Create the Page Object** (`src/pages/settings.page.ts`):

```typescript
export class SettingsPage extends BasePage {
  readonly path = '/settings';
  readonly pageTitle = /Settings/;

  private readonly nameInput = this.page.getByTestId('settings-name');
  private readonly saveButton = this.page.getByTestId('settings-save');

  async updateName(name: string): Promise<void> {
    await this.fill(this.nameInput, name, 'name');
    await this.click(this.saveButton, 'Save');
  }
}
```

**2. Register the fixture** (`src/fixtures/index.ts`):

```typescript
settingsPage: async ({ page }, use) => {
  await use(new SettingsPage(page));
},
```

**3. Use in tests**:

```typescript
test('can update name', async ({ settingsPage }) => {
  await settingsPage.navigate();
  await settingsPage.updateName('New Name');
});
```

## Environment management

```bash
TEST_ENV=staging npm test    # staging environment
TEST_ENV=dev npm test        # dev environment
BASE_URL=https://custom.url npm test  # override URL
```

Environments are defined in `src/config/env.config.ts` with per-env timeouts, retries, workers, and headless mode.

## Documentation

The scaffolded project includes 13 local documentation guides in `docs/` (gitignored). They cover everything from architecture to best practices, written for developers new to the framework.

Open `docs/00-index.md` in VS Code or Obsidian to browse them.

## What gets installed

| Package | Purpose |
|---------|---------|
| [`@playwright/test`](https://playwright.dev/) | E2E testing framework — browser automation, assertions, test runner |
| [`typescript`](https://www.typescriptlang.org/) | Type safety across Page Objects, builders, and fixtures |
| [`@biomejs/biome`](https://biomejs.dev/) | Linting + formatting in one tool — replaces ESLint and Prettier |
| [`dotenv`](https://github.com/motdotla/dotenv) | Loads environment variables from `.env` for local configuration |
| [`@faker-js/faker`](https://fakerjs.dev/) | *(optional)* Generates realistic random test data in builders |

## Requirements

- Node.js 18+
- npm 8+

## License

MIT
