# Writing your first test — from A to Z

This guide walks you through creating a complete test for a real page, step by step. We'll use the Contact form on [practicesoftwaretesting.com/contact](https://practicesoftwaretesting.com/contact) as our example.

By the end, you'll have:
- A typed data model
- A Page Object with locators, actions, and assertions
- A registered fixture
- Working tests (with optional Faker.js support)

---

## Step 0 — Map the page elements

Before writing code, open DevTools and identify every element you'll interact with. For the Contact form:

| Element | Best locator | Notes |
|---------|-------------|-------|
| First name input | `data-test="first-name"` | Text field |
| Last name input | `data-test="last-name"` | Text field |
| Email input | `data-test="email"` | Email field |
| Subject dropdown | `data-test="subject"` | Select with fixed options |
| Message textarea | `data-test="message"` | Textarea |
| Submit button | `data-test="contact-submit"` | Button |
| Success alert | `role="alert"` | Appears after submit |
| Validation errors | `data-test="*-error"` | One per required field |

> **Tip:** You can use `npx othello scan https://practicesoftwaretesting.com/contact` to automate this step. The scanner finds all interactive elements and picks the best locator strategy for each one.

---

## Step 1 — Define the data type

Create the interface that represents the form data in `src/data/types/index.ts`:

```typescript
export type ContactSubject =
  | "customer-service"
  | "webmaster"
  | "return"
  | "payments"
  | "warranty"
  | "status-of-order";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: ContactSubject;
  message: string;
}
```

This gives you type safety everywhere — the compiler will catch typos in subject values, missing fields, and wrong types.

---

## Step 2 — Create the Page Object

Create `src/pages/contact.page.ts`:

```typescript
import { expect } from "@playwright/test";
import { BasePage } from "../core/base.page";
import type { ContactFormData } from "../data/types";

export class ContactPage extends BasePage {
  readonly path = "/contact";
  readonly pageTitle = /Contact Us/;

  // ── Locators (private — never exposed to tests) ──

  // Form fields
  private readonly firstNameInput = this.page.getByTestId("first-name");
  private readonly lastNameInput = this.page.getByTestId("last-name");
  private readonly emailInput = this.page.getByTestId("email");
  private readonly subjectSelect = this.page.getByTestId("subject");
  private readonly messageTextarea = this.page.getByTestId("message");
  private readonly submitButton = this.page.getByTestId("contact-submit");
  private readonly successMessage = this.page.getByRole("alert");

  // Validation errors
  private readonly firstNameError = this.page.getByTestId("first-name-error");
  private readonly lastNameError = this.page.getByTestId("last-name-error");
  private readonly emailError = this.page.getByTestId("email-error");
  private readonly messageError = this.page.getByTestId("message-error");

  // ── Actions ──

  async fillContactForm(data: ContactFormData): Promise<void> {
    this.log.step(`Filling contact form for ${data.email}`);
    await this.fill(this.firstNameInput, data.firstName, "first name");
    await this.fill(this.lastNameInput, data.lastName, "last name");
    await this.fill(this.emailInput, data.email, "email");
    await this.selectOption(this.subjectSelect, data.subject, "subject");
    await this.fill(this.messageTextarea, data.message, "message");
  }

  async submitForm(): Promise<void> {
    this.log.step("Submitting contact form");
    await this.click(this.submitButton, "Submit button");
  }

  // ── Assertions ──

  async expectSuccessMessage(): Promise<void> {
    this.log.step("Verifying success message");
    await expect(this.successMessage).toBeVisible();
    this.log.success("Success alert visible");
  }

  async expectValidationErrors(): Promise<void> {
    this.log.step("Verifying validation errors");
    await expect(this.firstNameError).toBeVisible();
    await expect(this.lastNameError).toBeVisible();
    await expect(this.emailError).toBeVisible();
    await expect(this.messageError).toBeVisible();
    this.log.success("All validation errors visible");
  }
}
```

