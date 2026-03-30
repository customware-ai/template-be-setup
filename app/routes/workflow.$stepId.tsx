import { useEffect, type ChangeEvent, type ReactElement } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Skeleton } from "~/components/ui/Skeleton";
import {
  canEditWorkspace,
  formatCurrency,
  formatStarterReferenceCode,
  getEstimateTotals,
  getNextWorkflowStep,
  getWorkflowProgress,
  getWorkflowStepMetaById,
  isWorkflowComplete,
  type StarterPreConfiguration,
} from "~/lib/cpq-data";
import { useCpqWorkspaceStorage } from "~/utils/cpq-storage";

interface StepContent {
  title: string;
  description: string;
}

const workflowPanelClassName = "gap-0";

function getWorkflowStepPath(stepId: string): string {
  return `/workflow/${stepId}`;
}

function getStepContent(stepId: string): StepContent {
  switch (stepId) {
    case "step-2":
      return {
        title: "Reference Details",
        description: "Capture the reference values before the workflow is finalized.",
      };
    case "step-1":
    default:
      return {
        title: "Primary Details",
        description: "Capture the first labels before the workflow moves forward.",
      };
  }
}

function isStepReady(
  stepId: string,
  starterPreConfiguration: StarterPreConfiguration,
): boolean {
  switch (stepId) {
    case "step-1":
      return (
        starterPreConfiguration.primary_label.trim().length > 0 &&
        starterPreConfiguration.secondary_label.trim().length > 0
      );
    case "step-2":
      return (
        starterPreConfiguration.reference_year.trim().length > 0 &&
        starterPreConfiguration.reference_sequence.trim().length > 0 &&
        starterPreConfiguration.item_label.trim().length > 0
      );
    default:
      return false;
  }
}

function getStepReadinessMessage(
  stepId: string,
  ready: boolean,
  workflowCompleted: boolean,
): string {
  if (workflowCompleted) {
    return "This workflow is complete.";
  }

  if (ready) {
    return "This step is ready to proceed.";
  }

  switch (stepId) {
    case "step-1":
      return "Enter both labels.";
    case "step-2":
      return "Enter the reference year, sequence, and item label.";
    default:
      return "Complete the current step before proceeding.";
  }
}

function renderStepOne(
  starterPreConfiguration: StarterPreConfiguration,
  isEditable: boolean,
  onStarterFieldChange: (
    field: keyof StarterPreConfiguration,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void,
): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Primary label"
        value={starterPreConfiguration.primary_label}
        placeholder="Workspace"
        className="h-10 text-sm"
        disabled={!isEditable}
        onChange={(event) => onStarterFieldChange("primary_label", event)}
      />

      <Input
        label="Secondary label"
        value={starterPreConfiguration.secondary_label}
        placeholder="Context"
        className="h-10 text-sm"
        disabled={!isEditable}
        onChange={(event) => onStarterFieldChange("secondary_label", event)}
      />
    </div>
  );
}

function renderStepTwo(
  starterPreConfiguration: StarterPreConfiguration,
  referenceCode: string,
  isEditable: boolean,
  onStarterFieldChange: (
    field: keyof StarterPreConfiguration,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void,
): ReactElement {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Reference year"
          value={starterPreConfiguration.reference_year}
          placeholder="2026"
          className="h-10 text-sm"
          disabled={!isEditable}
          onChange={(event) => onStarterFieldChange("reference_year", event)}
        />

        <Input
          label="Sequence"
          value={starterPreConfiguration.reference_sequence}
          placeholder="001"
          className="h-10 text-sm"
          disabled={!isEditable}
          onChange={(event) => onStarterFieldChange("reference_sequence", event)}
        />

        <Input
          label="Item label"
          value={starterPreConfiguration.item_label}
          placeholder="Configured Item"
          className="h-10 text-sm"
          disabled={!isEditable}
          onChange={(event) => onStarterFieldChange("item_label", event)}
        />
      </div>

      <div className="rounded-lg bg-stone-50 px-4 py-3 text-sm ring-1 ring-stone-200/80 dark:bg-zinc-900 dark:ring-zinc-800/80">
        <div className="text-xs text-stone-500 dark:text-zinc-400">
          Generated reference
        </div>
        <div className="mt-1 font-semibold text-stone-950 dark:text-zinc-100">
          {referenceCode}
        </div>
      </div>
    </div>
  );
}

