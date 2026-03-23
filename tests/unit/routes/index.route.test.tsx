import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import IndexPage from "../../../app/routes/index";
import WorkflowStepPage from "../../../app/routes/workflow.$stepId";
import {
  clearCpqWorkspaceFromStorage,
  seedCpqWorkspaceInStorage,
} from "../../../app/utils/cpq-storage";

/**
 * Builds the route tree needed to exercise the redirecting index route and the
 * route-backed workflow step engine.
 */
function createWorkflowRouter(
  initialEntries: string[],
): ReturnType<typeof createMemoryRouter> {
  return createMemoryRouter(
    [
      { path: "/", element: <IndexPage /> },
      { path: "/workflow/:stepId", element: <WorkflowStepPage /> },
    ],
    { initialEntries },
  );
}

describe("starter workflow routes", () => {
  beforeEach(() => {
    clearCpqWorkspaceFromStorage();
    seedCpqWorkspaceInStorage();
  });

  it("redirects the root route to the active workflow step page", async () => {
    const router = createWorkflowRouter(["/"]);
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Customer & Collection" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/workflow/customer-collection");
  });

  it("progresses through the route-backed starter workflow and completes it", async () => {
    const router = createWorkflowRouter(["/workflow/customer-collection"]);
    render(<RouterProvider router={router} />);

    await userEvent.type(
      await screen.findByRole("textbox", { name: "Customer" }),
      "BarkBilt",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Collection" }),
      "Industrial Hoists",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to Quote Identity" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Quote Identity" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("workflow-step-footer")).toHaveClass(
      "xl:grid",
      "xl:grid-cols-[minmax(0,1fr)_auto]",
    );
    expect(screen.getByTestId("workflow-step-footer-actions")).toHaveClass(
      "2xl:min-w-[320px]",
    );
    expect(screen.getByTestId("workflow-step-footer-actions")).toHaveClass(
      "xl:justify-center",
      "xl:min-w-[280px]",
    );
    expect(
      screen.getByRole("button", { name: "Continue to Starter Scope" }),
    ).toHaveClass("w-full", "sm:w-auto", "xl:min-w-[240px]", "2xl:min-w-[256px]");
    const pageGrid = screen.getByRole("heading", { name: "Quote Identity" }).closest("div.space-y-5");

    expect(pageGrid?.querySelector(".grid.gap-5")).toHaveClass(
      "items-start",
      "xl:grid-cols-[minmax(0,1fr)_320px]",
      "2xl:grid-cols-[minmax(0,1fr)_360px]",
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: "Quote Year" }),
      "2026",
    );
    await userEvent.type(screen.getByRole("textbox", { name: "Sequence" }), "014");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Item Name" }),
      "Under Running Crane",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continue to Starter Scope" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Starter Scope" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Load package" }));
    expect(screen.getAllByText("BarkBilt").length).toBeGreaterThan(0);
    expect(screen.getByText("EST-2026-014")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Complete workflow" }));

    expect(await screen.findByText("Starter workflow complete.")).toBeInTheDocument();
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/workflow/starter-scope");
  });
});