Key principles:
- **Locators are private** — tests never touch selectors directly
- **Actions use `this.log`** — every interaction is traced in the structured logger
- **Assertions live in the Page Object** — tests read like specifications, not implementation details
- **`this.fill()`, `this.click()`, `this.selectOption()`** — inherited from `BasePage`, they handle logging and waiting automatically

---

## Step 3 — Register the fixture

Open `src/fixtures/index.ts` and add `ContactPage`:

```typescript
import { test as base } from "@playwright/test";
import { ContactPage } from "../pages/contact.page";

type TestFixtures = {
  contactPage: ContactPage;
};

export const test = base.extend<TestFixtures>({
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },
});

export { expect } from "../utils/custom-matchers";
```

Now any test can request `contactPage` as a parameter and get a fully initialized instance.

---

## Step 4 — Write the tests

Create `tests/e2e/contact.spec.ts`:

```typescript
import type { ContactFormData } from "../../src/data/types";
import { test } from "../../src/fixtures";

const validContact: ContactFormData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  subject: "customer-service",
  message: "I need help with my account.",
};

test.describe("Contact form @smoke", () => {
  test.beforeEach(async ({ contactPage }) => {
    await contactPage.navigate();
  });

  test("should submit successfully with valid data", async ({ contactPage }) => {
    await contactPage.fillContactForm(validContact);
    await contactPage.submitForm();
    await contactPage.expectSuccessMessage();
  });

  test("should show validation errors for empty form", async ({ contactPage }) => {
    await contactPage.fillContactForm({
      ...validContact,
      email: "not-an-email",
      firstName: "",
      lastName: "",
      message: "",
    });
    await contactPage.submitForm();
    await contactPage.expectValidationErrors();
  });
});
```

Notice how the tests read like plain English:
1. Navigate to the contact page
2. Fill the form
3. Submit
4. Expect success (or validation errors)

No selectors, no `page.click()`, no implementation details.

---

## Step 5 (optional) — Add a data builder with Faker.js

If you installed Faker.js during scaffolding, you can create a builder that generates random but realistic test data.

Create `src/data/builders/contact.builder.ts`:

```typescript
import { faker } from "@faker-js/faker";
import type { ContactFormData, ContactSubject } from "../types";
import { Builder } from "./base.builder";

const SUBJECTS: ContactSubject[] = [
  "customer-service",
  "webmaster",
  "return",
  "payments",
];

export class ContactBuilder extends Builder<ContactFormData> {
  private constructor() {
    super({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      subject: faker.helpers.arrayElement(SUBJECTS),
      message: faker.lorem.sentence({ min: 5, max: 20 }),
    });
  }

  static create(): ContactBuilder {
    return new ContactBuilder();
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withSubject(subject: ContactSubject): this {
    this.data.subject = subject;
    return this;
  }

  withMessage(message: string): this {
    this.data.message = message;
    return this;
  }
}
```

Now add a test that uses random data:

```typescript
import { ContactBuilder } from "../../src/data/builders/contact.builder";

test("should submit successfully with random valid data", async ({ contactPage }) => {
  await contactPage.fillContactForm(ContactBuilder.create().build());
  await contactPage.submitForm();
  await contactPage.expectSuccessMessage();
});
```

Every run produces unique data — different names, emails, and messages. Override only what matters for a specific test:

```typescript
ContactBuilder.create().withSubject("warranty").build();
```

---

## Summary

| Step | File | What you did |
|------|------|-------------|
| 0 | DevTools / scanner | Mapped interactive elements and their best locators |
| 1 | `src/data/types/index.ts` | Defined the `ContactFormData` interface |
| 2 | `src/pages/contact.page.ts` | Created the Page Object with locators, actions, assertions |
| 3 | `src/fixtures/index.ts` | Registered the fixture for dependency injection |
| 4 | `tests/e2e/contact.spec.ts` | Wrote the actual tests |
| 5 | `src/data/builders/contact.builder.ts` | *(optional)* Added a Faker-powered data builder |

This is the pattern for every page you test. The structure stays the same — only the locators, actions, and assertions change.
