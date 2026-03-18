import type { ReactElement } from "react";
import { useNavigate } from "react-router";
import {
  BriefcaseBusiness,
  ChevronRight,
  ClipboardCheck,
  FolderKanban,
  Send,
  Target,
} from "lucide-react";
import { Button } from "../ui/Button";
import {
  getCurrentWorkflowStep,
  getWorkflowProgress,
  getWorkflowSections,
  getWorkflowStepMetas,
  getWorkflowTargetHref,
  type CpqWorkspace,
  type WorkflowSection,
  type WorkflowState,
} from "../../lib/cpq-data";
import { cn } from "../../lib/utils";

interface WorkflowRailProps {
  workspace: CpqWorkspace;
  className?: string;
  onSelectStep: (stepId: string) => void;
  onAdvance: () => void;
  onNavigate?: () => void;
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
  onSelectStep,
  onAdvance,
  onNavigate,
}: WorkflowRailProps): ReactElement {
  const navigate = useNavigate();
  const progress = getWorkflowProgress(workspace);
  const workflowSections = getWorkflowSections(workspace);
  const currentWorkflowStep = getCurrentWorkflowStep(workspace);
  const orderedSteps = getWorkflowStepMetas(workspace);

  /**
   * Selecting a step updates the mock workflow state and takes the user to the
   * route that best matches that step.
   */
  const handleSelectStep = (stepId: string): void => {
    onSelectStep(stepId);
    onNavigate?.();
    void navigate(getWorkflowTargetHref(stepId, workspace.active_estimate_id));
  };

  /**
   * The advance action mirrors a "next step" workflow control.
   */
  const handleAdvance = (): void => {
    const activeStepIndex = orderedSteps.findIndex(
      (step) => step.stepId === workspace.ui.active_workflow_step_id,
    );
    const nextStep =
      orderedSteps[Math.min(activeStepIndex + 1, orderedSteps.length - 1)];

    onAdvance();
    onNavigate?.();

    if (nextStep) {
      void navigate(
        getWorkflowTargetHref(nextStep.stepId, workspace.active_estimate_id),
      );
      return;
    }

    if (currentWorkflowStep) {
      void navigate(
        getWorkflowTargetHref(
          currentWorkflowStep.stepId,
          workspace.active_estimate_id,
        ),
      );
    }
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
          <Button variant="ghost" size="sm" onClick={handleAdvance}>
            <span>Advance</span>
          </Button>
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
            const sectionStepTarget =
              section.steps.find((step) => step.state === "current")?.id ??
              section.steps[0]?.id;

            return (
              <section key={section.id}>
                <button
                  type="button"
                  onClick={() =>
                    sectionStepTarget ? handleSelectStep(sectionStepTarget) : undefined
                  }
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
                    <ChevronRight className="mt-0.5 h-4 w-4 text-stone-400 dark:text-zinc-500" />
                  </div>
                </button>

                <ol className="mt-3 space-y-1 pl-4">
                  {section.steps.map((step) => {
                    const isActiveStep =
                      step.id === workspace.ui.active_workflow_step_id;

                    return (
                      <li key={step.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectStep(step.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-stone-100 dark:hover:bg-zinc-900",
                            isActiveStep && "bg-stone-100 dark:bg-zinc-900",
                          )}
                          aria-current={isActiveStep ? "step" : undefined}
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
          Demo User
        </div>
        <div className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
          {workspace.ui.active_role}
        </div>
      </div>
    </aside>
  );
}
