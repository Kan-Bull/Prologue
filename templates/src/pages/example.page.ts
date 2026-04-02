import { expect } from "@playwright/test";
import { BasePage } from "../core/base.page";
import type { ExampleData } from "../data/types/example";

/**
 * Starter Page Object — rename and adapt to your first page.
 *
 * 1. Set `path` to your page's URL path
 * 2. Set `pageTitle` to match the document title
 * 3. Add private locators for every interactive element
 * 4. Write action methods that combine locator interactions
 * 5. Write assertion methods that verify expected outcomes
 *
 * See docs/03-page-objects.md for the full guide.
 */
export class ExamplePage extends BasePage {
  readonly path = "/replace-with-your-path";
  readonly pageTitle = /Replace With Your Page Title/;

  // ── Locators (private — never exposed to tests) ──

  // private readonly usernameInput = this.page.getByTestId("username");
  // private readonly passwordInput = this.page.getByTestId("password");
  // private readonly submitButton = this.page.getByRole("button", { name: "Submit" });
  // private readonly errorMessage = this.page.getByRole("alert");

  // ── Actions ──

  // async fillForm(data: ExampleData): Promise<void> {
  //   this.log.step("Filling form");
  //   await this.fill(this.usernameInput, data.username, "username");
  //   await this.fill(this.passwordInput, data.password, "password");
  // }

  // async submit(): Promise<void> {
  //   this.log.step("Submitting form");
  //   await this.click(this.submitButton, "Submit button");
  // }

  // ── Assertions ──

  // async expectSuccess(): Promise<void> {
  //   this.log.step("Verifying success");
  //   await expect(this.page).toHaveURL(/expected-url/);
  //   this.log.success("Navigation successful");
  // }

  // async expectError(message: string): Promise<void> {
  //   this.log.step("Verifying error message");
  //   await expect(this.errorMessage).toContainText(message);
  //   this.log.success("Error message visible");
  // }
}
