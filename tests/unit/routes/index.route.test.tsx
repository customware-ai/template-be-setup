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

describe("workflow routes", () => {
  beforeEach(() => {
    clearCpqWorkspaceFromStorage();
    seedCpqWorkspaceInStorage();
  });

  it("redirects the root route to the first workflow step page", async () => {
    const router = createWorkflowRouter(["/"]);
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Primary Details" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/workflow/step-1");
  });

  it("advances through the neutral two-step workflow", async () => {
    const user = userEvent.setup();
    const router = createWorkflowRouter(["/workflow/step-1"]);
    render(<RouterProvider router={router} />);

    await user.type(
      await screen.findByRole("textbox", { name: "Primary label" }),
      "Workspace",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Secondary label" }),
      "Context",
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to Reference Details" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Reference Details" }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Reference year" }),
      "2026",
    );
    await user.type(screen.getByRole("textbox", { name: "Sequence" }), "014");
    await user.type(
      screen.getByRole("textbox", { name: "Item label" }),
      "Configured Item",
    );
    await user.click(screen.getByRole("button", { name: "Complete workflow" }));

    expect(await screen.findByText("Workflow complete.")).toBeInTheDocument();
    expect(screen.getByText("$28,500.00")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/workflow/step-2");
  });

  it("keeps the rounded workflow card treatment from the original shell", async () => {
    const router = createWorkflowRouter(["/workflow/step-1"]);
    render(<RouterProvider router={router} />);

    await screen.findByRole("heading", { name: "Primary Details" });

    expect(screen.getByTestId("workflow-primary-card")).toHaveClass("rounded-xl");
    expect(screen.getByTestId("workflow-primary-card")).toHaveClass("border-0");
    expect(screen.getByTestId("workflow-primary-card")).toHaveClass("ring-1");
    expect(screen.getByTestId("workflow-primary-card")).toHaveClass("shadow-xs");
    expect(screen.getByTestId("workflow-summary-card")).toHaveClass("rounded-xl");
    expect(screen.getByTestId("workflow-summary-card")).toHaveClass("border-0");
    expect(screen.getByTestId("workflow-summary-card")).toHaveClass("ring-1");
    expect(screen.getByTestId("workflow-summary-card")).toHaveClass("shadow-xs");
    expect(screen.getByTestId("workflow-status-card")).toHaveClass("rounded-xl");
    expect(screen.getByTestId("workflow-status-card")).toHaveClass("border-0");
    expect(screen.getByTestId("workflow-status-card")).toHaveClass("ring-1");
    expect(screen.getByTestId("workflow-status-card")).toHaveClass("shadow-xs");
  });
});
