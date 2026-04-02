# Best Practices

## 5 golden rules

### 1. Tests are specs, not scripts

A test should read like a requirement document. Anyone — QA, product, dev — should understand what it verifies without reading the implementation.

```typescript
// Good — reads like a spec
test('user can log in with valid credentials', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.fillCredentials({ username: 'jane@example.com', password: 'secure123' });
  await loginPage.submit();
  await loginPage.expectDashboard();
});

// Bad — implementation details
test('login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'jane@example.com');
  await page.fill('#password', 'secure123');
  await page.click('input[type="submit"]');
  await page.waitForSelector('.dashboard');
});
```

### 2. Selectors stay in Page Objects

Every `getByTestId`, `getByRole`, `locator()` call belongs inside a Page Object or Component. Tests call semantic methods.

If you're writing `page.locator(...)` in a test file, move it to the Page Object.

### 3. One concept per test

Each test verifies one behavior. If you need to describe what the test does with "and", split it.

```typescript
// Good — one concept
test('should display error for missing required fields', async ({ loginPage }) => { /* ... */ });
test('should show success message after login', async ({ loginPage }) => { /* ... */ });

// Bad — two concepts
test('should show error for missing fields and success for valid login', async ({ loginPage }) => {
  // ...this is two tests pretending to be one
});
```

### 4. Tests don't depend on each other

Every test must work in isolation. No test should rely on state created by a previous test. Use API helpers or fixtures for setup.

```typescript
// Bad — depends on previous test creating a user
test('can edit the user', async ({ usersPage }) => {
  await usersPage.editUser('John');  // assumes John exists from previous test
});

// Good — creates its own data
test('can edit a user', async ({ usersPage, testUser }) => {
  await usersPage.editUser(testUser.name);  // testUser created by fixture
});
```

### 5. Tag everything

Tags control which tests run in which context. Every `test.describe` should have at least one tag.

```typescript
test.describe('Login @smoke', () => { /* ... */ });
test.describe('Login Form @regression', () => { /* ... */ });
test.describe('Admin Panel @critical @regression', () => { /* ... */ });
```

## Tags

| Tag | Purpose | When to use |
|-----|---------|------------|
| `@smoke` | Critical happy paths | Login flow, core navigation, main feature |
| `@regression` | Full feature coverage | All non-smoke tests |
| `@critical` | Business-critical flows | Payments, data deletion, security |
| `@visual` | Visual regression | Screenshot comparison tests |
| `@mobile` | Mobile viewport | Tests that verify responsive behavior |
| `@user` | Standard user role | Tests run with non-admin auth state |

Run by tag:

```bash
npx playwright test --grep @smoke
npx playwright test --grep @critical
npx playwright test --grep-invert @visual   # everything except visual
```

## Naming conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Page Object | `kebab-case.page.ts` | `user-profile.page.ts` |
| Component | `kebab-case.component.ts` | `date-picker.component.ts` |
| Test spec | `kebab-case.spec.ts` | `user-profile.spec.ts` |
| API client | `kebab-case.api.ts` | `user.api.ts` |
| Builder | `kebab-case.builder.ts` | `user.builder.ts` |

### Classes

| Type | Pattern | Example |
|------|---------|---------|
| Page | `PascalCase + Page` | `UserProfilePage` |
| Component | `PascalCase + Component` | `DatePickerComponent` |
| API | `PascalCase + API` | `UserAPI` |
| Builder | `PascalCase + Builder` | `UserBuilder` |

### Methods

| Type | Pattern | Example |
|------|---------|---------|
| Action | Verb phrase | `submitForm()`, `deleteRow()`, `searchFor()` |
| Assertion | `expect` + noun | `expectSuccess()`, `expectErrorMessage()` |
| Getter | `get` + noun | `getRowCount()`, `getText()` |

### Test descriptions

Use the format: `should <expected behavior>` or `<subject> can <action>`.

```typescript
test('should display error for missing required fields');
test('user can log in with valid credentials');
test('should show dashboard after login');
```

## Common mistakes

### Sleeping

```typescript
// Bad — arbitrary wait, slows tests, still flaky
await page.waitForTimeout(3000);

// Good — wait for the specific condition
await page.waitForLoadState('networkidle');
await expect(locator).toBeVisible();
await page.waitForResponse('/api/data');
```

> [!tip] Zero tolerance for `waitForTimeout`
> If you find yourself adding a sleep, you're waiting for the wrong thing. Wait for a network response, a DOM element, or a load state instead.

### Catching errors to prevent test failure

```typescript
// Bad — hides real failures
try {
  await loginPage.expectDashboard();
} catch {
  console.log('Dashboard not ready, skipping...');
}

// Good — let it fail, investigate why
await loginPage.expectDashboard();
```

### Sharing state between tests

```typescript
// Bad — tests are coupled
let createdUserId: string;

test('create user', async () => {
  createdUserId = await api.createUser(data);
});

test('edit user', async () => {
  await api.editUser(createdUserId);  // breaks if first test fails
});
```

Use fixtures for shared setup. See [[05-fixtures]].

### Page Object too large

If a Page Object exceeds ~200 lines, it's doing too much. Extract reusable parts into Components:

```typescript
// Before: 300-line page object with inline form/modal/toast logic

// After: compose with Components
readonly form = new FormComponent(page, page.getByTestId('login-form'));
readonly confirmModal = new ModalComponent(page, page.getByTestId('confirm-modal'));
readonly toast = new ToastComponent(page, page.getByTestId('toast'));
```

> [!note] The scaffolded `LoginPage` is intentionally simple — it doesn't need component extraction. This pattern becomes valuable as your pages grow more complex.

## Checklist before commit

- [ ] Tests pass locally: `npm test`
- [ ] No selectors in test files
- [ ] Every `test.describe` has a tag
- [ ] New Page Objects are registered in `src/fixtures/index.ts`
- [ ] No `waitForTimeout` calls
- [ ] No hardcoded test data — use builders
- [ ] Import `test` and `expect` from `src/fixtures`, not `@playwright/test`
- [ ] Lint passes: `npm run lint`
- [ ] Visual baselines reviewed (if updated)

