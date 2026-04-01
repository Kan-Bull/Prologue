# Page Scanner

## The problem

Writing Page Objects from scratch means opening DevTools, inspecting every element, choosing the right locator strategy, and typing it all out. It's tedious and error-prone — especially on pages with dozens of interactive elements.

## The solution

The scanner analyzes a live page and generates a ready-to-use Page Object with the best locator for each element:

```bash
npx histrion scan https://myapp.com/login
```

It opens the page in a headless browser, finds every interactive element, picks the most stable locator strategy, and writes a `.page.ts` file you can drop into your project.

## How it works

### 1. Page analysis

The scanner finds all interactive elements on the page:

- `input`, `textarea`, `select`, `button`
- `a[href]`
- Elements with ARIA roles: `[role="button"]`, `[role="link"]`, `[role="tab"]`, `[role="checkbox"]`, `[role="radio"]`, `[role="switch"]`

For each element, it collects: tag name, type, id, name, placeholder, aria-label, role, data-test attributes, visible text, associated labels, and CSS classes.

### 2. Locator ranking

Each element is assigned the most stable locator strategy available, in this priority order:

| Priority | Strategy | Why |
|----------|----------|-----|
| 1 | `getByTestId()` | Explicitly added for testing, language-independent |
| 2 | `locator("#id")` | Stable, set by developers, language-independent |
| 3 | `getByRole()` | Good semantics, but can break on locale change |
| 4 | `getByLabel()` | Readable, but depends on label text (can be localized) |
| 5 | `getByPlaceholder()` | Fallback, placeholder text can be localized |
| 6 | `locator("css")` | Last resort, fragile |

The key principle: **code-level attributes** (`data-testid`, `id`, `name`) are always preferred over **visible text** (`label`, `placeholder`, `aria-label`) because they don't change when the UI language changes.

### 3. Page Object generation

The scanner generates a TypeScript file that follows the Histrion architecture:

```typescript
import { BasePage } from "../core/base.page";

export class LoginPage extends BasePage {
  readonly path = "/login";
  readonly pageTitle = /Login/;

  // ── Locators ──

  private readonly emailInput = this.page.getByTestId("email");
  private readonly passwordInput = this.page.getByTestId("password");
  private readonly loginButton = this.page.getByTestId("login-submit");
  private readonly forgotPasswordLink = this.page.getByRole("link", { name: "Forgot password?" });

  // ── Actions ──
  // TODO: Add page actions here

  // ── Assertions ──
  // TODO: Add page assertions here
}
```

Variable names are always derived from code-level attributes (`data-testid`, `id`, `name`) to ensure they're in English regardless of the page language.

## Usage

### Basic scan

```bash
npx histrion scan https://myapp.com/contact
```

### Custom test ID attribute

If your app uses a custom test ID attribute (e.g., `data-cy` for Cypress, `data-qa`):

```bash
npx histrion scan https://myapp.com/contact --test-id-attr data-cy
```

### Output location

- If run inside a Histrion project (a `src/pages/` folder exists), the file is written to `src/pages/`.
- Otherwise, it's written to the current directory.

## Terminal output

The scanner shows a summary table with each element and its chosen strategy:

```
  🔍 create-histrion scan — analyze page & generate Page Object

  ✓ Page loaded — "Contact Us"
  ✓ Found 16 interactive elements

  Scan results:

  Element               Strategy
  ────────────────────────────────────
  firstNameInput        getByTestId
  lastNameInput         getByTestId
  emailInput            getByTestId
  submitButton          getByTestId
  forgotPasswordLink    getByRole
  navLogoLink           locator(css)

  ✓ Page Object generated

  File: src/pages/contact.page.ts
  Stable locators: 4/6 (67%)
```

Strategies are color-coded:
- **Green** — `getByTestId`, `locator#id` (stable, language-independent)
- **Yellow** — `getByRole`, `getByLabel` (locale-dependent)
- **Red** — `locator(css)` (fragile)

## Tips for better results

- **Add `data-testid` attributes** to your app's interactive elements — the scanner will pick them up automatically and produce the most stable locators.
- **Scan after the page is fully loaded** — the scanner waits for `networkidle`, but SPAs with lazy-loaded content may need the page to settle first.
- **Review the generated file** — the scanner gives you a solid starting point, but you'll want to add actions and assertions, and possibly remove locators you don't need (nav links, footer links, etc.).

## Works standalone

The scanner doesn't require a Histrion project. You can run it against any website to quickly get a list of interactive elements and their best locators — useful for auditing test coverage or planning Page Object structure.
