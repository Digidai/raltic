import { expect, test } from "@playwright/test";

const AUTH_RESET_ROUTE = "**/api/auth/reset-password";
const AUTH_REQUEST_RESET_ROUTE = "**/api/auth/request-password-reset";

test.describe("auth password flows", () => {
  test("forgot password requests a same-origin reset link without exposing account existence", async ({ page }) => {
    const requestBodies: unknown[] = [];
    await page.route(AUTH_REQUEST_RESET_ROUTE, async (route) => {
      requestBodies.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: true,
          message: "If this email exists in our system, check your email for the reset link",
        }),
      });
    });

    await page.goto("/forgot-password");
    const origin = new URL(page.url()).origin;

    await page.getByLabel("Email").fill("gene@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect.poll(() => requestBodies.length).toBe(1);
    expect(requestBodies[0]).toMatchObject({
      email: "gene@example.com",
      redirectTo: `${origin}/reset-password`,
    });
    await expect(page.getByText("If that email is registered, a reset link is on its way.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Resend in \d+s/ })).toBeDisabled();
  });

  test("forgot password can prefill the signed-in account email from settings", async ({ page }) => {
    const requestBodies: unknown[] = [];
    await page.route(AUTH_REQUEST_RESET_ROUTE, async (route) => {
      requestBodies.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: true }),
      });
    });

    await page.goto("/forgot-password?email=dai%40live.cn");
    const origin = new URL(page.url()).origin;

    await expect(page.getByLabel("Email")).toHaveValue("dai@live.cn");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect.poll(() => requestBodies.length).toBe(1);
    expect(requestBodies[0]).toMatchObject({
      email: "dai@live.cn",
      redirectTo: `${origin}/reset-password`,
    });
    await expect(page.getByText("If that email is registered, a reset link is on its way.")).toBeVisible();
  });

  test("reset password validates locally before posting and redirects on success", async ({ page }) => {
    const resetBodies: unknown[] = [];
    await page.route(AUTH_RESET_ROUTE, async (route) => {
      resetBodies.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: true }),
      });
    });

    await page.goto("/reset-password?token=reset-token");

    await page.getByLabel("New password", { exact: true }).fill("short");
    await page.getByLabel("Confirm new password").fill("short");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
    expect(resetBodies, "short password should not call reset endpoint").toEqual([]);

    await page.getByLabel("New password", { exact: true }).fill("new-password-123");
    await page.getByLabel("Confirm new password").fill("new-password-321");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
    expect(resetBodies, "mismatched confirmation should not call reset endpoint").toEqual([]);

    await page.getByLabel("Confirm new password").fill("new-password-123");
    await page.getByRole("button", { name: "Update password" }).click();

    await expect.poll(() => resetBodies.length).toBe(1);
    expect(resetBodies[0]).toMatchObject({
      newPassword: "new-password-123",
      token: "reset-token",
    });
    await expect(page).toHaveURL(/\/login\?reset=ok$/);
  });

  test("reset password surfaces invalid callback links before submit", async ({ page }) => {
    await page.goto("/reset-password?error=INVALID_TOKEN");

    await expect(page.getByText("This reset link is invalid or expired.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new reset email" })).toHaveAttribute("href", "/forgot-password");
    await expect(page.getByRole("button", { name: "Update password" })).toBeDisabled();
  });
});
