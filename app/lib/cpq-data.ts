import { z } from "zod";

/**
 * Shared workflow state used across the dashboard, estimate workspace, and
 * configure experience.
 */
export const WorkflowStateSchema = z.enum(["complete", "current", "upcoming"]);

/**
 * Estimate lifecycle used by the mocked CPQ starter.
 */
export const EstimateStatusSchema = z.enum(["draft", "review", "approved"]);

/**
 * Mocked RBAC roles inspired by the CPQ bundle guidance.
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
 * Workflow step contract derived from the active mock workflow position.
 */
export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  state: WorkflowStateSchema,
});

/**
 * Workflow section contract derived from the active mock workflow position.
 */
export const WorkflowSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  state: WorkflowStateSchema,
  icon_key: z.enum([
    "capture",
    "account",
    "proposal",
    "delivery",
    "project",
  ]),
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
 * Mock attachments keep the estimate workspace file actions functional without a
 * server-backed document store.
 */
export const EstimateAttachmentSchema = z.object({
  id: z.string().min(1),
  file_name: z.string().min(1),
  kind: z.string().min(1),
  added_at: z.string(),
});

/**
 * Minimal mocked estimate contract used by the frontend template.
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
  active_role: UserRoleSchema,
  theme_mode: ThemeModeSchema,
});

/**
 * Root mocked CPQ workspace stored in localStorage.
 * Only mutable source data is persisted; workflow and dashboard summaries are
 * derived from this shape at read time.
 */
export const CpqWorkspaceSchema = z.object({
  account: AccountSummarySchema,
  estimates: z.array(EstimateSchema).min(1),
  catalog: z.array(CatalogItemSchema).min(1),
  packages: z.array(CatalogPackageSchema).min(1),
  ui: CpqUiStateSchema,
  active_estimate_id: z.string().min(1),
});

export type WorkflowState = z.infer<typeof WorkflowStateSchema>;
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
export type CpqWorkspace = z.infer<typeof CpqWorkspaceSchema>;

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
 * Flattened workflow step metadata used by the workflow rail and route actions.
 */
export interface WorkflowStepMeta {
  sectionId: string;
  sectionTitle: string;
  stepId: string;
  stepLabel: string;
  state: WorkflowState;
  stepIndex: number;
  stepCount: number;
}

/**
 * Fixed modifier values keep the local-first experience deterministic.
 */
const ESTIMATE_MODIFIER_VALUES: Record<Estimate["modifiers"][number], number> = {
  expedited: 0.08,
  freight: 1_200,
};

/**
 * Ordered workflow step ids drive summary text and route targets.
 */
const CONFIGURE_WORKFLOW_STEP_IDS = new Set<string>(["equipment-selected"]);

/**
 * Early account stages still belong on the dashboard route.
 */
const DASHBOARD_WORKFLOW_STEP_IDS = new Set<string>([
  "lead-created",
  "discovery",
  "converted",
  "account-linked",
  "region-assigned",
  "billing-info",
]);

/**
 * Defines the static workflow skeleton used by the mock process controls.
 */
function createBaseWorkflowSections(): WorkflowSection[] {
  return [
    {
      id: "lead-capture",
      title: "Lead Capture",
      summary: "Completed",
      state: "complete",
      icon_key: "capture",
      steps: [
        { id: "lead-created", label: "Lead Created", state: "complete" },
        {
          id: "discovery",
          label: "Discovery / Qualification",
          state: "complete",
        },
        {
          id: "converted",
          label: "Converted to Opportunity",
          state: "complete",
        },
      ],
    },
    {
      id: "account-opportunity",
      title: "Account & Opportunity",
      summary: "Completed",
      state: "complete",
      icon_key: "account",
      steps: [
        { id: "account-linked", label: "Account Linked", state: "complete" },
        {
          id: "region-assigned",
          label: "Region / Rep Assigned",
          state: "complete",
        },
        {
          id: "billing-info",
          label: "Billing Info Complete",
          state: "complete",
        },
      ],
    },
    {
      id: "proposal-build",
      title: "Proposal Build",
      summary: "Step 2 of 3",
      state: "current",
      icon_key: "proposal",
      steps: [
        {
          id: "equipment-selected",
          label: "Equipment Selected",
          state: "complete",
        },
        {
          id: "pricing-approved",
          label: "Pricing Approved",
          state: "current",
        },
        {
          id: "engineering-review",
          label: "Engineering Review",
          state: "upcoming",
        },
      ],
    },
    {
      id: "proposal-delivered",
      title: "Proposal Delivered",
      summary: "Upcoming",
      state: "upcoming",
      icon_key: "delivery",
      steps: [
        { id: "proposal-sent", label: "Proposal Sent", state: "upcoming" },
        {
          id: "customer-reviewed",
          label: "Customer Reviewed",
          state: "upcoming",
        },
        { id: "po-received", label: "PO Received", state: "upcoming" },
      ],
    },
    {
      id: "project-commission",
      title: "Project & Commission",
      summary: "Upcoming",
      state: "upcoming",
      icon_key: "project",
      steps: [
        { id: "project-created", label: "Project Created", state: "upcoming" },
        { id: "installed", label: "Installed", state: "upcoming" },
        {
          id: "commissioned",
          label: "Commissioned",
          state: "upcoming",
        },
      ],
    },
  ];
}

