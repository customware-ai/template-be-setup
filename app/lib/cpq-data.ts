// THIS FILE CONTAINS MOCK SAMPLE DATA ONLY. REMOVE IT AND RE-ADD THE REAL REQUEST DATA WHEN NEEDED.
import { z } from "zod";
import {
  advanceWorkflow as advanceWorkflowState,
  getCurrentWorkflowStepMeta,
  getFirstWorkflowStepId,
  getNextWorkflowStepMeta,
  getWorkflowProgress as getWorkflowEngineProgress,
  getWorkflowStepMetaById as getWorkflowEngineStepMetaById,
  getWorkflowStepMetas as getWorkflowEngineStepMetas,
  isWorkflowComplete as isWorkflowEngineComplete,
  resolveWorkflowStages,
  setActiveWorkflowStep as setActiveWorkflowStepState,
  type WorkflowRuntimeState,
  type WorkflowStageDefinition,
  type WorkflowStepDefinition,
  type WorkflowStepMeta as WorkflowEngineStepMeta,
} from "./workflow-engine";

/**
 * Shared workflow state used across the dashboard, estimate workspace, and
 * configure experience.
 */
export const WorkflowStateSchema = z.enum(["complete", "current", "upcoming"]);

/**
 * Estimate lifecycle used by the example CPQ starter.
 */
export const EstimateStatusSchema = z.enum(["draft", "review", "approved"]);

/**
 * Example RBAC roles inspired by the CPQ bundle guidance.
 */
export const UserRoleSchema = z.enum([
  "admin",
  "estimator",
  "approver",
  "viewer",
]);

/**
 * Theme mode stored with the local-first workspace so shell controls work.
 */
export const ThemeModeSchema = z.enum(["light", "dark"]);

/**
 * Workflow step contract derived from the active sample workflow position.
 */
export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  state: WorkflowStateSchema,
});

/**
 * Workflow section contract derived from the active sample workflow position.
 */
export const WorkflowSectionIconKeySchema = z.enum([
  "capture",
  "account",
  "proposal",
  "delivery",
  "project",
]);

/**
 * Workflow section contract derived from the active sample workflow position.
 */
export const WorkflowSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  state: WorkflowStateSchema,
  icon_key: WorkflowSectionIconKeySchema,
  steps: z.array(WorkflowStepSchema).min(1),
});

/**
 * Account summary rendered on the primary dashboard.
 */
export const AccountSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string().min(1),
  status: z.string().min(1),
  contact_person: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
});

/**
 * Lightweight dashboard summary projected from persisted estimates.
 */
export const OpportunitySummarySchema = z.object({
  id: z.string().min(1),
  estimate_id: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  stage: z.string().min(1),
  probability: z.number().int().min(0).max(100),
  value: z.number().nonnegative(),
});

/**
 * Catalog record displayed in the configure view.
 */
export const CatalogItemSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().min(1),
  unit_price: z.number().nonnegative(),
  unit_cost: z.number().nonnegative(),
  lead_time_days: z.number().int().nonnegative(),
  uom: z.string().min(1),
  tags: z.array(z.string()),
});

/**
 * Package records add multiple catalog items at once with a fixed discount.
 */
