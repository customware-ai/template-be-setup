import { useEffect, type ChangeEvent, type ReactElement } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Minus, Package2, Plus, ShieldCheck } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Skeleton } from "~/components/ui/Skeleton";
import {
  canEditWorkspace,
  canViewPricing,
  formatPriceVisibility,
  formatStarterQuoteCode,
  getEstimateById,
  getEstimateLineItems,
  getEstimateTotals,
  getNextWorkflowStep,
  getWorkflowProgress,
  getWorkflowStepMetaById,
  isWorkflowComplete,
  type EstimateLineItem,
  type StarterPreConfiguration,
} from "~/lib/cpq-data";
import { useCpqWorkspaceStorage } from "~/utils/cpq-storage";

interface StepContent {
  title: string;
  description: string;
}

/**
 * Builds the shared route path for workflow step pages.
 */
function getWorkflowStepPath(stepId: string): string {
  return `/workflow/${stepId}`;
}

/**
 * Keeps the page copy tied to the route-driven step engine instead of a
 * single static starter surface.
 */
function getStepContent(stepId: string): StepContent {
  switch (stepId) {
    case "customer-collection":
      return {
        title: "Customer & Collection",
        description:
          "Capture the customer name and commercial collection before the quote moves forward.",
      };
    case "quote-identity":
      return {
        title: "Quote Identity",
        description:
          "Set the quote year, sequence, and item label that will identify this starter quote.",
      };
    case "starter-scope":
      return {
        title: "Starter Scope",
        description:
          "Load the starter package or add the compliance line so the quote has real commercial scope.",
      };
    default:
      return {
        title: "Customer & Collection",
        description:
          "Capture the customer name and commercial collection before the quote moves forward.",
      };
  }
}

/**
 * Validates whether the current step has enough starter data to proceed.
 */
function isStepReady(
  stepId: string,
  starterPreConfiguration: StarterPreConfiguration,
  lineItems: EstimateLineItem[],
): boolean {
  switch (stepId) {
    case "customer-collection":
      return (
        starterPreConfiguration.customer_name.trim().length > 0 &&
        starterPreConfiguration.collection_name.trim().length > 0
      );
    case "quote-identity":
      return (
        starterPreConfiguration.quote_year.trim().length > 0 &&
        starterPreConfiguration.sequence_code.trim().length > 0 &&
        starterPreConfiguration.item_name.trim().length > 0
      );
    case "starter-scope":
      return lineItems.length > 0;
    default:
      return false;
  }
}

/**
 * Explains what the current step still needs before the workflow can advance.
 */
function getStepReadinessMessage(
  stepId: string,
  ready: boolean,
  workflowCompleted: boolean,
): string {
  if (workflowCompleted) {
    return "This starter workflow is complete.";
  }

  if (ready) {
    return "This step is ready to proceed.";
  }

  switch (stepId) {
    case "customer-collection":
      return "Enter both the customer name and collection.";
    case "quote-identity":
      return "Enter the quote year, sequence, and item name.";
    case "starter-scope":
      return "Add at least one starter line before proceeding.";
    default:
      return "Complete the current step before proceeding.";
  }
}

/**
 * Renders the first-step customer and collection inputs.
 */
function renderCustomerCollectionStep(
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
        label="Customer"
        value={starterPreConfiguration.customer_name}
        placeholder="DR Inc"
        className="h-10 text-sm"
        disabled={!isEditable}
        onChange={(event) => onStarterFieldChange("customer_name", event)}
      />

      <Input
        label="Collection"
        value={starterPreConfiguration.collection_name}
        placeholder="Custom Hoist Line"
        className="h-10 text-sm"
        disabled={!isEditable}
        onChange={(event) => onStarterFieldChange("collection_name", event)}
      />
    </div>
  );
}

/**
 * Renders the quote identity inputs that define the starter quote code.
 */
