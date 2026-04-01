# Othello — Documentation

> [!tip] The Golden Rule
> **Tests never contain selectors.** They read like specifications.
>
> ```typescript
> // Good : reads like a spec
> test('user can submit a contact form', async ({ contactPage }) => {
>   await contactPage.navigate();
>   await contactPage.fillContactForm(ContactBuilder.create().build());
>   await contactPage.submitForm();
>   await contactPage.expectSuccessMessage();
> });
>
> // Bad : implementation details leaked into the test
> test('user can submit a contact form', async ({ page }) => {
>   await page.fill('#first_name', 'John');
>   await page.fill('#last_name', 'Doe');
>   await page.fill('#email', 'john@example.com');
>   await page.click('.btnSubmit');
> });
> ```
>
> If you see a `page.click()` or a `data-testid` in a test file, something went wrong.

## Guides

| # | Guide | What you'll learn |
|---|-------|-------------------|
| 01 | getting-started | Run your first test, available scripts, project structure, targeting environments |
| 02 | architecture| The 7-layer architecture, dependency rules, where things go |
| 03 | page-objects | Create a Page Object from scratch in 6 steps |
| 04 | components| Build reusable UI components shared across pages |
| 05 | fixtures | How Playwright fixtures inject Page Objects into tests |
| 06 | data-builders | Fluent builder pattern for type-safe test data |
| 07 | api-helpers| Skip the UI for test setup/teardown with API clients |
| 08 | visual-regression| Screenshot comparison, masking, baseline management |
| 09 | configuration | Environments, test users, Playwright projects, auth caching |
| 10 | custom-matchers | Domain-specific assertions with `expect.extend` |
| 11 | ci-cd| GitHub Actions workflow, secrets, artifacts, reports |
| 12 | best-practices | Golden rules, tagging, naming conventions, common mistakes |
| 13 | logger | Structured logger: levels, customization, adding your own levels |
| 14 | scanner | Page scanner: analyze a live page and generate a Page Object automatically |
| 15 | writing-your-first-test | End-to-end walkthrough: from DevTools to a running test in 5 steps |


