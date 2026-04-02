# Page Objects

A Page Object represents one page of your application. It hides all selectors and DOM interactions behind semantic methods that describe **what a user does**, not how the browser does it.

## Creating a Page Object — 6 steps

We'll build a `SettingsPage` from scratch.

### Step 1: Create the file

Create `src/pages/settings.page.ts`:

```typescript
import { BasePage } from '../core/base.page';

export class SettingsPage extends BasePage {
  readonly path = '/settings';
  readonly pageTitle = /Settings/;
}
```

Every Page Object extends `BasePage` and defines two properties:
- `path` — relative URL from the base URL
- `pageTitle` — expected document title (string or RegExp)

### Step 2: Add locators (always private)

```typescript
export class SettingsPage extends BasePage {
  readonly path = '/settings';
  readonly pageTitle = /Settings/;

  // Locators — private, never exposed to tests
  private readonly nameInput = this.page.getByTestId('settings-name');
  private readonly emailInput = this.page.getByTestId('settings-email');
  private readonly saveButton = this.page.getByTestId('settings-save');
  private readonly cancelButton = this.page.getByTestId('settings-cancel');
  private readonly successBanner = this.page.getByTestId('settings-success');
}
```

> [!tip] Locators are always `private`
> Tests should never know about selectors. If a locator needs to be accessed from outside, wrap it in a method instead.

### Step 3: Add actions

Actions are what a user can do on this page. Use the inherited `click()`, `fill()`, and `selectOption()` helpers — they add logging automatically.

```typescript
async updateName(name: string): Promise<void> {
  this.log.step(`Updating name to "${name}"`);
  await this.fill(this.nameInput, name, 'name');
  await this.click(this.saveButton, 'Save');
}

async updateEmail(email: string): Promise<void> {
  this.log.step(`Updating email to "${email}"`);
  await this.fill(this.emailInput, email, 'email');
  await this.click(this.saveButton, 'Save');
}

async cancel(): Promise<void> {
  await this.click(this.cancelButton, 'Cancel');
}
```

### Step 4: Add assertions

Assertions verify the page state. Keep them in the Page Object so tests stay clean.

```typescript
async expectSaveSuccess(): Promise<void> {
  const { expect } = await import('@playwright/test');
  await expect(this.successBanner).toBeVisible();
  await expect(this.successBanner).toContainText('saved');
}

async expectNameValue(expected: string): Promise<void> {
  const { expect } = await import('@playwright/test');
  await expect(this.nameInput).toHaveValue(expected);
}
```

### Step 5: Register the fixture

Open `src/fixtures/index.ts` and add three things:

```typescript
import { SettingsPage } from '../pages/settings.page';

// 1. Add to the type
type TestFixtures = {
  loginPage: LoginPage;
  settingsPage: SettingsPage;  // ← add
};

// 2. Add the fixture definition
export const test = base.extend<TestFixtures>({
  // ...existing fixtures...

  settingsPage: async ({ page }, use) => {  // ← add
    await use(new SettingsPage(page));
  },
});
```

### Step 6: Use in tests

```typescript
import { test } from '../../src/fixtures';

test.describe('Settings @regression', () => {
  test('can update display name', async ({ settingsPage }) => {
    await settingsPage.navigate();
    await settingsPage.updateName('New Name');
    await settingsPage.expectSaveSuccess();
    await settingsPage.expectNameValue('New Name');
  });
});
```

No selectors. No `page.click()`. The test reads like a specification.

## Composition with Components

When a page contains a reusable UI element (table, modal, toast), compose it as a Component:

```typescript
import { TableComponent } from '../components/table.component';
import { ToastComponent } from '../components/toast.component';

export class SettingsPage extends BasePage {
  readonly path = '/settings';
  readonly pageTitle = /Settings/;

  // Composed components
  readonly auditLog: TableComponent;
  readonly toast: ToastComponent;

  constructor(page: Page) {
    super(page);
    this.auditLog = new TableComponent(page, page.getByTestId('audit-table'));
    this.toast = new ToastComponent(page, page.getByTestId('toast'));
  }
}
```

Tests then use: `settingsPage.auditLog.expectRowCount(5)`.

See [[04-components]] for how to build custom Components.

## Naming conventions

| What | Convention | Example |
|------|-----------|---------|
| File | `kebab-case.page.ts` | `user-profile.page.ts` |
| Class | `PascalCase + Page` | `UserProfilePage` |
| Actions | Verb phrase | `updateName()`, `submitForm()`, `deleteRow()` |
| Assertions | `expect` + noun | `expectSaveSuccess()`, `expectErrorMessage()` |
| Locators | Descriptive noun | `nameInput`, `saveButton`, `errorMessage` |

## What BasePage gives you

You inherit these methods from `BasePage` — no need to reimplement:

| Method | Purpose |
|--------|---------|
| `navigate()` | Go to `this.path`, wait for page ready |
| `expectToBeVisible()` | Assert page title matches `this.pageTitle` |
| `click(locator, desc)` | Click with logging |
| `fill(locator, value, desc)` | Clear + fill with logging |
| `selectOption(locator, value, desc)` | Select dropdown option with logging |
| `getText(locator)` | Get text content |
| `isVisible(locator)` | Check visibility |
| `waitForSelector(selector, state)` | Wait for element state |
| `waitForResponse(pattern)` | Wait for network response |
| `waitForNavigation()` | Wait for network idle |
| `takeScreenshot(name)` | Save screenshot to `screenshots/` |

