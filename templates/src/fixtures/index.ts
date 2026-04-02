import { test as base } from "@playwright/test";
import { ExamplePage } from "../pages/example.page";

/**
 * Custom test fixtures extending Playwright's base test.
 *
 * This is the bridge between your Page Objects and your tests.
 * Each fixture instantiates a Page Object and injects it into
 * the test function — tests never call `new Page()` directly.
 *
 * Adding a new page:
 * 1. Create `src/pages/my-new.page.ts` extending BasePage
 * 2. Add the type to TestFixtures below
 * 3. Add the fixture definition in `base.extend()`
 */

type TestFixtures = {
  examplePage: ExamplePage;
};

export const test = base.extend<TestFixtures>({
  examplePage: async ({ page }, use) => {
    await use(new ExamplePage(page));
  },
});

export { expect } from "../utils/custom-matchers";
