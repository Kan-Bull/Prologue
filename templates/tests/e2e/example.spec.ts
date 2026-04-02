import { test } from "../../src/fixtures";

/**
 * Starter test file — rename and adapt to your first page.
 *
 * Tests should read like specifications:
 * - No selectors or implementation details
 * - Use page object actions and assertions
 * - One behavior per test
 *
 * See docs/15-writing-your-first-test.md for the full guide.
 */
test.describe("Example page @smoke", () => {
  test.beforeEach(async ({ examplePage }) => {
    await examplePage.navigate();
  });

  // test("should do something with valid data", async ({ examplePage }) => {
  //   await examplePage.fillForm({ /* your data */ });
  //   await examplePage.submit();
  //   await examplePage.expectSuccess();
  // });

  // test("should show error for invalid data", async ({ examplePage }) => {
  //   await examplePage.fillForm({ /* invalid data */ });
  //   await examplePage.submit();
  //   await examplePage.expectError("Expected error message");
  // });
});
