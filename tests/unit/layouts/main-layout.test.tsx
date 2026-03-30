import type { ReactElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
  useParams,
} from "react-router";
import MainLayout from "../../../app/layouts/MainLayout";
import {
  clearCpqWorkspaceFromStorage,
  seedCpqWorkspaceInStorage,
} from "../../../app/utils/cpq-storage";

function StepRouteBody(): ReactElement {
  const params = useParams();

  return <div>{params.stepId} body</div>;
}

function createLayoutRouter(
  initialEntries: string[],
): ReturnType<typeof createMemoryRouter> {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <div>Root body</div> },
          { path: "workflow/:stepId", element: <StepRouteBody /> },
        ],
      },
    ],
    { initialEntries },
  );
}

function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
}

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

  it("renders the neutral shell navigation and workflow rail", async () => {
    const router = createLayoutRouter(["/workflow/step-1"]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("CW")).toBeInTheDocument();
    expect(screen.getByText("Workflow")).toBeInTheDocument();
    expect(screen.getByText("0 of 2 steps")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Pre-Configuration/i }),
    ).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Primary Details" }),
    ).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "View as Role" })).toHaveClass(
      "ring-1",
    );
    expect(screen.getByText("step-1 body")).toBeInTheDocument();
  });

  it("navigates to another workflow step from the rail", async () => {
    const user = userEvent.setup();
    const router = createLayoutRouter(["/workflow/step-1"]);
    render(<RouterProvider router={router} />);

    await user.click(screen.getByRole("button", { name: "Reference Details" }));

    expect(await screen.findByText("step-2 body")).toBeInTheDocument();
  });

  it("toggles the desktop workflow sidebar", async () => {
    const user = userEvent.setup();
    const router = createLayoutRouter(["/workflow/step-1"]);
    render(<RouterProvider router={router} />);

    const sidebarRoot = document.querySelector(
      '[data-side="left"][data-slot="sidebar"]',
    );

    expect(sidebarRoot).toHaveAttribute("data-state", "expanded");

    await user.click(
      screen.getByRole("button", { name: "Toggle workflow sidebar" }),
    );

    expect(sidebarRoot).toHaveAttribute("data-state", "collapsed");
  });

  it("opens the workspace user dropdown and keeps role preview in memory", async () => {
    const user = userEvent.setup();
    const router = createLayoutRouter(["/workflow/step-1"]);
    render(<RouterProvider router={router} />);

    await user.click(screen.getByRole("button", { name: "User menu" }));

    expect(await screen.findByText("Workspace User", { exact: true })).toBeVisible();
    expect(screen.getByText("Workspace controls for the shell.")).toBeVisible();
    expect(document.querySelector('[data-slot="popover-content"]')).toHaveClass(
      "shadow-lg",
    );

    await user.keyboard("{Escape}");

    expect(
      screen.queryByText("Workspace User", { exact: true }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View as Role" }));
    await user.click(screen.getByRole("combobox"));
    expect(document.querySelector('[data-slot="select-content"]')).toHaveClass(
      "shadow-lg",
    );
    await user.click(await screen.findByRole("option", { name: "Viewer" }));

    expect(await screen.findByText("Active role:")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(readStoredRole()).toBe("admin");
  });
});
