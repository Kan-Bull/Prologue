
# Configuration

## Environments

Four environments are defined in `src/config/env.config.ts`:

| Environment | Base URL | Timeout | Retries | Workers | Headless |
|-------------|----------|---------|---------|---------|----------|
| `local` | `https://your-app.com` | 15s | 0 | 4 | No |
| `dev` | `https://dev.example.com` | 30s | 1 | 4 | Yes |
| `staging` | `https://staging.example.com` | 30s | 2 | 2 | Yes |
| `production` | `https://app.example.com` | 60s | 2 | 1 | Yes |

Switch environments with `TEST_ENV`:

```bash
TEST_ENV=staging npm test
TEST_ENV=dev npm run test:smoke
```

Default is `local`.

### Override individual values

```bash
BASE_URL=https://custom.url npm test       # override base URL
API_URL=https://custom.url/api npm test    # override API URL
```

`BASE_URL` and `API_URL` environment variables take precedence over the environment config.

### How it works

`EnvConfig` is a singleton (`src/config/env.config.ts`) that reads `TEST_ENV`, loads the matching config, and applies any env var overrides. It also loads `.env` and `.env.<environment>` files via `dotenv`.

```typescript
// Used everywhere — Playwright config, Page Objects, API clients
import { EnvConfig } from './src/config/env.config';

EnvConfig.baseUrl;   // resolved URL
EnvConfig.timeout;   // environment-specific timeout
EnvConfig.retries;   // environment-specific retries
```

## Test users

Test user credentials are defined in `src/config/users.config.ts`:

```typescript
export const users = {
  admin: {
    username: process.env.ADMIN_USER ?? 'admin@example.com',
    password: process.env.ADMIN_PASS ?? 'admin-password',
    role: 'admin',
    displayName: 'Admin User',
  },
  standard: {
    username: process.env.STANDARD_USER ?? 'user@example.com',
    password: process.env.STANDARD_PASS ?? 'user-password',
    role: 'user',
    displayName: 'Standard User',
  },
  readonly: {
    username: process.env.READONLY_USER ?? 'readonly@example.com',
    password: process.env.READONLY_PASS ?? 'readonly-password',
    role: 'readonly',
    displayName: 'Read-Only User',
  },
};
```

> [!tip] Never hardcode real passwords
> The defaults are for local development only. In CI and shared environments, use environment variables or a secrets manager.

## Playwright projects

The `playwright.config.ts` defines 4 projects:

| Project | Test dir | Auth state | Browser | Filter |
|---------|----------|------------|---------|--------|
| `e2e-admin` | `tests/e2e/` | `auth/admin.json` | Desktop Chrome | All tests |
| `e2e-user` | `tests/e2e/` | `auth/standard.json` | Desktop Chrome | `@user` tag |
| `visual` | `tests/visual/` | `auth/admin.json` | Desktop Chrome | All visual tests |
| `mobile` | `tests/e2e/` | `auth/standard.json` | iPhone 14 | `@mobile` tag |

Run a specific project:

```bash
npx playwright test --project=e2e-admin
npx playwright test --project=mobile
npx playwright test --project=visual
```

### How projects and tags interact

By default, `npm test` runs all projects. The `e2e-user` project only picks up tests tagged `@user`, and `mobile` only picks up tests tagged `@mobile`.

```typescript
// This test runs in e2e-admin AND e2e-user (has @user tag)
test.describe('Profile @user', () => {
  test('can view profile', async ({ profilePage }) => { /* ... */ });
});

// This test runs only in e2e-admin (no @user or @mobile tag)
test.describe('Admin Panel @regression', () => {
  test('can manage users', async ({ adminPage }) => { /* ... */ });
});
```

## Auth state caching

`global-setup.ts` runs once before all tests. It:

1. Launches a browser
2. Logs in as each test user (admin, standard)
3. Saves the browser state (cookies, localStorage) to `auth/*.json`
4. Closes the browser

Each Playwright project references a `storageState` file. Tests start already authenticated — no login flow needed.

```typescript
// In global-setup.ts
await authenticateUser(browser, users.admin, 'auth/admin.json');
await authenticateUser(browser, users.standard, 'auth/standard.json');
```

```typescript
// In playwright.config.ts — each project uses a different auth state
{ name: 'e2e-admin', use: { storageState: 'auth/admin.json' } }
{ name: 'e2e-user',  use: { storageState: 'auth/standard.json' } }
```

> [!tip] Auth files are gitignored
> `auth/*.json` contains session tokens and should never be committed. They're regenerated on each run.

### Customizing the login flow

> [!note] Auth is commented out by default
> The scaffolded project targets `your-app.com` as a placeholder. The auth setup in `global-setup.ts` is commented out by default. Uncomment and customize it when you point the project at your own application.

If your app uses a different login mechanism (SSO, OAuth, magic link), edit `global-setup.ts`. The pattern stays the same:

1. Navigate to the login page
2. Perform the authentication steps
3. Call `context.storageState({ path })` to save the result


