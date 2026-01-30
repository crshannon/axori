/**
 * Kanban Board E2E Tests
 *
 * Tests for the Forge Kanban board and ticket management functionality.
 */

import { expect, test } from "@playwright/test";

test.describe("Kanban Board", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the forge page (kanban board)
    await page.goto("/forge");
  });

  test("displays kanban board with columns", async ({ page }) => {
    // Wait for the board to load
    await expect(page.getByRole("heading", { name: "Board" })).toBeVisible();

    // Check that all status columns are visible
    const columns = [
      "Backlog",
      "Design",
      "Planned",
      "In Progress",
      "In Review",
      "Testing",
      "Done",
    ];

    for (const column of columns) {
      await expect(page.getByRole("heading", { name: column })).toBeVisible();
    }
  });

  test("displays ticket count", async ({ page }) => {
    // The board should show ticket count in header
    await expect(page.getByText(/\d+ tickets/)).toBeVisible();
  });

  test("has search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search tickets...");
    await expect(searchInput).toBeVisible();

    // Type in search and verify it works
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
  });

  test("has New Ticket button", async ({ page }) => {
    const newTicketButton = page.getByRole("button", { name: /New Ticket/i });
    await expect(newTicketButton).toBeVisible();
  });
});

test.describe("Ticket Drawer - Create Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forge");
  });

  test("opens drawer when clicking New Ticket button", async ({ page }) => {
    // Click the New Ticket button
    await page.getByRole("button", { name: /New Ticket/i }).click();

    // Drawer should open with "New Ticket" title
    await expect(
      page.getByRole("heading", { name: "New Ticket" })
    ).toBeVisible();

    // Should show required fields
    await expect(page.getByText("Title")).toBeVisible();
    await expect(page.getByPlaceholder("What needs to be done?")).toBeVisible();
  });

  test("can fill out ticket form", async ({ page }) => {
    // Open the drawer
    await page.getByRole("button", { name: /New Ticket/i }).click();

    // Fill in the title
    await page
      .getByPlaceholder("What needs to be done?")
      .fill("Test ticket title");

    // Fill in description
    await page
      .getByPlaceholder(/Add more details/i)
      .fill("This is a test description");

    // Select type (feature is default, try changing to bug)
    await page.locator("select").first().selectOption("bug");

    // Select priority
    await page.locator("select").nth(1).selectOption("high");

    // Fill in estimate
    await page.getByPlaceholder("e.g., 3").fill("5");

    // Verify the form has the values
    await expect(page.getByPlaceholder("What needs to be done?")).toHaveValue(
      "Test ticket title"
    );
  });

  test("closes drawer when clicking Cancel", async ({ page }) => {
    // Open the drawer
    await page.getByRole("button", { name: /New Ticket/i }).click();
    await expect(
      page.getByRole("heading", { name: "New Ticket" })
    ).toBeVisible();

    // Click Cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Drawer should be closed
    await expect(
      page.getByRole("heading", { name: "New Ticket" })
    ).not.toBeVisible();
  });

  test("Create Ticket button is disabled without title", async ({ page }) => {
    // Open the drawer
    await page.getByRole("button", { name: /New Ticket/i }).click();

    // Create button should be disabled initially
    const createButton = page.getByRole("button", { name: "Create Ticket" });
    await expect(createButton).toBeDisabled();

    // Fill in title
    await page.getByPlaceholder("What needs to be done?").fill("Test title");

    // Button should now be enabled
    await expect(createButton).toBeEnabled();
  });
});

test.describe("Ticket Drawer - Labels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forge");
    // Open the drawer
    await page.getByRole("button", { name: /New Ticket/i }).click();
  });

  test("can add labels", async ({ page }) => {
    // Find the label input
    const labelInput = page.getByPlaceholder("Add a label...");

    // Add a label
    await labelInput.fill("frontend");
    await page.getByRole("button", { name: "Add" }).click();

    // Label should appear as a tag
    await expect(page.getByText("frontend")).toBeVisible();

    // Input should be cleared
    await expect(labelInput).toHaveValue("");
  });

  test("can add label with Enter key", async ({ page }) => {
    const labelInput = page.getByPlaceholder("Add a label...");

    // Add a label using Enter
    await labelInput.fill("backend");
    await labelInput.press("Enter");

    // Label should appear
    await expect(page.getByText("backend")).toBeVisible();
  });

  test("can remove labels", async ({ page }) => {
    const labelInput = page.getByPlaceholder("Add a label...");

    // Add a label
    await labelInput.fill("test-label");
    await labelInput.press("Enter");

    // Verify label is shown
    await expect(page.getByText("test-label")).toBeVisible();

    // Click the X button on the label to remove it
    // The X is inside the label span
    await page
      .locator("span")
      .filter({ hasText: "test-label" })
      .getByRole("button")
      .click();

    // Label should be removed
    await expect(page.getByText("test-label")).not.toBeVisible();
  });
});

test.describe("Ticket Cards", () => {
  test("clicking a ticket card opens edit drawer", async ({ page }) => {
    await page.goto("/forge");

    // Wait for tickets to load (look for ticket cards)
    const ticketCard = page.locator(".ticket-card").first();

    // If there are tickets, click one
    if ((await ticketCard.count()) > 0) {
      // Get the ticket identifier before clicking
      const identifier = await ticketCard
        .locator(".font-mono")
        .first()
        .textContent();

      await ticketCard.click();

      // Drawer should open with the ticket identifier as title
      if (identifier) {
        await expect(
          page.getByRole("heading", { name: identifier })
        ).toBeVisible();
      }

      // Should show Status field (only in edit mode)
      await expect(page.getByText("Status")).toBeVisible();

      // Should show Agent Assignment section
      await expect(page.getByText("Agent Assignment")).toBeVisible();
    }
  });
});

test.describe("Drag and Drop", () => {
  test("ticket cards are draggable", async ({ page }) => {
    await page.goto("/forge");

    // Wait for tickets to load
    const ticketCard = page.locator(".ticket-card").first();

    if ((await ticketCard.count()) > 0) {
      // Verify the card has cursor-grab class (indicating it's draggable)
      await expect(ticketCard).toHaveClass(/cursor-grab/);
    }
  });
});