function renderQuoteIdentityStep(
  starterPreConfiguration: StarterPreConfiguration,
  starterQuoteCode: string,
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
          label="Quote Year"
          value={starterPreConfiguration.quote_year}
          placeholder="2026"
          className="h-10 text-sm"
          disabled={!isEditable}
          onChange={(event) => onStarterFieldChange("quote_year", event)}
        />

        <Input
          label="Sequence"
          value={starterPreConfiguration.sequence_code}
          placeholder="001"
          className="h-10 text-sm"
          disabled={!isEditable}
          onChange={(event) => onStarterFieldChange("sequence_code", event)}
        />

        <Input
          label="Item Name"
          value={starterPreConfiguration.item_name}
          placeholder="Under Running Crane"
          className="h-10 text-sm"
          disabled={!isEditable}
          onChange={(event) => onStarterFieldChange("item_name", event)}
        />
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-xs text-stone-500 dark:text-zinc-400">
          Generated quote code
        </div>
        <div className="mt-1 font-semibold text-stone-950 dark:text-zinc-100">
          {starterQuoteCode}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the starter scope action rows and current line items.
 */
function renderStarterScopeStep(
  isEditable: boolean,
  starterPackageName: string,
  starterPackageDescription: string,
  complianceAddOnName: string,
  complianceAddOnDescription: string,
  starterPackageLoaded: boolean,
  complianceAddOnLoaded: boolean,
  lineItems: EstimateLineItem[],
  onLoadStarterPackage: () => void,
  onLoadComplianceAddOn: () => void,
  onIncreaseQuantity: (lineItem: EstimateLineItem) => void,
  onDecreaseQuantity: (lineItem: EstimateLineItem) => void,
  onRemoveLineItem: (lineItem: EstimateLineItem) => void,
  canSeePricing: boolean,
  role: Parameters<typeof formatPriceVisibility>[1],
): ReactElement {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="rounded-lg border border-stone-200 bg-card px-4 py-4 dark:border-zinc-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-stone-950 dark:text-zinc-100">
                {starterPackageName}
              </div>
              <div className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
                {starterPackageDescription}
              </div>
            </div>
            <Button
              variant={starterPackageLoaded ? "secondary" : "outline"}
              disabled={!isEditable || starterPackageLoaded}
              onClick={onLoadStarterPackage}
            >
              <Package2 className="h-4 w-4" />
              <span>
                {starterPackageLoaded ? "Loaded" : "Load package"}
              </span>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-card px-4 py-4 dark:border-zinc-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-stone-950 dark:text-zinc-100">
                {complianceAddOnName}
              </div>
              <div className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
                {complianceAddOnDescription}
              </div>
            </div>
            <Button
              variant={complianceAddOnLoaded ? "secondary" : "outline"}
              disabled={!isEditable || complianceAddOnLoaded}
              onClick={onLoadComplianceAddOn}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {complianceAddOnLoaded ? "Added" : "Add line"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 dark:border-zinc-800">
        <div className="border-b border-stone-200 px-4 py-3 text-sm font-medium text-stone-950 dark:border-zinc-800 dark:text-zinc-100">
          Quote scope
        </div>

        {lineItems.length === 0 ? (
          <div className="px-4 py-6 text-sm text-stone-500 dark:text-zinc-400">
            Load the package or add the compliance line to create starter scope.
          </div>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-zinc-800">
            {lineItems.map((lineItem) => (
              <div
                key={lineItem.id}
                className="space-y-3 px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-950 dark:text-zinc-100">
                      {lineItem.name}
                    </div>
                    <div className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
                      {lineItem.description}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-stone-950 dark:text-zinc-100">
                    {canSeePricing
                      ? formatPriceVisibility(lineItem.line_total, role)
                      : "Hidden"}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Decrease quantity for ${lineItem.name}`}
                    disabled={!isEditable || lineItem.quantity <= 1}
                    onClick={() => onDecreaseQuantity(lineItem)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="min-w-8 text-center text-sm font-medium text-stone-950 dark:text-zinc-100">
                    {lineItem.quantity}
                  </div>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Increase quantity for ${lineItem.name}`}
                    disabled={!isEditable}
                    onClick={() => onIncreaseQuantity(lineItem)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!isEditable}
                    onClick={() => onRemoveLineItem(lineItem)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Route-backed workflow step surface. Each step now has its own page while the
 * workflow definition still lives in shared local-first data.
 */
export default function WorkflowStepPage(): ReactElement {
  const navigate = useNavigate();
  const params = useParams();
  const routeStepId = params.stepId ?? "";
  const {
    workspace,
    isHydrated,
    updateStarterPreConfigurationField,
    addCatalogItem,
    addPackage,
    updateSelectionQuantity,
    removeSelection,
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

  const activeEstimate = getEstimateById(workspace, workspace.active_estimate_id);
  const starterPreConfiguration = workspace.starter_pre_configuration;
  const lineItems = activeEstimate
    ? getEstimateLineItems(workspace, activeEstimate.id)
    : [];
  const totals = activeEstimate
    ? getEstimateTotals(workspace, activeEstimate.id)
    : {
        subtotal: 0,
        packageSavings: 0,
        modifiersTotal: 0,
        total: 0,
        marginPercent: 0,
        itemCount: 0,
      };
  const workflowProgress = getWorkflowProgress(workspace);
  const stepContent = getStepContent(routeStepId);
  const nextStep = getNextWorkflowStep(workspace, routeStepId);
  const workflowCompleted = isWorkflowComplete(workspace);
  const starterQuoteCode = formatStarterQuoteCode(starterPreConfiguration);
  const isEditable = canEditWorkspace(workspace.ui.active_role);
  const canSeePricing = canViewPricing(workspace.ui.active_role);
  const ready = isStepReady(routeStepId, starterPreConfiguration, lineItems);
  const readinessMessage = getStepReadinessMessage(
    routeStepId,
    ready,
    workflowCompleted,
  );
  const starterPackage = workspace.packages[0] ?? null;
  const complianceAddOn =
    workspace.catalog.find((item) => item.id === "item-inspection-plan") ??
    workspace.catalog[0] ??
    null;
  const starterPackageLoaded =
    starterPackage !== null &&
    lineItems.some((lineItem) => lineItem.package_id === starterPackage.id);
  const complianceAddOnLoaded =
    complianceAddOn !== null &&
    lineItems.some(
      (lineItem) =>
        lineItem.item_id === complianceAddOn.id && lineItem.package_id === null,
    );

  /**
   * Step fields remain local-first so later API integration only has to swap
   * out the write source, not rebuild the page structure.
   */
  const handleStarterFieldChange = (
    field: keyof StarterPreConfiguration,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    updateStarterPreConfigurationField(field, event.target.value);
  };

  /**
   * The proceed action advances through ordered workflow steps and routes to the
   * next page when one exists.
   */
  const handleProceed = (): void => {
    if (workflowCompleted || !ready || !isEditable) {
      return;
    }

    advanceWorkflow();

    if (nextStep) {
      navigate(getWorkflowStepPath(nextStep.stepId));
    }
  };

  /**
   * The starter package action seeds the first commercial line bundle.
   */
  const handleLoadStarterPackage = (): void => {
    if (!activeEstimate || !starterPackage) {
      return;
    }

    addPackage(activeEstimate.id, starterPackage.id);
  };

  /**
   * The add-on action seeds one standalone service line.
   */
  const handleLoadComplianceAddOn = (): void => {
    if (!activeEstimate || !complianceAddOn) {
      return;
    }

    addCatalogItem(activeEstimate.id, complianceAddOn.id);
  };

  /**
   * Each route renders only the controls owned by that workflow step.
   */
  let stepBody: ReactElement;

  switch (routeStepId) {
    case "customer-collection":
      stepBody = renderCustomerCollectionStep(
        starterPreConfiguration,
        isEditable,
        handleStarterFieldChange,
      );
      break;
    case "quote-identity":
      stepBody = renderQuoteIdentityStep(
        starterPreConfiguration,
        starterQuoteCode,
        isEditable,
        handleStarterFieldChange,
      );
      break;
    case "starter-scope":
      stepBody = renderStarterScopeStep(
        isEditable,
        starterPackage?.name ?? "Starter package",
        starterPackage?.description ??
          "Use one starter package so this template starts with real commercial scope.",
        complianceAddOn?.name ?? "Compliance add-on",
        complianceAddOn?.description ??
          "Add one standalone line so quantity edits and pricing review are visible.",
        starterPackageLoaded,
        complianceAddOnLoaded,
        lineItems,
        handleLoadStarterPackage,
        handleLoadComplianceAddOn,
        (lineItem) =>
          updateSelectionQuantity(
            workspace.active_estimate_id,
            lineItem.id,
            lineItem.quantity + 1,
          ),
        (lineItem) =>
          updateSelectionQuantity(
            workspace.active_estimate_id,
            lineItem.id,
            lineItem.quantity - 1,
          ),
        (lineItem) => removeSelection(workspace.active_estimate_id, lineItem.id),
        canSeePricing,
        workspace.ui.active_role,
      );
      break;
    default:
      stepBody = <div />;
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
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-stone-500 dark:text-zinc-400">
              Stage
            </div>
            <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
              {resolvedRouteStep.sectionTitle}
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-stone-500 dark:text-zinc-400">
              Step
            </div>
            <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
              {resolvedRouteStep.stepIndex + 1} of {resolvedRouteStep.stepCount}
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-stone-200 bg-card dark:border-zinc-800">
          <div className="border-b border-stone-200 px-5 py-4 dark:border-zinc-800">
            <div className="text-sm font-medium text-stone-950 dark:text-zinc-100">
              {stepContent.title}
            </div>
          </div>

          <div className="px-5 py-5">{stepBody}</div>

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
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-stone-200 bg-card px-4 py-4 dark:border-zinc-800">
            <div className="text-sm font-medium text-stone-950 dark:text-zinc-100">
              Quote summary
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-stone-500 dark:text-zinc-400">Quote code</div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {starterQuoteCode}
                </div>
              </div>

              <div>
                <div className="text-stone-500 dark:text-zinc-400">Customer</div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {starterPreConfiguration.customer_name.trim() || "Not entered"}
                </div>
              </div>

              <div>
                <div className="text-stone-500 dark:text-zinc-400">Collection</div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {starterPreConfiguration.collection_name.trim() || "Not entered"}
                </div>
              </div>

              <div>
                <div className="text-stone-500 dark:text-zinc-400">Item</div>
                <div className="mt-1 font-medium text-stone-950 dark:text-zinc-100">
                  {starterPreConfiguration.item_name.trim() || "Not entered"}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-card px-4 py-4 dark:border-zinc-800">
            <div className="text-sm font-medium text-stone-950 dark:text-zinc-100">
              Workflow status
            </div>

            <div className="mt-4 space-y-3 text-sm">
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
                  {formatPriceVisibility(totals.total, workspace.ui.active_role)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-stone-500 dark:text-zinc-400">
                  Quantity
                </span>
                <span className="font-medium text-stone-950 dark:text-zinc-100">
                  {totals.itemCount}
                </span>
              </div>

              {workflowCompleted && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Starter workflow complete.
                </div>
              )}
            </div>
          </section>

          {!isEditable && (
            <section className="rounded-lg border border-stone-200 bg-card px-4 py-4 text-sm text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
              {workspace.ui.active_role} can review this starter workflow, but
              only admin and estimator can edit or proceed.
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
