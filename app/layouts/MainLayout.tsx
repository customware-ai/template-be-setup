import { useEffect, type ReactElement } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Moon, Sun, UserRound } from "lucide-react";
import { WorkflowRail } from "~/components/cpq/WorkflowRail";
import { Button } from "~/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/Popover";
import { Select } from "~/components/ui/Select";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/Sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/Sheet";
import { type UserRole } from "~/lib/cpq-data";
import { cn } from "~/lib/utils";
import { useCpqWorkspaceStorage } from "~/utils/cpq-storage";

interface NavigationItem {
  label: string;
  href: string;
  matches: (pathname: string) => boolean;
}

interface WorkspaceUserMenuProps {
  role: UserRole;
}

/**
 * Renders the workspace user summary as a small dropdown instead of a sheet so
 * the header stays compact.
 */
function WorkspaceUserMenu({ role }: WorkspaceUserMenuProps): ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="User menu">
          <UserRound className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <PopoverHeader className="px-4 py-3">
          <PopoverTitle className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
            Workspace User
          </PopoverTitle>
          <PopoverDescription className="text-sm text-stone-500 dark:text-zinc-400">
            Workspace controls for the shell.
          </PopoverDescription>
        </PopoverHeader>
        <div className="space-y-3 px-4 py-4 text-sm text-stone-600 dark:text-zinc-300">
          <div>
            <div className="text-stone-500 dark:text-zinc-400">Signed in as</div>
            <div className="mt-1 font-medium text-stone-900 dark:text-zinc-100">
              Workspace user
            </div>
          </div>
          <div>
            <div className="text-stone-500 dark:text-zinc-400">Current role</div>
            <div className="mt-1 font-semibold capitalize text-stone-900 dark:text-zinc-100">
              {role}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Renders the sidebar-aware shell inside the shared shadcn sidebar provider.
 */
function MainLayoutShell(): ReactElement {
  const location = useLocation();
  const {
    workspace,
    setActiveRole,
    toggleThemeMode,
  } = useCpqWorkspaceStorage();

  // Keep a single shell nav model in one place so future routes can attach to
  // the shared desktop and mobile header patterns without duplicating logic.
  const navigationItems: NavigationItem[] = [
    {
      label: "Workspace",
      href: "/",
      matches: (pathname: string): boolean => pathname === "/",
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

  return (
    <>
      <Sidebar side="left" collapsible="offcanvas">
        <WorkflowRail workspace={workspace} className="border-r-0" />
      </Sidebar>

      <SidebarInset className="min-h-screen min-w-0">
        <header className="border-b border-stone-200 bg-card dark:border-zinc-800">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
            <SidebarTrigger aria-label="Toggle workflow sidebar" />

            <Link
              to="/"
              className="flex min-w-0 items-center text-stone-900 dark:text-zinc-100"
            >
              <div className="flex items-center justify-center rounded-xl bg-stone-100 px-2.5 py-2 text-sm font-semibold leading-none tracking-[-0.08em] dark:bg-zinc-900">
                CW
              </div>
            </Link>

            <nav className="ml-2 hidden items-center gap-1 md:flex">
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
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="hidden sm:inline-flex">
                    <span>View as Role</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Workspace Access</SheetTitle>
                    <SheetDescription>
                      Preview the active role state in the shell.
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
              <WorkspaceUserMenu role={workspace.ui.active_role} />
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
          <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1520px]">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </>
  );
}

/**
 * Shared CPQ application shell.
 */
export default function MainLayout(): ReactElement {
  return (
    <SidebarProvider
      defaultOpen
      className="bg-background text-foreground 2xl:[--sidebar-width:18rem]"
    >
      <MainLayoutShell />
    </SidebarProvider>
  );
}
