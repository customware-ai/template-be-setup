import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import MainLayout from "../../../app/layouts/MainLayout";
import { clearCpqWorkspaceFromStorage, seedCpqWorkspaceInStorage } from "../../../app/utils/cpq-storage";

/**
 * Builds a memory router around the shared CPQ layout.
 */
function createLayoutRouter(initialEntries: string[]): ReturnType<typeof createMemoryRouter> {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <div>Dashboard body</div> },
          { path: "estimates/:estimateId", element: <div>Estimate body</div> },
          { path: "configure/:estimateId", element: <div>Configure body</div> },
        ],
      },
    ],
    { initialEntries },
  );
}

/**
 * Updates the mocked viewport width so the shadcn sidebar can switch between its
 * desktop off-canvas behavior and mobile sheet behavior inside jsdom.
 */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
}

/**
 * Radix Select expects pointer-capture APIs that jsdom does not implement.
 */
function installPointerCaptureStubs(): void {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: {
      configurable: true,
      value: (): boolean => false,
    },
    releasePointerCapture: {
      configurable: true,
      value: (): void => undefined,
    },
    setPointerCapture: {
      configurable: true,
      value: (): void => undefined,
    },
    scrollIntoView: {
      configurable: true,
      value: (): void => undefined,
    },
  });
}

/**
 * Reads the persisted role from the seeded workspace payload.
 */
function readStoredRole(): string | null {
  const workspace = window.localStorage.getItem("cohesiv_cpq_workspace");

  if (!workspace) {
    return null;
  }

  return JSON.parse(workspace).ui.active_role as string;
}

describe("main layout", () => {
  beforeEach(() => {
    setViewportWidth(1280);
    installPointerCaptureStubs();
    clearCpqWorkspaceFromStorage();
    seedCpqWorkspaceInStorage();
  });

  it("renders the CPQ shell navigation and workflow rail", async () => {
    const router = createLayoutRouter(["/"]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Customware CPQ")).toBeInTheDocument();
    expect(screen.getByText("Workflow")).toBeInTheDocument();
    expect(screen.getByText("0 of 15 steps")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Lead Capture")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lead Created" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getAllByRole("link", { name: "Dashboard" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Estimates" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Configure" })).toHaveLength(2);
    expect(screen.getByText("Dashboard body")).toBeInTheDocument();
  });

  it("navigates to the configure route from the workflow rail", async () => {
    const router = createLayoutRouter(["/"]);
    render(<RouterProvider router={router} />);

    await userEvent.click(screen.getByRole("button", { name: "Equipment Selected" }));

    expect(await screen.findByText("Configure body")).toBeInTheDocument();
  });

  it("collapses and restores the desktop workflow sidebar", async () => {
    const router = createLayoutRouter(["/"]);
    render(<RouterProvider router={router} />);

    const sidebarRoot = document.querySelector(
      '[data-side="left"][data-slot="sidebar"]',
    );

    expect(sidebarRoot).toHaveAttribute("data-state", "expanded");

    await userEvent.click(
      screen.getByRole("button", { name: "Toggle workflow sidebar" }),
    );

    expect(sidebarRoot).toHaveAttribute("data-state", "collapsed");

    await userEvent.click(
      screen.getByRole("button", { name: "Toggle workflow sidebar" }),
    );

    expect(sidebarRoot).toHaveAttribute("data-state", "expanded");
  });

  it("closes the mobile workflow sheet after selecting a workflow step", async () => {
    setViewportWidth(390);
    const router = createLayoutRouter(["/"]);
    render(<RouterProvider router={router} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Toggle workflow sidebar" }),
    );

    expect(await screen.findByRole("dialog", { name: "Sidebar" })).toBeInTheDocument();

    const workflowButtons = screen.getAllByRole("button", {
      name: "Equipment Selected",
    });
    const mobileWorkflowButton = workflowButtons[workflowButtons.length - 1];

    await userEvent.click(mobileWorkflowButton!);

    expect(await screen.findByText("Configure body")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Sidebar" })).not.toBeInTheDocument();
  });

  it("toggles the persisted theme mode from the header control", async () => {
    const router = createLayoutRouter(["/"]);
    render(<RouterProvider router={router} />);

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Theme utility" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("keeps role preview in memory instead of persisting it", async () => {
    const router = createLayoutRouter(["/"]);
    render(<RouterProvider router={router} />);

    expect(readStoredRole()).toBe("admin");

    await userEvent.click(screen.getByRole("button", { name: "View as Role" }));
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Viewer" }));

    expect(await screen.findByText("Active role:")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(readStoredRole()).toBe("admin");
  });
});
