# API Helpers

## Why skip the UI

Tests should verify one thing. If your test checks "admin can delete a user", the setup (creating the user) should not go through the UI — it's slow, fragile, and not what you're testing.

API helpers create and clean up test data directly via HTTP, so your tests start fast and focused.

## BaseAPI

All API clients extend `BaseAPI` (`src/core/base.api.ts`), which provides:

| Method | Purpose |
|--------|---------|
| `get<T>(endpoint)` | GET request, returns parsed JSON |
| `post<T>(endpoint, data?)` | POST request, returns parsed JSON |
| `put<T>(endpoint, data?)` | PUT request, returns parsed JSON |
| `patch<T>(endpoint, data?)` | PATCH request, returns parsed JSON |
| `delete(endpoint)` | DELETE request, returns void |
| `dispose()` | Closes the API context (release resources) |

All methods:
- Use `EnvConfig.baseUrl` as the base URL
- Send `Accept: application/json` and `Content-Type: application/json` headers
- Log every request
- Throw descriptive errors on non-2xx responses

## Creating an API client

```typescript
import { BaseAPI } from '../core/base.api';
import type { Product } from '../data/types';

export class ProductAPI extends BaseAPI {
  async create(product: Product): Promise<Product> {
    this.log.step(`Creating product via API: ${product.name}`);
    return this.post<Product>('/api/products', product);
  }

  async getById(id: string): Promise<Product> {
    return this.get<Product>(`/api/products/${id}`);
  }

  async delete(id: string): Promise<void> {
    this.log.step(`Deleting product via API: ${id}`);
    return this.delete(`/api/products/${id}`);
  }

  async list(): Promise<Product[]> {
    return this.get<Product[]>('/api/products');
  }
}
```

## Using in global setup

The `global-setup.ts` file runs once before all tests. Use it for data that all tests need:

```typescript
import { ProductAPI } from './src/api/product.api';
import { ProductBuilder } from './src/data/builders/product.builder';

async function globalSetup(): Promise<void> {
  const api = new ProductAPI();
  await api.create(ProductBuilder.create().withName('Seed Product').build());
  await api.dispose(); // always dispose
}
```

## Using in fixtures

For per-test data that needs cleanup, use fixtures with the `await use()` pattern:

```typescript
// In src/fixtures/index.ts
import { UserAPI } from '../api/user.api';
import { UserBuilder } from '../data/builders/user.builder';

testUser: async ({}, use) => {
  const api = new UserAPI();

  // Setup: create user before test
  const user = await api.createUser(
    UserBuilder.create().withRole('standard').build()
  );

  await use(user);

  // Cleanup: delete user after test (runs even on failure)
  await api.deleteUser(user.id);
  await api.dispose();
},
```

> [!tip] Guaranteed cleanup
> Code after `await use()` always runs — even if the test fails or times out. This prevents test data from piling up in your environment.

In the test:

```typescript
test('created user appears in admin view', async ({ adminPage, testUser }) => {
  // testUser was created via API, no UI interaction needed
  await adminPage.navigate();
  await adminPage.searchUsers(testUser.username);
  await adminPage.expectUserVisible(testUser.username);
});
```

## Custom auth headers

If your API requires authentication, override `getContext()` or pass headers:

```typescript
export class AdminAPI extends BaseAPI {
  protected async getContext() {
    if (!this.context) {
      this.context = await request.newContext({
        baseURL: EnvConfig.baseUrl,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
      });
    }
    return this.context;
  }
}
```

> [!tip] Always call `dispose()`
> API contexts hold connections open. Forgetting `dispose()` can cause resource leaks, especially in global setup or long fixture chains.

## When to use API helpers vs. UI

| Scenario | Use |
|----------|-----|
| Creating test preconditions (seed data) | API |
| Cleaning up after tests | API |
| The test **is about** the UI flow | UI (Page Objects) |
| Authenticating test users (global setup) | UI (for cookie/state capture) or API |