export const CatalogPackageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  discount_rate: z.number().min(0).max(1),
  items: z
    .array(
      z.object({
        item_id: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

/**
 * Persisted build selection used to derive both configure totals and the
 * estimate workspace line items.
 */
export const BuildSelectionSchema = z.object({
  id: z.string().min(1),
  item_id: z.string().min(1),
  quantity: z.number().int().positive(),
  source: z.enum(["catalog", "package"]),
  package_id: z.string().nullable(),
});

/**
 * Example attachments keep the estimate workspace file actions functional without a
 * server-backed document store.
 */
export const EstimateAttachmentSchema = z.object({
  id: z.string().min(1),
  file_name: z.string().min(1),
  kind: z.string().min(1),
  added_at: z.string(),
});

/**
 * Minimal example estimate contract used by the frontend template.
 */
export const EstimateSchema = z.object({
  id: z.string().min(1),
  estimate_number: z.string().min(1),
  account_name: z.string().min(1),
  project_name: z.string().min(1),
  revision_label: z.string().min(1),
  region: z.string().min(1),
  status: EstimateStatusSchema,
  workflow_stage: z.string().min(1),
  notes: z.string(),
  intake_prompt: z.string(),
  build_selections: z.array(BuildSelectionSchema),
  modifiers: z.array(z.enum(["expedited", "freight"])),
  attachments: z.array(EstimateAttachmentSchema),
  updated_at: z.string(),
});

/**
 * Shared shell state persisted alongside the business data so header controls
 * and workflow interactions survive reloads.
 */
export const CpqUiStateSchema = z.object({
  active_workflow_step_id: z.string().min(1),
  workflow_completed: z.boolean(),
  active_role: UserRoleSchema,
  theme_mode: ThemeModeSchema,
});

/**
 * Small persisted CPQ intake payload owned by the example pre-configuration
 * step. It stays intentionally narrow so template users can extend it without
 * inheriting a large demo-specific data shape.
 */
export const StarterPreConfigurationSchema = z.object({
  customer_name: z.string(),
  collection_name: z.string(),
  quote_year: z.string(),
  sequence_code: z.string(),
  item_name: z.string(),
  confirmation_notes: z.string(),
});

/**
 * Root example CPQ workspace stored in localStorage.
 * Only mutable source data is persisted; workflow and dashboard summaries are
 * derived from this shape at read time.
 */
export const CpqWorkspaceSchema = z.object({
  account: AccountSummarySchema,
  estimates: z.array(EstimateSchema).min(1),
  catalog: z.array(CatalogItemSchema).min(1),
  packages: z.array(CatalogPackageSchema).min(1),
  starter_pre_configuration: StarterPreConfigurationSchema,
  ui: CpqUiStateSchema,
  active_estimate_id: z.string().min(1),
});

export type WorkflowState = z.infer<typeof WorkflowStateSchema>;
export type WorkflowSectionIconKey = z.infer<typeof WorkflowSectionIconKeySchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type WorkflowSection = z.infer<typeof WorkflowSectionSchema>;
export type AccountSummary = z.infer<typeof AccountSummarySchema>;
export type OpportunitySummary = z.infer<typeof OpportunitySummarySchema>;
export type CatalogItem = z.infer<typeof CatalogItemSchema>;
export type CatalogPackage = z.infer<typeof CatalogPackageSchema>;
export type BuildSelection = z.infer<typeof BuildSelectionSchema>;
export type EstimateAttachment = z.infer<typeof EstimateAttachmentSchema>;
export type EstimateStatus = z.infer<typeof EstimateStatusSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type ThemeMode = z.infer<typeof ThemeModeSchema>;
export type Estimate = z.infer<typeof EstimateSchema>;
export type CpqUiState = z.infer<typeof CpqUiStateSchema>;
export type StarterPreConfiguration = z.infer<typeof StarterPreConfigurationSchema>;
export type CpqWorkspace = z.infer<typeof CpqWorkspaceSchema>;
export type WorkflowStepMeta = WorkflowEngineStepMeta<WorkflowStepDefinition>;

const ESTIMATE_MODIFIER_VALUES: Record<"expedited" | "freight", number> = {
  expedited: 0.15,
  freight: 150,
};

/**
 * Materialized line item used by the estimate workspace and build panel.
 */
export interface EstimateLineItem {
  id: string;
  item_id: string;
  package_id: string | null;
  source: BuildSelection["source"];
  sku: string;
  name: string;
  description: string;
  quantity: number;
  uom: string;
  lead_time_days: number;
  unit_price: number;
  unit_cost: number;
  line_subtotal: number;
  line_discount: number;
  line_total: number;
  line_margin: number;
  category: string;
}

/**
 * Totals summary shown on the configure page.
 */
export interface EstimateTotals {
  subtotal: number;
  packageSavings: number;
  modifiersTotal: number;
  total: number;
  marginPercent: number;
  itemCount: number;
}

/**
 * Lightweight dashboard metrics rendered from seeded data.
 */
export interface DashboardMetrics {
  opportunityCount: number;
  quoteCount: number;
  totalValue: number;
  averageMargin: number;
}

/**
 * Example workflow definitions stay isolated from the engine so the sample
 * shell can seed ordered steps without hardcoding progression behavior.
 */
type StarterWorkflowStepDefinition = WorkflowStepDefinition;

/**
 * Example workflow stages only add the shell metadata needed for the sample
 * sidebar and page headers.
 */
interface StarterWorkflowStageDefinition
  extends WorkflowStageDefinition<StarterWorkflowStepDefinition> {
  icon_key: WorkflowSectionIconKey;
}

/**
 * THIS MODULE CONTAINS SAMPLE-ONLY SEED DATA. DO NOT TREAT IT AS PRODUCTION DATA.
 * THIS IS MOCK DATA. REMOVE IT AND RE-ADD THE REAL REQUEST DATA WHEN THE PRODUCT NEEDS IT.
 */
function createBaseWorkflowDefinition(): StarterWorkflowStageDefinition[] {
  return [
    {
      id: "pre-configuration",
      title: "Pre-Configuration",
      icon_key: "capture",
      steps: [
        {
          id: "customer-collection",
          label: "Customer & Collection",
        },
        {
          id: "quote-identity",
          label: "Quote Identity",
        },
      ],
    },
    {
      id: "scope-review",
      title: "Scope & Review",
      icon_key: "proposal",
      steps: [
        {
          id: "scope-review",
          label: "Scope Review",
        },
      ],
    },
  ];
}

/**
 * Returns the first step from the sample workflow seed so callers do not have
 * to duplicate the synthetic route order.
 */
export function getDefaultWorkflowStepId(): string {
  return getFirstWorkflowStepId(createBaseWorkflowDefinition()) ?? "customer-collection";
}

/**
 * Returns the initial sample step label used to keep the seeded estimate in
 * sync with the current example workflow definition.
 */
function getDefaultWorkflowStepLabel(): string {
  return (
    getCurrentWorkflowStepMeta(createBaseWorkflowDefinition(), {
      activeStepId: getDefaultWorkflowStepId(),
      workflowCompleted: false,
    })?.stepLabel ?? "Customer & Collection"
  );
}

/**
 * Returns the sample starter pre-configuration object used for blank local
 * storage hydration and first-run seeding.
 */
function createDefaultStarterPreConfiguration(): StarterPreConfiguration {
  return {
    customer_name: "",
    collection_name: "",
    quote_year: "",
    sequence_code: "",
    item_name: "",
    confirmation_notes: "",
  };
}

/**
 * THIS IS SAMPLE-ONLY WORKSPACE DATA. DO NOT REUSE THESE VALUES FOR REAL CUSTOMERS.
 * THIS IS MOCK WORKSPACE DATA. REMOVE IT AND RE-ADD THE REAL REQUEST DATA WHEN NEEDED.
 */
export function createDefaultCpqWorkspace(): CpqWorkspace {
  const defaultWorkflowStepId = getDefaultWorkflowStepId();
  const defaultWorkflowStepLabel = getDefaultWorkflowStepLabel();

  return {
    account: {
      id: "acct-dr-inc",
      name: "Example Workspace",
      subtitle: "Single-page CPQ example",
      status: "Draft",
      contact_person: null,
      email: null,
      phone: null,
      address: null,
      notes: null,
    },
    estimates: [
      {
        id: "est-001002",
        estimate_number: "EST-001002",
        account_name: "Example Workspace",
        project_name: "Example Configured Item",
        revision_label: "1.0",
        region: "Default",
        status: "draft",
        workflow_stage: defaultWorkflowStepLabel,
        notes: "",
        intake_prompt: "",
        build_selections: [],
        modifiers: [],
        attachments: [],
        updated_at: "2026-03-17T17:00:00.000Z",
      },
    ],
    catalog: [
      {
        id: "item-under-running-sg",
        category: "Cranes",
        name: "Under Running SG",
        sku: "CR-UR-42D",
        description: "Roof-mount crane system for compact install footprints.",
        unit_price: 28_500,
        unit_cost: 20_100,
        lead_time_days: 42,
        uom: "EA",
        tags: ["BUN", "Roof-mount"],
      },
      {
        id: "item-inspection-plan",
        category: "Services",
        name: "Inspection Plan",
        sku: "SVC-INS-5D",
        description: "MOL-compliant annual inspection coverage.",
        unit_price: 450,
        unit_cost: 260,
        lead_time_days: 5,
        uom: "EA",
        tags: ["Compliance"],
      },
    ],
    packages: [
      {
        id: "pkg-crane-package",
        name: "Example Crane Package",
        description: "Under Running SG example package",
        discount_rate: 0.05,
        items: [{ item_id: "item-under-running-sg", quantity: 1 }],
      },
    ],
    starter_pre_configuration: createDefaultStarterPreConfiguration(),
    ui: {
      active_workflow_step_id: defaultWorkflowStepId,
      workflow_completed: false,
      active_role: "admin",
      theme_mode: "light",
    },
    active_estimate_id: "est-001002",
  };
}

/**
 * Adapts persisted UI state into the pure workflow engine runtime contract.
 */
function getWorkflowRuntimeState(workspace: CpqWorkspace): WorkflowRuntimeState {
  return {
    activeStepId: workspace.ui.active_workflow_step_id,
    workflowCompleted: workspace.ui.workflow_completed,
  };
}

/**
 * Validates an unknown payload against the shared workspace contract.
 */
export function validateCpqWorkspace(input: unknown): CpqWorkspace | null {
  const validation = CpqWorkspaceSchema.safeParse(input);
  if (!validation.success) {
    return null;
  }

  return validation.data;
}

/**
 * Finds an estimate by id and returns null for missing records.
 */
export function getEstimateById(
  workspace: CpqWorkspace,
  estimateId: string,
): Estimate | null {
  return workspace.estimates.find((estimate) => estimate.id === estimateId) ?? null;
}

/**
 * Derives workflow sections by combining example workflow definitions with the
 * persisted workflow position.
 */
export function getWorkflowSections(workspace: CpqWorkspace): WorkflowSection[] {
  return resolveWorkflowStages(
    createBaseWorkflowDefinition(),
    getWorkflowRuntimeState(workspace),
  ).map((section) => ({
    id: section.id,
    title: section.title,
    summary: section.summary,
    state: section.state,
    icon_key: section.icon_key,
    steps: section.steps.map((step) => ({
      id: step.id,
      label: step.label,
      state: step.state,
    })),
  }));
}

/**
 * Flattens workflow sections into a step list for navigation and progress.
 */
export function getWorkflowStepMetas(
  workspace: CpqWorkspace,
): WorkflowStepMeta[] {
  return getWorkflowEngineStepMetas(
    createBaseWorkflowDefinition(),
    getWorkflowRuntimeState(workspace),
  );
}

/**
 * Resolves one step meta by id so route navigation and progression controls can
 * rely on the same ordered workflow source.
 */
export function getWorkflowStepMetaById(
  workspace: CpqWorkspace,
  stepId: string,
): WorkflowStepMeta | null {
  return (
    getWorkflowEngineStepMetaById(
      createBaseWorkflowDefinition(),
      getWorkflowRuntimeState(workspace),
      stepId,
    ) ?? null
  );
}

/**
 * Returns the active workflow step, falling back to the first current step.
 */
export function getCurrentWorkflowStep(
  workspace: CpqWorkspace,
): WorkflowStepMeta | null {
  return (
    getCurrentWorkflowStepMeta(
      createBaseWorkflowDefinition(),
      getWorkflowRuntimeState(workspace),
    ) ?? null
  );
}

/**
 * Returns the next step in the example process, crossing stage boundaries when
 * needed so page-level proceed actions can act like a workflow engine.
 */
export function getNextWorkflowStep(
  workspace: CpqWorkspace,
  stepId: string = workspace.ui.active_workflow_step_id,
): WorkflowStepMeta | null {
  return (
    getNextWorkflowStepMeta(
      createBaseWorkflowDefinition(),
      getWorkflowRuntimeState(workspace),
      stepId,
    ) ?? null
  );
}

/**
 * Exposes workflow completion so routes can distinguish "final step" from
 * "example flow complete."
 */
export function isWorkflowComplete(workspace: CpqWorkspace): boolean {
  return isWorkflowEngineComplete(getWorkflowRuntimeState(workspace));
}

/**
 * Materializes build selections into line items that the routes can render.
 */
export function getEstimateLineItems(
  workspace: CpqWorkspace,
  estimateId: string,
): EstimateLineItem[] {
  const estimate = getEstimateById(workspace, estimateId);
  if (!estimate) {
    return [];
  }

  return estimate.build_selections.flatMap((selection): EstimateLineItem[] => {
    const catalogItem = workspace.catalog.find((item) => item.id === selection.item_id);
    if (!catalogItem) {
      return [];
    }

    const packageRecord = selection.package_id
      ? workspace.packages.find((pkg) => pkg.id === selection.package_id) ?? null
      : null;
    const lineSubtotal = catalogItem.unit_price * selection.quantity;
    const lineDiscount = packageRecord
      ? lineSubtotal * packageRecord.discount_rate
      : 0;
    const lineTotal = lineSubtotal - lineDiscount;
    const lineMargin = lineTotal - catalogItem.unit_cost * selection.quantity;

    return [
      {
        id: selection.id,
        item_id: catalogItem.id,
        package_id: selection.package_id,
        source: selection.source,
        sku: catalogItem.sku,
        name: catalogItem.name,
        description: catalogItem.description,
        quantity: selection.quantity,
        uom: catalogItem.uom,
        lead_time_days: catalogItem.lead_time_days,
        unit_price: catalogItem.unit_price,
        unit_cost: catalogItem.unit_cost,
        line_subtotal: lineSubtotal,
        line_discount: lineDiscount,
        line_total: lineTotal,
        line_margin: lineMargin,
        category: catalogItem.category,
      },
    ];
  });
}

/**
 * Computes configure-view totals from the current build selections.
 */
export function getEstimateTotals(
  workspace: CpqWorkspace,
  estimateId: string,
): EstimateTotals {
  const estimate = getEstimateById(workspace, estimateId);
  const lineItems = getEstimateLineItems(workspace, estimateId);

  const subtotal = lineItems.reduce(
    (runningTotal, lineItem) => runningTotal + lineItem.line_subtotal,
    0,
  );
  const packageSavings = lineItems.reduce(
    (runningTotal, lineItem) => runningTotal + lineItem.line_discount,
    0,
  );

  let modifiersTotal = 0;

  // The modifier math stays explicit so future template users can see where
  // percentage-based versus fixed adders belong.
  for (const modifier of estimate?.modifiers ?? []) {
    if (modifier === "expedited") {
      modifiersTotal += subtotal * ESTIMATE_MODIFIER_VALUES.expedited;
      continue;
    }

    modifiersTotal += ESTIMATE_MODIFIER_VALUES[modifier];
  }

  const total = subtotal - packageSavings + modifiersTotal;
  const totalMargin = lineItems.reduce(
    (runningTotal, lineItem) => runningTotal + lineItem.line_margin,
    0,
  );
  const marginPercent = total > 0 ? (totalMargin / total) * 100 : 0;
  const itemCount = lineItems.reduce(
    (runningTotal, lineItem) => runningTotal + lineItem.quantity,
    0,
  );

  return {
    subtotal,
    packageSavings,
    modifiersTotal,
    total,
    marginPercent,
    itemCount,
  };
}

/**
 * Derives the top-level dashboard metrics from the seeded workspace.
 */
export function getDashboardMetrics(workspace: CpqWorkspace): DashboardMetrics {
  const quoteCount = workspace.estimates.length;
  const opportunityCount = workspace.estimates.length;

  const totals = workspace.estimates.map((estimate) =>
    getEstimateTotals(workspace, estimate.id),
  );
  const totalValue = totals.reduce(
    (runningTotal, total) => runningTotal + total.total,
    0,
  );
  const averageMargin =
    totals.reduce((runningTotal, total) => runningTotal + total.marginPercent, 0) /
    totals.length;

  return {
    opportunityCount,
    quoteCount,
    totalValue,
    averageMargin,
  };
}

/**
 * Projects persisted estimates into the lighter dashboard list cards.
 */
export function getDashboardOpportunitySummaries(
  workspace: CpqWorkspace,
): OpportunitySummary[] {
  const probabilityByStatus: Record<EstimateStatus, number> = {
    draft: 35,
    review: 65,
    approved: 100,
  };

  return workspace.estimates.map((estimate) => ({
    id: estimate.id,
    estimate_id: estimate.id,
    name: estimate.project_name,
    kind: `${estimate.status.charAt(0).toUpperCase()}${estimate.status.slice(1)}`,
    stage: estimate.workflow_stage,
    probability: probabilityByStatus[estimate.status],
    value: getEstimateTotals(workspace, estimate.id).total,
  }));
}

/**
 * Counts completed workflow steps for progress UI.
 */
export function getWorkflowProgress(workspace: CpqWorkspace): {
  completeSteps: number;
  totalSteps: number;
  percent: number;
} {
  return getWorkflowEngineProgress(
    createBaseWorkflowDefinition(),
    getWorkflowRuntimeState(workspace),
  );
}

/**
 * Formats currency values consistently across the example CPQ workflow.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats percentages with a single decimal place for summary cards.
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Keeps the example quote code readable even before users fill every field.
 */
export function formatStarterQuoteCode(
  starterPreConfiguration: StarterPreConfiguration | undefined,
): string {
  const resolvedStarterPreConfiguration =
    starterPreConfiguration ?? createDefaultStarterPreConfiguration();
  const yearToken =
    resolvedStarterPreConfiguration.quote_year.trim().replace(/\s+/g, "") ||
    "YYYY";
  const sequenceToken =
    resolvedStarterPreConfiguration.sequence_code
      .trim()
      .replace(/\s+/g, "") || "001";

  return `EST-${yearToken}-${sequenceToken.toUpperCase()}`;
}

/**
 * Viewer mode deliberately hides price data instead of pretending the value is
 * absent, which makes the role switch meaningful during demos.
 */
export function formatPriceVisibility(
  value: number,
  role: UserRole,
): string {
  return canViewPricing(role) ? formatCurrency(value) : "Hidden";
}

/**
 * Centralized pricing visibility check keeps route logic predictable.
 */
export function canViewPricing(role: UserRole): boolean {
  return role !== "viewer";
}

/**
 * Build edits are intentionally limited to editable roles.
 */
export function canEditWorkspace(role: UserRole): boolean {
  return role === "admin" || role === "estimator";
}

/**
 * Approval remains available to approvers and admins in the example workflow.
 */
export function canApproveEstimate(role: UserRole): boolean {
  return role === "admin" || role === "approver";
}

/**
 * Stable id generator keeps new local records unique without backend support.
 */
function createWorkspaceId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

/**
 * Helper used by most immutable estimate write operations.
 */
function updateEstimateCollection(
  workspace: CpqWorkspace,
  estimateId: string,
  updateEstimate: (estimate: Estimate) => Estimate,
): CpqWorkspace {
  return {
    ...workspace,
    active_estimate_id: estimateId,
    estimates: workspace.estimates.map((estimate) =>
      estimate.id === estimateId ? updateEstimate(estimate) : estimate,
    ),
  };
}

/**
 * Updates the active workflow step and keeps the estimate stage label in sync.
 */
export function setActiveWorkflowStepInWorkspace(
  workspace: CpqWorkspace,
  stepId: string,
): CpqWorkspace {
  const nextWorkflowRuntimeState = setActiveWorkflowStepState(
    createBaseWorkflowDefinition(),
    getWorkflowRuntimeState(workspace),
    stepId,
  );
  const currentStep = getWorkflowEngineStepMetaById(
    createBaseWorkflowDefinition(),
    nextWorkflowRuntimeState,
    nextWorkflowRuntimeState.activeStepId,
  );

  if (
    !currentStep ||
    (nextWorkflowRuntimeState.activeStepId === workspace.ui.active_workflow_step_id &&
      nextWorkflowRuntimeState.workflowCompleted === workspace.ui.workflow_completed)
  ) {
    return workspace;
  }

  return {
    ...workspace,
    ui: {
      ...workspace.ui,
      active_workflow_step_id: nextWorkflowRuntimeState.activeStepId,
      workflow_completed: nextWorkflowRuntimeState.workflowCompleted,
    },
    estimates: workspace.estimates.map((estimate) =>
      estimate.id === workspace.active_estimate_id
        ? {
            ...estimate,
            workflow_stage: currentStep.stepLabel,
            updated_at: new Date().toISOString(),
          }
        : estimate,
    ),
  };
}

/**
 * Advances to the next workflow step when the workflow rail action is used.
 */
export function advanceWorkflowInWorkspace(
  workspace: CpqWorkspace,
): CpqWorkspace {
  const nextWorkflowRuntimeState = advanceWorkflowState(
    createBaseWorkflowDefinition(),
    getWorkflowRuntimeState(workspace),
  );

  if (
    nextWorkflowRuntimeState.activeStepId === workspace.ui.active_workflow_step_id &&
    nextWorkflowRuntimeState.workflowCompleted === workspace.ui.workflow_completed
  ) {
    return workspace;
  }

  const nextStep = nextWorkflowRuntimeState.workflowCompleted
    ? null
    : getWorkflowEngineStepMetaById(
        createBaseWorkflowDefinition(),
        nextWorkflowRuntimeState,
        nextWorkflowRuntimeState.activeStepId,
      );

  return {
    ...workspace,
    ui: {
      ...workspace.ui,
      active_workflow_step_id: nextWorkflowRuntimeState.activeStepId,
      workflow_completed: nextWorkflowRuntimeState.workflowCompleted,
    },
    estimates: workspace.estimates.map((estimate) =>
      estimate.id === workspace.active_estimate_id
        ? {
            ...estimate,
            workflow_stage: nextStep?.stepLabel ?? "Completed",
            updated_at: new Date().toISOString(),
          }
        : estimate,
    ),
  };
}

/**
 * Builds a fresh estimate clone with a deterministic label change.
 */
export function duplicateEstimateInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
): { workspace: CpqWorkspace; duplicatedEstimateId: string } | null {
  const estimate = getEstimateById(workspace, estimateId);
  if (!estimate) {
    return null;
  }

  const duplicatedEstimateId = `${estimate.id}-copy`;
  const duplicatedEstimate: Estimate = {
    ...estimate,
    id: duplicatedEstimateId,
    estimate_number: `${estimate.estimate_number}-COPY`,
    status: "draft",
    attachments: estimate.attachments.map((attachment) => ({
      ...attachment,
      id: `${attachment.id}-copy`,
    })),
    updated_at: new Date().toISOString(),
    build_selections: estimate.build_selections.map((selection) => ({
      ...selection,
      id: `${selection.id}-copy`,
    })),
  };

  return {
    workspace: {
      ...workspace,
      estimates: [duplicatedEstimate, ...workspace.estimates],
      active_estimate_id: duplicatedEstimateId,
    },
    duplicatedEstimateId,
  };
}

/**
 * Updates an estimate status without mutating the incoming workspace object.
 */
export function updateEstimateStatusInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  status: EstimateStatus,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    status,
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Adds a single catalog item to the requested estimate.
 */
export function addCatalogItemToEstimateInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  itemId: string,
): CpqWorkspace {
  const catalogItem = workspace.catalog.find((item) => item.id === itemId);
  if (!catalogItem) {
    return workspace;
  }

  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    build_selections: [
      ...estimate.build_selections,
      {
        id: createWorkspaceId(`sel-${itemId}`),
        item_id: itemId,
        quantity: 1,
        source: "catalog",
        package_id: null,
      },
    ],
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Adds an entire package to the requested estimate.
 */
export function addPackageToEstimateInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  packageId: string,
): CpqWorkspace {
  const packageRecord = workspace.packages.find((pkg) => pkg.id === packageId);
  if (!packageRecord) {
    return workspace;
  }

  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    build_selections: [
      ...estimate.build_selections,
      ...packageRecord.items.map((packageItem, index) => ({
        id: createWorkspaceId(`sel-${packageId}-${index}`),
        item_id: packageItem.item_id,
        quantity: packageItem.quantity,
        source: "package" as const,
        package_id: packageId,
      })),
    ],
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Updates one build selection quantity, removing it when quantity drops to 0.
 */
export function updateSelectionQuantityInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  selectionId: string,
  nextQuantity: number,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    build_selections: estimate.build_selections.flatMap((selection) => {
      if (selection.id !== selectionId) {
        return [selection];
      }

      if (nextQuantity <= 0) {
        return [];
      }

      return [
        {
          ...selection,
          quantity: nextQuantity,
        },
      ];
    }),
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Removes one build selection from the requested estimate.
 */
export function removeSelectionFromWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  selectionId: string,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    build_selections: estimate.build_selections.filter(
      (selection) => selection.id !== selectionId,
    ),
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Persists dashboard account edits inside the shared local workspace.
 */
export function updateAccountFieldInWorkspace(
  workspace: CpqWorkspace,
  field: keyof Pick<
    AccountSummary,
    "contact_person" | "email" | "phone" | "address" | "notes"
  >,
  value: string,
): CpqWorkspace {
  return {
    ...workspace,
    account: {
      ...workspace.account,
      [field]: value.trim().length > 0 ? value : null,
    },
  };
}

/**
 * Persists the narrow example pre-configuration form and mirrors the most
 * important CPQ identifiers back into the seeded account and estimate records.
 */
export function updateStarterPreConfigurationFieldInWorkspace(
  workspace: CpqWorkspace,
  field: keyof StarterPreConfiguration,
  value: string,
): CpqWorkspace {
  const nextStarterPreConfiguration: StarterPreConfiguration = {
    ...createDefaultStarterPreConfiguration(),
    ...workspace.starter_pre_configuration,
    [field]: value,
  };
  const nextCustomerName =
    nextStarterPreConfiguration.customer_name.trim() || "Example Workspace";
  const nextCollectionName =
    nextStarterPreConfiguration.collection_name.trim() || "Single-page CPQ example";
  const nextItemName =
    nextStarterPreConfiguration.item_name.trim() || "Example Configured Item";
  const nextQuoteCode = formatStarterQuoteCode(nextStarterPreConfiguration);
  const nextConfirmationNotes = nextStarterPreConfiguration.confirmation_notes;

  return {
    ...workspace,
    starter_pre_configuration: nextStarterPreConfiguration,
    account: {
      ...workspace.account,
      name: nextCustomerName,
      subtitle: nextCollectionName,
      notes: nextConfirmationNotes.trim().length > 0 ? nextConfirmationNotes : null,
    },
    estimates: workspace.estimates.map((estimate) =>
      estimate.id === workspace.active_estimate_id
        ? {
            ...estimate,
            estimate_number: nextQuoteCode,
            account_name: nextCustomerName,
            project_name: nextItemName,
            notes: nextConfirmationNotes,
            updated_at: new Date().toISOString(),
          }
        : estimate,
    ),
  };
}

/**
 * Updates the narrative estimate note shown on the workspace and quote tabs.
 */
export function updateEstimateNotesInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  notes: string,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    notes,
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Stores the intake prompt so the configure screen behaves like a working sample.
 */
export function updateEstimateIntakePromptInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  intakePrompt: string,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    intake_prompt: intakePrompt,
    updated_at: new Date().toISOString(),
  }));
}

