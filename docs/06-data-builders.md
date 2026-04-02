# Data Builders

## The problem

Hardcoded test data is brittle and repetitive:

```typescript
// Bad — duplicated, fragile, hard to maintain
test('can log in as admin', async ({ loginPage }) => {
  const credentials = {
    username: 'admin@example.com',
    password: 'admin123',
  };
  // ...
});

test('can log in as standard user', async ({ loginPage }) => {
  const credentials = {
    username: 'user@example.com',
    password: 'user456',
  };
  // ...
});
```

When the `LoginCredentials` type changes (new required field, renamed property), every test breaks.

## The solution: Builders

Builders centralize defaults and expose a fluent API for overrides:

```typescript
const user = UserBuilder.create()
  .withUsername('admin@test.com')
  .withRole('admin')
  .build();
```

Defaults handle everything you don't care about. You only specify what matters for the test.

## Creating a builder — step by step

### 1. Define the type

In `src/data/types/index.ts`:

```typescript
export interface Product {
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}
```

### 2. Create the builder class

In `src/data/builders/product.builder.ts`:

```typescript
import type { Product } from '../types';
import { Builder } from './base.builder';

export class ProductBuilder extends Builder<Product> {
  private constructor() {
    super({
      name: 'Test Product',
      price: 29.99,
      category: 'general',
      inStock: true,
    });
  }

  static create(): ProductBuilder {
    return new ProductBuilder();
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withPrice(price: number): this {
    this.data.price = price;
    return this;
  }

  withCategory(category: string): this {
    this.data.category = category;
    return this;
  }

  outOfStock(): this {
    this.data.inStock = false;
    return this;
  }
}
```

Key points:
- Constructor is `private` — use `static create()` to instantiate
- `super()` receives sensible defaults for every field
- Each `with*` method returns `this` for chaining
- `build()` is inherited from `Builder<T>` — returns a plain object

### 3. Use in tests

```typescript
// Only override what matters for this specific test
const expensiveProduct = ProductBuilder.create()
  .withPrice(999.99)
  .withCategory('premium')
  .build();

const cheapProduct = ProductBuilder.create()
  .withPrice(1.00)
  .build();

const unavailable = ProductBuilder.create()
  .outOfStock()
  .build();
```

## `buildMany()` for arrays

Generate multiple items with per-item overrides:

```typescript
// 5 products with unique names
const products = ProductBuilder.create().buildMany(5, (i) => ({
  name: `Product ${i + 1}`,
  price: 10 * (i + 1),
}));

// Result:
// [
//   { name: 'Product 1', price: 10, category: 'general', inStock: true },
//   { name: 'Product 2', price: 20, category: 'general', inStock: true },
//   ...
// ]
```

> [!tip] The override function receives the index
> Use it for unique values: emails, names, sequential IDs.

## Faker.js integration

Builders use [Faker.js](https://fakerjs.dev/) to generate realistic test data by default. This means every call to `UserBuilder.create().build()` produces unique, realistic values — no more `test@example.com` everywhere:

```typescript
const user = UserBuilder.create().build();
// { username: 'alexis.mertz@yahoo.com', password: 'xK9#mP2$vL',
//   displayName: 'Alexis Mertz', role: 'user' }
```

Override only the fields that matter for your test, and let Faker handle the rest.

## What Builder\<T\> gives you

The base class (`src/data/builders/base.builder.ts`) provides:

| Method | Purpose |
|--------|---------|
| `build()` | Returns the constructed object with defaults + overrides |
| `buildMany(count, overrideFn?)` | Returns an array of `count` objects with optional per-item overrides |

Your subclass adds the `with*` methods and the `static create()` factory.

