# Fixtures

Fixtures are Playwright's dependency injection system. Instead of manually creating Page Objects in every test, you declare what you need and Playwright provides it.

## How it works

The file `src/fixtures/index.ts` defines custom fixtures that extend Playwright's built-in `test`:

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

type TestFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '../utils/custom-matchers';
```

When a test declares `async ({ loginPage }) =>`, Playwright:
1. Creates a fresh `page` (browser tab)
2. Passes it to the `loginPage` fixture function
3. Constructs `new LoginPage(page)`
4. Injects the instance into your test via `use()`
5. After the test, tears everything down

## Adding a new fixture

Three lines. That's it.

```typescript
// 1. Import the Page Object
import { SettingsPage } from '../pages/settings.page';

// 2. Add to the type
type TestFixtures = {
  loginPage: LoginPage;
  settingsPage: SettingsPage;  // ← add
};

// 3. Add the fixture definition
settingsPage: async ({ page }, use) => {
  await use(new SettingsPage(page));
},
```

Now any test can request `settingsPage`:

```typescript
test('can change settings', async ({ settingsPage }) => {
  await settingsPage.navigate();
  // ...
});
```

## Fixtures with pre-setup

Sometimes you want a fixture that does setup work before the test runs — like navigating to a page or logging in:

```typescript
loginPage: async ({ page }, use) => {
  const login = new LoginPage(page);
  await login.navigate();          // pre-navigate
  await login.waitForPageReady();  // wait for page to load
  await use(login);                // test starts here
},
```

The test receives a `loginPage` that's already on the login page:

```typescript
test('login form is ready', async ({ loginPage }) => {
  // Already navigated — go straight to assertions
  await loginPage.expectFormVisible();
});
```

> [!tip] Use pre-setup sparingly
> Only pre-navigate when every test using that fixture starts on the same page. Otherwise, keep fixtures simple and let tests call `navigate()` themselves.

## Lazy fixtures

Playwright only runs fixtures that the test actually requests. If a test only needs `loginPage`, other fixtures are never created. No wasted work.

```typescript
// Only loginPage is instantiated — other fixtures are skipped
test('login form shows validation errors', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.submit();
  await loginPage.expectValidationErrors();
});
```

## Fixtures with cleanup

The code after `await use()` runs as cleanup, even if the test fails:

```typescript
apiClient: async ({}, use) => {
  const api = new UserAPI();
  const user = await api.createUser(UserBuilder.create().build());
  await use(api);
  // Cleanup: runs after test completes (pass or fail)
  await api.deleteUser(user.id);
  await api.dispose();
},
```

This is how you guarantee teardown. See [[07-api-helpers]] for more on API fixtures.

## Fixture dependencies

Fixtures can depend on other fixtures:

```typescript
preparedLoginPage: async ({ loginPage }, use) => {
  await loginPage.navigate();
  await use(loginPage);
},
```

Playwright resolves the dependency graph automatically.

> [!tip] Always import from `src/fixtures`
> Never import `test` or `expect` from `@playwright/test` directly in your test files. Always use:
>
> ```typescript
> import { test, expect } from '../../src/fixtures';
> ```
>
> The fixtures file re-exports `test` with your custom fixtures applied, and `expect` with custom matchers. Importing from `@playwright/test` bypasses both.

