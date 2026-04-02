# Getting Started

## Run your first test

```bash
npm test
```

This runs all E2E tests in the `e2e-admin` project using Chromium. Results appear in the terminal and in `reports/`.

## Available scripts

| Script | What it does |
|--------|-------------|
| `npm test` | Run all tests |
| `npm run test:smoke` | Run tests tagged `@smoke` |
| `npm run test:regression` | Run tests tagged `@regression` |
| `npm run test:visual` | Visual regression tests (screenshot comparison) |
| `npm run test:ui` | Open Playwright's interactive UI mode |
| `npm run test:debug` | Step-by-step debugger with inspector |
| `npm run test:headed` | Run tests in a visible browser |
| `npm run codegen` | Launch Playwright's code generator |
| `npm run lint` | Check code with Biome |
| `npm run lint:fix` | Auto-fix lint issues |

> [!tip] UI mode
> `npm run test:ui` opens a browser-based test runner where you can watch tests execute, filter by tag, and inspect traces. Best way to debug.

## Project structure

```
.
├── playwright.config.ts        # Playwright configuration (env-aware)
├── global-setup.ts             # Authenticates test users before all tests
├── src/
│   ├── core/                   # Abstract base classes
│   │   ├── base.page.ts        #   BasePage — all pages extend this
│   │   ├── base.component.ts   #   BaseComponent — all components extend this
│   │   └── base.api.ts         #   BaseAPI — all API clients extend this
│   ├── components/             # Reusable UI components
│   │   ├── table.component.ts  #   TableComponent
│   │   ├── modal.component.ts  #   ModalComponent
│   │   ├── form.component.ts   #   FormComponent
│   │   └── toast.component.ts  #   ToastComponent
│   ├── pages/                  # Page Objects — one per page
│   │   └── login.page.ts       #   LoginPage
│   ├── fixtures/               # Playwright fixture definitions
│   │   └── index.ts            #   All fixtures registered here
│   ├── api/                    # API clients for setup/teardown
│   │   └── user.api.ts         #   UserAPI
│   ├── data/
│   │   ├── builders/           # Fluent data builders
│   │   │   ├── base.builder.ts #   Builder<T> base class
│   │   │   └── user.builder.ts     #   UserBuilder
│   │   └── types/              # Domain types
│   │       └── index.ts
│   ├── config/
│   │   ├── env.config.ts       # Environment configuration
│   │   └── users.config.ts     # Test user credentials
│   ├── reporters/
│   │   └── html-report.ts      # Custom HTML reporter
│   └── utils/
│       ├── logger.ts           # Structured logger
│       ├── visual.ts           # Visual regression helpers
│       └── custom-matchers.ts  # Domain-specific assertions
├── tests/
│   ├── e2e/                    # End-to-end test specs
│   │   └── login.spec.ts
│   └── visual/                 # Visual regression specs
│       └── visual.spec.ts
└── docs/                       # You are here
```

## Where to put things

| I want to... | Put it in... |
|-------------|-------------|
| Add a new page | `src/pages/my-page.page.ts` → register in `src/fixtures/index.ts` |
| Reuse a UI element across pages | `src/components/my-component.component.ts` |
| Add a test | `tests/e2e/my-feature.spec.ts` |
| Add a visual test | `tests/visual/my-visual.spec.ts` |
| Create test data | `src/data/builders/my-entity.builder.ts` |
| Add an API client | `src/api/my-entity.api.ts` |
| Add a domain type | `src/data/types/index.ts` |
| Add a custom assertion | `src/utils/custom-matchers.ts` |
| Change environment settings | `src/config/env.config.ts` |

## Targeting environments

The `TEST_ENV` variable controls which environment your tests run against:

```bash
TEST_ENV=staging npm test       # staging environment
TEST_ENV=dev npm test           # dev environment
TEST_ENV=production npm test    # production (read-only safe tests only)
```

Override the base URL directly:

```bash
BASE_URL=https://custom.url npm test
```

See [[09-configuration]] for the full environment matrix.

## Biome

This project uses [Biome](https://biomejs.dev/) for linting and formatting instead of ESLint + Prettier. Configuration lives in `biome.json`.

```bash
npm run lint          # check
npm run lint:fix      # auto-fix
```

> [!tip] No eslint, no prettier
> Biome replaces both. One tool, zero config, fast.