/**
 * Generates a stable seeded workspace for first-run and test seeding.
 */
export function createDefaultCpqWorkspace(): CpqWorkspace {
  return {
    account: {
      id: "acct-dr-inc",
      name: "DR INC",
      subtitle: "Account details and history",
      status: "Active",
      contact_person: "Dana Roberts",
      email: "operations@drinc.example",
      phone: "(555) 014-8821",
      address: "1480 Ridgeway Dr, Chicago, IL",
      notes: "Priority account with phased installs and regional approvals.",
    },
    estimates: [
      {
        id: "est-001002",
        estimate_number: "EST-001002",
        account_name: "DR INC",
        project_name: "Retro Brand Focal Walls",
        revision_label: "4.0",
        region: "International",
        status: "draft",
        workflow_stage: "Lead Created",
        notes: "Priority estimate for a phased lobby refresh.",
        intake_prompt: "",
        build_selections: [
          {
            id: "sel-bundle-crane-package-1",
            item_id: "item-under-running-sg",
            quantity: 1,
            source: "package",
            package_id: "pkg-crane-package",
          },
        ],
        modifiers: ["expedited", "freight"],
        attachments: [
          {
            id: "att-submittal-001",
            file_name: "submittal-package-v4.pdf",
            kind: "Submittal",
            added_at: "2026-03-17T14:15:00.000Z",
          },
        ],
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
        name: "Starter Crane Package",
        description: "Under Running SG starter package",
        discount_rate: 0.05,
        items: [{ item_id: "item-under-running-sg", quantity: 1 }],
      },
    ],
    ui: {
      active_workflow_step_id: "lead-created",
      active_role: "admin",
      theme_mode: "light",
    },
    active_estimate_id: "est-001002",
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
 * Derives workflow sections from the one persisted active step id.
 */
export function getWorkflowSections(workspace: CpqWorkspace): WorkflowSection[] {
  return buildWorkflowSections(workspace.ui.active_workflow_step_id);
}

/**
 * Flattens workflow sections into a step list for navigation and progress.
 */
export function getWorkflowStepMetas(
  workspace: CpqWorkspace,
): WorkflowStepMeta[] {
  return getWorkflowSections(workspace).flatMap((section) =>
    section.steps.map(
      (step, stepIndex): WorkflowStepMeta => ({
        sectionId: section.id,
        sectionTitle: section.title,
        stepId: step.id,
        stepLabel: step.label,
        state: step.state,
        stepIndex,
        stepCount: section.steps.length,
      }),
    ),
  );
}

/**
 * Returns the active workflow step, falling back to the first current step.
 */
export function getCurrentWorkflowStep(
  workspace: CpqWorkspace,
): WorkflowStepMeta | null {
  const steps = getWorkflowStepMetas(workspace);

  return (
    steps.find((step) => step.stepId === workspace.ui.active_workflow_step_id) ??
    steps.find((step) => step.state === "current") ??
    steps[0] ??
    null
  );
}

/**
 * Resolves which route should open when a workflow step is selected.
 */
export function getWorkflowTargetHref(
  stepId: string,
  activeEstimateId: string,
): string {
  if (DASHBOARD_WORKFLOW_STEP_IDS.has(stepId)) {
    return "/";
  }

  if (CONFIGURE_WORKFLOW_STEP_IDS.has(stepId)) {
    return `/configure/${activeEstimateId}`;
  }

  return `/estimates/${activeEstimateId}`;
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
  const allSteps = getWorkflowSections(workspace).flatMap((section) => section.steps);
  const completeSteps = allSteps.filter((step) => step.state === "complete").length;
  const totalSteps = allSteps.length;
  const percent =
    totalSteps === 0 ? 0 : Math.round((completeSteps / totalSteps) * 100);

  return {
    completeSteps,
    totalSteps,
    percent,
  };
}

/**
 * Formats currency values consistently across the mocked CPQ starter.
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
 * Approval remains available to approvers and admins in the mock workflow.
 */
export function canApproveEstimate(role: UserRole): boolean {
  return role === "admin" || role === "approver";
}

/**
 * Rebuilds section and step states around the selected step so the workflow rail
 * acts like a real process control instead of static copy.
 */
function buildWorkflowSections(activeStepId: string): WorkflowSection[] {
  const sections = createBaseWorkflowSections();
  const orderedStepIds = sections.flatMap((section) =>
    section.steps.map((step) => step.id),
  );
  const activeStepIndex = Math.max(orderedStepIds.indexOf(activeStepId), 0);

  return sections.map((section) => {
    const nextSteps = section.steps.map((step) => {
      const currentIndex = orderedStepIds.indexOf(step.id);

      if (currentIndex < activeStepIndex) {
        return { ...step, state: "complete" as const };
      }

      if (currentIndex === activeStepIndex) {
        return { ...step, state: "current" as const };
      }

      return { ...step, state: "upcoming" as const };
    });

    const completeCount = nextSteps.filter((step) => step.state === "complete").length;
    const currentIndex = nextSteps.findIndex((step) => step.state === "current");

    if (completeCount === nextSteps.length) {
      return {
        ...section,
        steps: nextSteps,
        state: "complete" as const,
        summary: "Completed",
      };
    }

    if (currentIndex >= 0) {
      return {
        ...section,
        steps: nextSteps,
        state: "current" as const,
        summary: `Step ${currentIndex + 1} of ${nextSteps.length}`,
      };
    }

    return {
      ...section,
      steps: nextSteps,
      state: "upcoming" as const,
      summary: "Upcoming",
    };
  });
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
  const currentStep = getWorkflowStepMetas({
    ...workspace,
    ui: {
      ...workspace.ui,
      active_workflow_step_id: stepId,
    },
  }).find(
    (step) => step.stepId === stepId,
  );

  return {
    ...workspace,
    ui: {
      ...workspace.ui,
      active_workflow_step_id: stepId,
    },
    estimates: workspace.estimates.map((estimate) =>
      estimate.id === workspace.active_estimate_id && currentStep
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
  const orderedSteps = getWorkflowStepMetas(workspace);
  const activeIndex = orderedSteps.findIndex(
    (step) => step.stepId === workspace.ui.active_workflow_step_id,
  );
  const nextStep = orderedSteps[Math.min(activeIndex + 1, orderedSteps.length - 1)];

  if (!nextStep) {
    return workspace;
  }

  return setActiveWorkflowStepInWorkspace(workspace, nextStep.stepId);
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
 * Stores the intake prompt so the configure screen behaves like a working mock.
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
 * Adds a mocked attachment record to the estimate files tab.
 */
export function addMockAttachmentToEstimateInWorkspace(
  workspace: CpqWorkspace,
  estimateId: string,
): CpqWorkspace {
  return updateEstimateCollection(workspace, estimateId, (estimate) => ({
    ...estimate,
    attachments: [
      {
        id: createWorkspaceId("att"),
        file_name: `mock-file-${estimate.attachments.length + 1}.pdf`,
        kind: "Mock Upload",
        added_at: new Date().toISOString(),
      },
      ...estimate.attachments,
    ],
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Removes a mocked attachment from the estimate files tab.
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
 * Creates a fresh division estimate so the dashboard CTA has a real mocked
 * outcome instead of a dead button.
 */
export function createDivisionInWorkspace(
  workspace: CpqWorkspace,
): { workspace: CpqWorkspace; estimateId: string } {
  const nextIndex = workspace.estimates.length + 1;
  const estimateId = createWorkspaceId("est");
  const estimateNumber = `EST-${(1003 + nextIndex).toString().padStart(6, "0")}`;

  const nextEstimate: Estimate = {
    id: estimateId,
    estimate_number: estimateNumber,
    account_name: workspace.account.name,
    project_name: `Division ${nextIndex} Expansion`,
    revision_label: "1.0",
    region: "International",
    status: "draft",
    workflow_stage: "Equipment Selected",
    notes: "New division created from the dashboard.",
    intake_prompt: "",
    build_selections: [],
    modifiers: ["freight"],
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
        active_workflow_step_id: "equipment-selected",
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
 * Updates the mocked role switcher used by the header.
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
