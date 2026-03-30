import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router";
import {
  BriefcaseBusiness,
  ChevronRight,
  ClipboardCheck,
  FolderKanban,
  Send,
  Target,
} from "lucide-react";
import { useSidebar } from "../ui/Sidebar";
import {
  getWorkflowProgress,
  getWorkflowSections,
  type CpqWorkspace,
  type WorkflowSection,
  type WorkflowState,
} from "../../lib/cpq-data";
import { cn } from "../../lib/utils";

interface WorkflowRailProps {
  workspace: CpqWorkspace;
  className?: string;
}

/**
 * Builds the shared route path for each workflow step page.
 */
function getWorkflowStepPath(stepId: string): string {
  return `/workflow/${stepId}`;
}

/**
 * Resolves the section icon for the workflow rail.
 */
function getWorkflowIcon(section: WorkflowSection): ReactElement {
  const iconClassName = "h-4 w-4";

  switch (section.icon_key) {
    case "capture":
      return <Target className={iconClassName} />;
    case "account":
      return <BriefcaseBusiness className={iconClassName} />;
    case "proposal":
      return <ClipboardCheck className={iconClassName} />;
    case "delivery":
      return <Send className={iconClassName} />;
    case "project":
      return <FolderKanban className={iconClassName} />;
  }
}

/**
 * Maps workflow states to the restrained enterprise colors used in the shell.
 */
function getSectionTone(state: WorkflowState): string {
  if (state === "complete") {
    return "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40";
  }

  if (state === "current") {
    return "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30";
  }

  return "border-transparent bg-transparent";
}

/**
 * Maps workflow states to simple status dots without decorative effects.
 */
function getStepDotTone(state: WorkflowState): string {
  if (state === "complete") {
    return "border-emerald-600 bg-emerald-600";
  }

  if (state === "current") {
    return "border-amber-500 bg-amber-500";
  }

  return "border-stone-300 bg-transparent dark:border-zinc-700";
}

/**
 * Shared workflow rail used on desktop and in the mobile drawer.
 */
export function WorkflowRail({
  workspace,
  className,
}: WorkflowRailProps): ReactElement {
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const progress = getWorkflowProgress(workspace);
  const workflowSections = getWorkflowSections(workspace);
  const currentSectionId =
    workflowSections.find((section) => section.state === "current")?.id ??
    workflowSections[0]?.id ??
    null;
  const workflowSectionIds = workflowSections.map((section) => section.id).join("|");
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(
    () =>
      new Set(
        workflowSections
          .filter((section) => section.state === "current")
          .map((section) => section.id),
      ),
  );

  /**
   * Keep the current section expanded as workflow data changes while dropping
   * ids that no longer exist in the current workflow definition.
   */
  useEffect((): void => {
    setExpandedSectionIds((currentExpandedSectionIds) => {
      const nextExpandedSectionIds = new Set<string>();
      const visibleSectionIds = new Set(
        workflowSectionIds ? workflowSectionIds.split("|") : [],
      );

      for (const sectionId of currentExpandedSectionIds) {
        if (visibleSectionIds.has(sectionId)) {
          nextExpandedSectionIds.add(sectionId);
        }
      }

      if (currentSectionId && nextExpandedSectionIds.size === 0) {
        nextExpandedSectionIds.add(currentSectionId);
      }

      if (
        nextExpandedSectionIds.size === currentExpandedSectionIds.size &&
        Array.from(nextExpandedSectionIds).every((sectionId) =>
          currentExpandedSectionIds.has(sectionId),
        )
      ) {
        return currentExpandedSectionIds;
      }

      return nextExpandedSectionIds;
    });
  }, [currentSectionId, workflowSectionIds]);

  /**
   * Step navigation should also dismiss the mobile drawer so the newly selected
   * page is visible immediately after the route change.
   */
  const handleStepNavigation = (stepId: string): void => {
    if (isMobile) {
      setOpenMobile(false);
      window.setTimeout(() => navigate(getWorkflowStepPath(stepId)), 0);
      return;
    }

    navigate(getWorkflowStepPath(stepId));
  };

  /**
   * Sections expand and collapse locally so the shell demonstrates structure
   * without implying a required route-per-step template.
   */
  const toggleSection = (sectionId: string): void => {
    setExpandedSectionIds((currentExpandedSectionIds) => {
      const nextExpandedSectionIds = new Set(currentExpandedSectionIds);

      if (nextExpandedSectionIds.has(sectionId)) {
        nextExpandedSectionIds.delete(sectionId);
      } else {
        nextExpandedSectionIds.add(sectionId);
      }

      return nextExpandedSectionIds;
    });
  };

  return (
    <aside
      aria-label="Workflow"
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-r border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
    >
      <div className="border-b border-stone-200 px-4 py-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
              {workspace.account.name}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-stone-900 dark:text-zinc-100">
              <Target className="h-4 w-4 text-stone-500 dark:text-zinc-400" />
              <span>Workflow</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
          <span>
            {progress.completeSteps} of {progress.totalSteps} steps
          </span>
          <span>{progress.percent}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-stone-200 dark:bg-zinc-800">
          <div
            className="h-full bg-amber-500 transition-[width] duration-200 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-3">
          {workflowSections.map((section) => {
            const isExpanded = expandedSectionIds.has(section.id);
            const sectionContentId = `workflow-section-${section.id}`;

            return (
              <section key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isExpanded}
                  aria-controls={sectionContentId}
                  className={cn(
                    "w-full rounded-lg border px-3 py-3 text-left transition-colors duration-150 hover:border-stone-300 hover:bg-white dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
                    getSectionTone(section.state),
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md border border-stone-200 bg-white p-1.5 text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                      {getWorkflowIcon(section)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                        {section.title}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-zinc-400">
                        {section.summary}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "mt-0.5 h-4 w-4 text-stone-400 transition-transform duration-150 dark:text-zinc-500",
                        isExpanded && "rotate-90",
                      )}
                    />
                  </div>
                </button>

                <ol
                  id={sectionContentId}
                  hidden={!isExpanded}
                  className="mt-3 space-y-1 pl-4"
                >
                  {section.steps.map((step) => {
                    const isActiveStep =
                      step.id === workspace.ui.active_workflow_step_id;

                    return (
                      <li key={step.id}>
                        <button
                          type="button"
                          onClick={() => handleStepNavigation(step.id)}
                          aria-current={isActiveStep ? "step" : undefined}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150",
                            isActiveStep
                              ? "bg-stone-100 text-stone-900 dark:bg-zinc-900 dark:text-zinc-100"
                              : "hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                          )}
                        >
                          <span
                            className={cn(
                              "h-3.5 w-3.5 rounded-full border",
                              getStepDotTone(step.state),
                            )}
                          />
                          <span
                            className={cn(
                              "leading-5",
                              step.state === "upcoming"
                                ? "text-stone-400 dark:text-zinc-500"
                                : "text-stone-700 dark:text-zinc-200",
                            )}
                          >
                            {step.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </div>

      <div className="border-t border-stone-200 px-4 py-4 dark:border-zinc-800">
        <div className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
          Workspace Role
        </div>
        <div className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
          {workspace.ui.active_role}
        </div>
      </div>
    </aside>
  );
}
