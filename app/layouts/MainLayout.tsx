import { useEffect, useState, type ReactElement } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import {
  CircleHelp,
  Menu,
  Moon,
  RotateCcw,
  Sun,
  UserRound,
} from "lucide-react";
import { WorkflowRail } from "../components/cpq/WorkflowRail";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/Sheet";
import { getCurrentWorkflowStep, type UserRole } from "../lib/cpq-data";
import { cn } from "../lib/utils";
import { useCpqWorkspaceStorage } from "../utils/cpq-storage";

interface NavigationItem {
  label: string;
  href: string;
  matches: (pathname: string) => boolean;
}

/**
 * Resolves the create shortcut target from the active workspace.
 */
function getCreateHref(activeEstimateId: string): string {
  return `/configure/${activeEstimateId}`;
}

/**
 * Extracts the estimate id from the route so the shell stays synced with the
 * current workspace context.
 */
function getEstimateIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/(?:estimates|configure)\/([^/?#]+)/);
  return match?.[1] ?? null;
}

/**
 * Shared CPQ application shell.
 */
export default function MainLayout(): ReactElement {
  const location = useLocation();
  const [isWorkflowSheetOpen, setIsWorkflowSheetOpen] = useState(false);
  const {
    workspace,
    resetWorkspace,
    setActiveEstimate,
    setActiveRole,
    setActiveWorkflowStep,
    advanceWorkflow,
    toggleThemeMode,
  } = useCpqWorkspaceStorage();
  const createHref = getCreateHref(workspace.active_estimate_id);
  const currentWorkflowStep = getCurrentWorkflowStep(workspace);
  const navigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/",
      matches: (pathname: string): boolean => pathname === "/",
    },
    {
      label: "Estimates",
      href: `/estimates/${workspace.active_estimate_id}`,
      matches: (pathname: string): boolean => pathname.startsWith("/estimates"),
    },
    {
      label: "Configure",
      href: `/configure/${workspace.active_estimate_id}`,
      matches: (pathname: string): boolean => pathname.startsWith("/configure"),
    },
  ];

  /**
   * The shell owns the document theme because the browser bootstrap script only
   * knows about system preference, not the persisted demo toggle.
   */
  useEffect((): void => {
    document.documentElement.classList.toggle(
      "dark",
      workspace.ui.theme_mode === "dark",
    );
  }, [workspace.ui.theme_mode]);

  /**
   * Syncing the active estimate with the current route keeps header shortcuts and
   * workflow actions pointed at the right record.
   */
  useEffect((): void => {
    const routeEstimateId = getEstimateIdFromPathname(location.pathname);
    if (routeEstimateId && routeEstimateId !== workspace.active_estimate_id) {
      setActiveEstimate(routeEstimateId);
    }
  }, [location.pathname, setActiveEstimate, workspace.active_estimate_id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden w-[252px] shrink-0 lg:block">
          <WorkflowRail
            workspace={workspace}
            onSelectStep={setActiveWorkflowStep}
            onAdvance={advanceWorkflow}
          />
        </div>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-b border-stone-200 bg-card dark:border-zinc-800">
            <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
              <Sheet open={isWorkflowSheetOpen} onOpenChange={setIsWorkflowSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="lg:hidden"
                    aria-label="Open workflow"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
                  <SheetHeader className="sr-only">
                    <SheetTitle>Workflow</SheetTitle>
                    <SheetDescription>
                      Review workflow sections and navigate between mocked CPQ stages.
                    </SheetDescription>
                  </SheetHeader>
                  <WorkflowRail
                    workspace={workspace}
                    className="border-r-0"
                    onSelectStep={setActiveWorkflowStep}
                    onAdvance={advanceWorkflow}
                    onNavigate={() => setIsWorkflowSheetOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              <Link
                to="/"
                className="flex min-w-0 items-center gap-3 text-stone-900 dark:text-zinc-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 bg-stone-100 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-900">
                  CW
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    Customware CPQ
                  </div>
                </div>
              </Link>

              <nav className="ml-4 hidden items-center gap-1 md:flex">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }): string =>
                      cn(
                        "rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                        (isActive || item.matches(location.pathname)) &&
                          "bg-stone-100 text-stone-900 dark:bg-zinc-900 dark:text-zinc-100",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="ml-auto flex items-center gap-2">
                <Button asChild className="hidden md:inline-flex">
                  <Link to={createHref}>Create</Link>
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="hidden sm:inline-flex">
                      <span>View as Role</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Role Preview</SheetTitle>
                      <SheetDescription>
                        Switch the shell into a different CPQ role and preview the
                        permissions that role would get.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 px-4 pb-4">
                      <Select
                        value={workspace.ui.active_role}
                        onChange={(value: string): void =>
                          setActiveRole(value as UserRole)
                        }
                        options={[
                          { label: "Admin", value: "admin" },
                          { label: "Estimator", value: "estimator" },
                          { label: "Approver", value: "approver" },
                          { label: "Viewer", value: "viewer" },
                        ]}
                      />
                      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                        Active role:{" "}
                        <span className="font-semibold capitalize text-stone-900 dark:text-zinc-100">
                          {workspace.ui.active_role}
                        </span>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Theme utility"
                  onClick={toggleThemeMode}
                >
                  {workspace.ui.theme_mode === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Help">
                      <CircleHelp className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Workspace Help</SheetTitle>
                      <SheetDescription>
                        This starter keeps all actions local-first. Every button
                        either changes workspace state, navigates, or mocks a CPQ
                        workflow outcome.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 px-4 pb-4 text-sm text-stone-600 dark:text-zinc-300">
                      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                        Current workflow step:{" "}
                        <span className="font-semibold text-stone-900 dark:text-zinc-100">
                          {currentWorkflowStep?.stepLabel ?? "Unavailable"}
                        </span>
                      </div>
                      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                        Use the left workflow rail to move through mocked stages,
                        the role switcher to preview permissions, and the configure
                        page to build quotes with persisted local data.
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="User menu">
                      <UserRound className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Demo User</SheetTitle>
                      <SheetDescription>
                        Requestor workspace controls for the seeded CPQ starter.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 px-4 pb-4">
                      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                        Signed in as Demo User. Current role is{" "}
                        <span className="font-semibold capitalize text-stone-900 dark:text-zinc-100">
                          {workspace.ui.active_role}
                        </span>
                        .
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        onClick={resetWorkspace}
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Reset Workspace</span>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="border-t border-stone-200 bg-stone-50 px-4 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 overflow-x-auto">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }): string =>
                      cn(
                        "whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-stone-600 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                        (isActive || item.matches(location.pathname)) &&
                          "bg-stone-100 text-stone-900 dark:bg-zinc-900 dark:text-zinc-100",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 lg:p-6">
            <div className="mx-auto w-full max-w-[1400px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
