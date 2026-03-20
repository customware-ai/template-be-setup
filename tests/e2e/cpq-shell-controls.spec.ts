import { expect, test } from "@playwright/test";
import { seedWorkspace } from "./support/cpq";

test.describe("workflow starter shell e2e", () => {
  test("hides and restores the desktop workflow sidebar while keeping section toggles local", async ({
    page,
  }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedWorkspace(page);
    await page.reload();

    await expect(page.getByText("Customware CPQ", { exact: true })).toHaveCount(0);
    const logoMark = page.locator("header").getByText("CW", { exact: true }).first();

    await expect(logoMark).toBeVisible();
    await expect(page.getByRole("link", { name: "Workspace" }).first()).toBeVisible();
    await expect(page.locator('[aria-label="Workflow"]').first()).toBeVisible();
    await expect(page.getByText("0 of 4 steps")).toBeVisible();

    const logoStyles = await logoMark.evaluate((node) => {
      const mark =
        node instanceof HTMLElement ? node : node.parentElement instanceof HTMLElement ? node.parentElement : null;

      if (!mark) {
        return null;
      }

      const styles = getComputedStyle(mark);

      return {
        borderTopWidth: styles.borderTopWidth,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        borderRadius: styles.borderRadius,
      };
    });

    expect(logoStyles).toEqual({
      borderTopWidth: "0px",
      paddingLeft: "10px",
      paddingRight: "10px",
      paddingTop: "8px",
      paddingBottom: "8px",
      borderRadius: "12px",
    });

    const sectionToggle = page
      .getByRole("button", { name: /Pre-Configuration/i })
      .first();
    const sectionContent = page.locator(
      `#${await sectionToggle.getAttribute("aria-controls")}`,
    );
    const railStepLabel = page
      .locator('[aria-label="Workflow"]')
      .first()
      .getByText("Customer & Collection");
    const sidebarGap = page.locator('[data-slot="sidebar-gap"]').first();
    const sidebarContainer = page.locator('[data-slot="sidebar-container"]').first();

    await expect(sectionToggle).toHaveAttribute("aria-expanded", "true");
    await expect(railStepLabel).toBeVisible();
    await expect(sidebarGap).toHaveCSS("width", "256px");
    await expect(sidebarContainer).toHaveCSS("left", "0px");

    await sectionToggle.click();

    await expect(sectionToggle).toHaveAttribute("aria-expanded", "false");
    await expect(sectionContent).toBeHidden();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();

    await expect(sidebarGap).toHaveCSS("width", "0px");
    await expect(sidebarContainer).toHaveCSS("left", "-256px");
    await expect(
      page.getByRole("heading", { name: "Customer and collection context" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();

    await expect(sidebarGap).toHaveCSS("width", "256px");
    await expect(sidebarContainer).toHaveCSS("left", "0px");
  });

  test("renders dark mode with neutral shell colors on desktop and mobile", async ({
    page,
  }) => {
    const readShellColors = async (): Promise<{
      isDark: boolean;
      shellBackground: string | null;
      headerBackground: string;
      cardBackground: string | null;
    }> =>
      page.evaluate(() => {
        const shell = document.querySelector(".min-h-screen.bg-background");
        const header = document.querySelector("header");
        const card = document.querySelector("main section");

        return {
          isDark: document.documentElement.classList.contains("dark"),
          shellBackground: shell ? getComputedStyle(shell).backgroundColor : null,
          headerBackground: header
            ? getComputedStyle(header).backgroundColor
            : "",
          cardBackground: card ? getComputedStyle(card).backgroundColor : null,
        };
      });

    await page.goto("/");
    await seedWorkspace(page);
    await page.reload();

    await page.getByRole("button", { name: "Theme utility" }).click();

    await expect(page.locator("html")).toHaveClass(/dark/);

    const desktopColors = await readShellColors();

    expect(desktopColors).toEqual({
      isDark: true,
      shellBackground: "rgb(24, 24, 27)",
      headerBackground: "rgb(34, 34, 37)",
      cardBackground: "rgb(34, 34, 37)",
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();
    await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();

    const mobileColors = await readShellColors();

    expect(mobileColors.shellBackground).toBe("rgb(24, 24, 27)");
    expect(mobileColors.headerBackground).toBe("rgb(34, 34, 37)");
  });

  test("keeps the starter page read-only during temporary role preview", async ({
    page,
  }) => {
    await page.goto("/");
    await seedWorkspace(page);
    await page.reload();

    const ownerInput = page.getByRole("textbox", { name: "Customer" });
    const notesInput = page.getByRole("textbox", { name: "Confirmation Notes" });

    await expect(ownerInput).toBeEnabled();
    await expect(notesInput).toBeEnabled();

    await page.getByRole("button", { name: "View as Role" }).click();
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Viewer" }).click();

    await expect(page.getByText("Active role: viewer")).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(
      page.getByText("viewer role can review this starter quote", { exact: false }),
    ).toBeVisible();
    await expect(ownerInput).toBeDisabled();
    await expect(notesInput).toBeDisabled();

    await page.reload();

    await expect(
      page.getByText("viewer role can review this starter quote", {
        exact: false,
      }),
    ).toHaveCount(0);
    await expect(ownerInput).toBeEnabled();
    await expect(notesInput).toBeEnabled();
  });

  test("keeps the mobile workflow drawer open while toggling a section", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await seedWorkspace(page);
    await page.reload();

    await expect(page.getByRole("link", { name: "Workspace" })).toBeVisible();
    await page.getByRole("button", { name: "Toggle workflow sidebar" }).click();

    const sidebarDialog = page.getByRole("dialog", { name: "Sidebar" });

    await expect(sidebarDialog).toBeVisible();

    const sectionToggle = sidebarDialog.getByRole("button", {
      name: /Pre-Configuration/i,
    });
    const sectionContent = sidebarDialog.locator(
      `#${await sectionToggle.getAttribute("aria-controls")}`,
    );

    await sectionToggle.click();

    await expect(sectionToggle).toHaveAttribute("aria-expanded", "false");
    await expect(sectionContent).toBeHidden();
    await expect(sidebarDialog).toBeVisible();
  });
});
