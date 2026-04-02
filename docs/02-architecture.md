# Architecture

## The 7 layers

```
Layer 6  Tests          tests/e2e/*.spec.ts, tests/visual/*.spec.ts
Layer 5  Fixtures       src/fixtures/index.ts
Layer 4  Pages          src/pages/*.page.ts
Layer 3  Components     src/components/*.component.ts
Layer 2  Core           src/core/base.page.ts, base.component.ts, base.api.ts
Layer 1  Utilities      src/utils/, src/data/, src/api/
Layer 0  Config         src/config/, playwright.config.ts
```

Dependencies flow **down** only. A Page can use a Component. A Component can use Core. Nothing flows upward.

### Layer 0 — Config

Environment settings, test user credentials, Playwright project definitions.

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Projects, timeouts, reporters, browser settings |
| `src/config/env.config.ts` | Per-environment URLs, retries, workers |
| `src/config/users.config.ts` | Test user credentials (reads from env vars) |
| `global-setup.ts` | Authenticates users and caches auth state |

### Layer 1 — Utilities

Cross-cutting concerns that don't depend on the application under test.

| File | Purpose |
|------|---------|
| `src/utils/logger.ts` | Structured logger with timestamps and context |
| `src/utils/custom-matchers.ts` | Domain-specific `expect` extensions |
| `src/utils/visual.ts` | Screenshot comparison helpers |
| `src/data/builders/*.ts` | Fluent test data builders |
| `src/data/types/index.ts` | Shared TypeScript types |
| `src/api/*.api.ts` | HTTP clients for test setup/teardown |

### Layer 2 — Core

Abstract base classes that define the contracts for Pages, Components, and APIs.

| File | What it provides |
|------|-----------------|
| `base.page.ts` | `navigate()`, `click()`, `fill()`, `selectOption()`, `waitFor*()`, logging |
| `base.component.ts` | Scoped `root` locator, `locator()`, visibility assertions, `waitFor*()` |
| `base.api.ts` | `get()`, `post()`, `put()`, `patch()`, `delete()`, context lifecycle |

> [!tip] You rarely modify Core
> These base classes handle the "how" — logging, waiting, error handling. Your Page Objects and Components handle the "what".

### Layer 3 — Components

Reusable UI elements that appear on multiple pages. Each Component is scoped to a `root` Locator.

Built-in: `TableComponent`, `ModalComponent`, `FormComponent`, `ToastComponent`.

See [[04-components]] for details.

### Layer 4 — Pages

One Page Object per page of your application. Pages compose Components and expose semantic methods.

```typescript
// LoginPage extends BasePage, uses Logger
readonly path = '/login';
readonly pageTitle = /Login/;
```

See [[03-page-objects]] for details.

### Layer 5 — Fixtures

The bridge between Page Objects and tests. Each fixture instantiates a Page Object and injects it into the test function.

```typescript
loginPage: async ({ page }, use) => {
  await use(new LoginPage(page));
},
```

See [[05-fixtures]] for details.

### Layer 6 — Tests

Test specs that read like specifications. They use fixtures to get Page Objects and call semantic methods.

```typescript
test('user can log in with valid credentials', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.fillCredentials(UserBuilder.create().build());
  await loginPage.submit();
  await loginPage.expectDashboard();
});
```

## The dependency rule

```
Tests → Fixtures → Pages → Components → Core → Config
  ↓                   ↓
Utilities          Utilities
```

**Allowed:**
- A test imports from fixtures and utilities
- A Page imports from components, core, and utilities
- A Component imports from core and utilities

**Forbidden:**
- A Component importing from a Page
- Core importing from a Page or Component
- A test importing from `@playwright/test` directly (use `src/fixtures` instead)

> [!tip] Import discipline
> Always import `test` and `expect` from `src/fixtures`, never from `@playwright/test`. The fixtures file re-exports everything you need with the custom extensions applied.

## When to add something — 5 questions

| Question | Answer → Action |
|----------|----------------|
| Is this UI element used on 2+ pages? | Yes → **Component** (`src/components/`) |
| Is this a new page of the app? | Yes → **Page Object** (`src/pages/`) |
| Do I need test data with multiple variations? | Yes → **Builder** (`src/data/builders/`) |
| Do I need to set up data via API? | Yes → **API client** (`src/api/`) |
| Is this a reusable assertion? | Yes → **Custom matcher** (`src/utils/custom-matchers.ts`) |

If none of these apply, it probably belongs in the test file itself or in an existing Page Object.