export default function WorkflowStepPage(): ReactElement {
  const navigate = useNavigate();
  const params = useParams();
  const routeStepId = params.stepId ?? "";
  const {
    workspace,
    isHydrated,
    updateStarterPreConfigurationField,
    setActiveWorkflowStep,
    advanceWorkflow,
  } = useCpqWorkspaceStorage();

  const routeStep = getWorkflowStepMetaById(workspace, routeStepId);

  useEffect((): void => {
    if (!isHydrated || !routeStep) {
      return;
    }

    if (workspace.ui.active_workflow_step_id !== routeStepId) {
      setActiveWorkflowStep(routeStepId);
    }
  }, [
    isHydrated,
    routeStep,
    routeStepId,
    setActiveWorkflowStep,
    workspace.ui.active_workflow_step_id,
  ]);

  if (isHydrated && !routeStep) {
    return (
      <Navigate
        replace
        to={getWorkflowStepPath(workspace.ui.active_workflow_step_id)}
      />
    );
  }

  if (!isHydrated || workspace.ui.active_workflow_step_id !== routeStepId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-80 rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  const resolvedRouteStep = routeStep as NonNullable<typeof routeStep>;
  const starterPreConfiguration = workspace.starter_pre_configuration;
  const referenceCode = formatStarterReferenceCode(starterPreConfiguration);
  const isEditable = canEditWorkspace(workspace.ui.active_role);
  const workflowCompleted = isWorkflowComplete(workspace);
  const ready = isStepReady(routeStepId, starterPreConfiguration);
  const nextStep = getNextWorkflowStep(workspace, routeStepId);
  const workflowProgress = getWorkflowProgress(workspace);
  const stepContent = getStepContent(routeStepId);
  const estimateTotals = getEstimateTotals(workspace, workspace.active_estimate_id);
  const readinessMessage = getStepReadinessMessage(
    routeStepId,
    ready,
    workflowCompleted,
  );

  const handleStarterFieldChange = (
    field: keyof StarterPreConfiguration,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    updateStarterPreConfigurationField(field, event.target.value);
  };

  const handleProceed = (): void => {
    if (workflowCompleted || !ready || !isEditable) {
      return;
    }

    advanceWorkflow();

    if (nextStep) {
      navigate(getWorkflowStepPath(nextStep.stepId));
    }
  };

  let stepBody: ReactElement;

  switch (routeStepId) {
    case "step-2":
      stepBody = renderStepTwo(
        starterPreConfiguration,
        referenceCode,
        isEditable,
        handleStarterFieldChange,
      );
      break;
    case "step-1":
    default:
      stepBody = renderStepOne(
        starterPreConfiguration,
        isEditable,
        handleStarterFieldChange,
      );
      break;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
            {stepContent.title}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            {stepContent.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm md:min-w-[320px]">
          <div className="rounded-lg bg-stone-50 px-3 py-2 ring-1 ring-stone-200/80 dark:bg-zinc-900 dark:ring-zinc-800/80">
            <div className="text-xs text-stone-500 dark:text-zinc-400">Stage</div>
            <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
              {resolvedRouteStep.sectionTitle}
            </div>
          </div>
          <div className="rounded-lg bg-stone-50 px-3 py-2 ring-1 ring-stone-200/80 dark:bg-zinc-900 dark:ring-zinc-800/80">
            <div className="text-xs text-stone-500 dark:text-zinc-400">Step</div>
            <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
              {resolvedRouteStep.stepIndex + 1} of {resolvedRouteStep.stepCount}
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card
          data-testid="workflow-primary-card"
          className={`${workflowPanelClassName} py-0`}
        >
          <CardHeader className="border-b border-stone-200 px-5 py-4 dark:border-zinc-800">
            <CardTitle className="text-sm font-medium text-stone-950 dark:text-zinc-100">
              {stepContent.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 py-5">{stepBody}</CardContent>

          <div
            data-testid="workflow-step-footer"
            className="flex flex-col gap-4 border-t border-stone-200 px-5 py-4 dark:border-zinc-800 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-stretch"
          >
            <div className="text-sm text-stone-500 dark:text-zinc-400 xl:flex xl:items-center xl:pr-4">
              {readinessMessage}
            </div>
            <div
              data-testid="workflow-step-footer-actions"
              className="xl:flex xl:min-w-[280px] xl:items-center xl:justify-center xl:border-l xl:border-stone-200 xl:pl-5 2xl:min-w-[320px] dark:xl:border-zinc-800"
            >
              <Button
                className="w-full sm:w-auto xl:min-w-[240px] 2xl:min-w-[256px]"
                disabled={!isEditable || workflowCompleted || !ready}
                onClick={handleProceed}
              >
                <span>
                  {workflowCompleted
                    ? "Workflow complete"
                    : nextStep
                      ? `Continue to ${nextStep.stepLabel}`
                      : "Complete workflow"}
                </span>
              </Button>
            </div>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card
            data-testid="workflow-summary-card"
            className={`${workflowPanelClassName} px-4 py-4`}
          >
            <CardTitle className="text-sm font-medium text-stone-950 dark:text-zinc-100">
              Workflow summary
            </CardTitle>

            <CardContent className="mt-4 space-y-3 px-0 text-sm">
              <div>
                <div className="text-stone-500 dark:text-zinc-400">Reference code</div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {referenceCode}
                </div>
              </div>

              <div>
                <div className="text-stone-500 dark:text-zinc-400">
                  Primary label
                </div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {starterPreConfiguration.primary_label.trim() || "Not entered"}
                </div>
              </div>

              <div>
                <div className="text-stone-500 dark:text-zinc-400">
                  Secondary label
                </div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {starterPreConfiguration.secondary_label.trim() || "Not entered"}
                </div>
              </div>

              <div>
                <div className="text-stone-500 dark:text-zinc-400">Item</div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {starterPreConfiguration.item_label.trim() || "Not entered"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            data-testid="workflow-status-card"
            className={`${workflowPanelClassName} px-4 py-4`}
          >
            <CardTitle className="text-sm font-medium text-stone-950 dark:text-zinc-100">
              Workflow status
            </CardTitle>

            <CardContent className="mt-4 space-y-3 px-0 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-stone-500 dark:text-zinc-400">
                  Progress
                </span>
                <span className="font-medium text-stone-950 dark:text-zinc-100">
                  {workflowProgress.completeSteps} / {workflowProgress.totalSteps}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-stone-500 dark:text-zinc-400">
                  Scope value
                </span>
                <span className="font-medium text-stone-950 dark:text-zinc-100">
                  {formatCurrency(estimateTotals.total)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-stone-500 dark:text-zinc-400">Quantity</span>
                <span className="font-medium text-stone-950 dark:text-zinc-100">
                  {estimateTotals.itemCount}
                </span>
              </div>

              {workflowCompleted && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/80">
                  Workflow complete.
                </div>
              )}
            </CardContent>
          </Card>

          {!isEditable && (
            <section className="rounded-lg bg-card px-4 py-4 text-sm text-stone-500 shadow-xs ring-1 ring-stone-200/80 dark:text-zinc-400 dark:shadow-sm dark:ring-zinc-800/80">
              {workspace.ui.active_role} can review this workflow, but
              only admin and estimator can edit or proceed.
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