/**
 * THIS IS SAMPLE FILE DATA ONLY. DO NOT TREAT IT AS REAL CUSTOMER CONTENT.
 */
export function addExampleAttachmentToEstimateInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    attachments: [
      {
        id: createWorkspaceId("att"),
        file_name: `example-file-${estimate.attachments.length + 1}.pdf`,
        kind: "Example Upload",
        added_at: new Date().toISOString(),
      },
      ...estimate.attachments,
    ],
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Removes an example attachment from the estimate files tab.
 */
export function removeAttachmentFromEstimateInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
  attachmentId: string,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    attachments: estimate.attachments.filter(
      (attachment) => attachment.id !== attachmentId,
    ),
    updated_at: new Date().toISOString(),
  }));
}

/**
 * THIS IS EXAMPLE-ONLY DIVISION DATA. DO NOT REUSE IT FOR REAL RECORD CREATION.
 */
export function createDivisionInWorkspace(
  workspace: CpqWorkspace,
): { workspace: CpqWorkspace; estimateId: string } {
  const nextIndex = workspace.estimates.length + 1;
  const estimateId = createWorkspaceId("est");
  const estimateNumber = `EST-${(1003 + nextIndex).toString().padStart(6, "0")}`;
  const defaultWorkflowStepId = getDefaultWorkflowStepId();
  const defaultWorkflowStepLabel = getDefaultWorkflowStepLabel();

  const nextEstimate: Estimate = {
    id: estimateId,
    estimate_number: estimateNumber,
    account_name: workspace.account.name,
    project_name: `Division ${nextIndex} Expansion`,
    revision_label: "1.0",
    region: "Default",
    status: "draft",
    workflow_stage: defaultWorkflowStepLabel,
    notes: "Example record created from the shell reset/test utilities.",
    intake_prompt: "",
    build_selections: [],
    modifiers: [],
    attachments: [],
    updated_at: new Date().toISOString(),
  };

  return {
    workspace: {
      ...workspace,
      estimates: [nextEstimate, ...workspace.estimates],
      active_estimate_id: estimateId,
      ui: {
        ...workspace.ui,
        active_workflow_step_id: defaultWorkflowStepId,
        workflow_completed: false,
      },
    },
    estimateId,
  };
}

/**
 * Tracks which estimate the shell should use for create and workflow targets.
 */
export function setActiveEstimateInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
): CpqWorkspace {
  if (!getEstimateById(workspace, estimateId)) {
    return workspace;
  }

  return {
    ...workspace,
    active_estimate_id: estimateId,
  };
}

/**
 * Updates the example role switcher used by the header.
 */
export function setActiveRoleInWorkspace(
  workspace: CpqWorkspace,
  role: UserRole,
): CpqWorkspace {
  return {
    ...workspace,
    ui: {
      ...workspace.ui,
      active_role: role,
    },
  };
}

/**
 * Toggles the shell theme directly from local state.
 */
export function toggleThemeModeInWorkspace(
  workspace: CpqWorkspace,
): CpqWorkspace {
  return {
    ...workspace,
    ui: {
      ...workspace.ui,
      theme_mode: workspace.ui.theme_mode === "light" ? "dark" : "light",
    },
  };
}
