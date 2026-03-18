import type { ReactElement } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  FileText,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Textarea } from "../components/ui/Textarea";
import {
  canApproveEstimate,
  canViewPricing,
  formatCurrency,
  formatPriceVisibility,
  getEstimateById,
  getEstimateLineItems,
  getEstimateTotals,
  type CpqWorkspace,
} from "../lib/cpq-data";
import { cn } from "../lib/utils";
import { useCpqWorkspaceStorage } from "../utils/cpq-storage";

const estimateTabs = [
  { id: "items-bom", label: "Items & BOM" },
  { id: "bid-form", label: "Bid Form" },
  { id: "submittal", label: "Submittal" },
  { id: "files", label: "Files" },
] as const;

type EstimateTabId = (typeof estimateTabs)[number]["id"];

/**
 * Downloads a mock export so the action behaves like a real CPQ workspace.
 */
function exportEstimate(workspace: CpqWorkspace, estimateId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const estimate = getEstimateById(workspace, estimateId);
  if (!estimate) {
    return;
  }

  const payload = JSON.stringify(
    {
      estimate,
      lineItems: getEstimateLineItems(workspace, estimateId),
      totals: getEstimateTotals(workspace, estimateId),
    },
    null,
    2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${estimate.estimate_number.toLowerCase()}-export.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Estimate workspace route that mirrors the more detailed CPQ review surface.
 */
export default function EstimateDetailPage(): ReactElement {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const estimateId = params.estimateId ?? "";
  const activeTab = (searchParams.get("tab") as EstimateTabId | null) ?? "items-bom";
  const {
    workspace,
    isHydrated,
    duplicateEstimate,
    updateEstimateStatus,
    updateEstimateNotes,
    addMockAttachment,
    removeAttachment,
    setActiveWorkflowStep,
  } = useCpqWorkspaceStorage();

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const estimate = getEstimateById(workspace, estimateId);

  if (!estimate) {
    return (
      <div className="rounded-xl border border-stone-200 bg-card px-6 py-8 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold text-stone-950 dark:text-zinc-100">
          Estimate not found
        </h1>
        <p className="mt-2 text-[15px] text-stone-500 dark:text-zinc-400">
          The mocked workspace does not contain that estimate.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link to="/">Return to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const lineItems = getEstimateLineItems(workspace, estimate.id);
  const totals = getEstimateTotals(workspace, estimate.id);
  const activeRole = workspace.ui.active_role;
  const pricingVisible = canViewPricing(activeRole);
  const canApprove = canApproveEstimate(activeRole);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 dark:border-zinc-800 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors duration-150 hover:text-stone-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[34px] font-semibold tracking-tight text-stone-950 dark:text-zinc-100">
              {estimate.estimate_number}
            </h1>
            <div className="rounded-md border border-stone-200 bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {estimate.status}
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              {estimate.region}
            </div>
          </div>

          <div className="text-lg text-stone-600 dark:text-zinc-300">
            {estimate.revision_label} {estimate.project_name}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSearchParams({ tab: "submittal" })}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Workflow</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const duplicatedEstimateId = duplicateEstimate(estimate.id);
              if (duplicatedEstimateId) {
                void navigate(`/estimates/${duplicatedEstimateId}`);
              }
            }}
          >
            <Copy className="h-4 w-4" />
            <span>Duplicate</span>
          </Button>
          <Button
            onClick={() => updateEstimateStatus(estimate.id, "approved")}
            disabled={!canApprove || estimate.status === "approved"}
          >
            <span>
              {estimate.status === "approved"
                ? "Approved"
                : canApprove
                  ? "Approve"
                  : "Approval Role Required"}
            </span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 pb-3 text-sm dark:border-zinc-800">
        {estimateTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSearchParams({ tab: tab.id })}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors duration-150",
              tab.id === activeTab
                ? "border border-stone-200 bg-card font-medium text-stone-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-stone-200 bg-card dark:border-zinc-800">
        <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950 dark:text-zinc-100">
              Estimate workspace
            </h2>
            <p className="mt-1 text-[15px] text-stone-500 dark:text-zinc-400">
              {estimate.notes || "Use the bid form tab to add estimate guidance."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportEstimate(workspace, estimate.id)}
            >
              <FileText className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button asChild>
              <Link to={`/configure/${estimate.id}`}>
                <Tags className="h-4 w-4" />
                <span>Open Configure</span>
              </Link>
            </Button>
          </div>
        </div>

        {activeTab === "items-bom" && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-sm text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="px-5 py-3 font-medium">Item #</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Specs</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 font-medium">UOM</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((lineItem) => (
                    <tr
                      key={lineItem.id}
                      className="border-b border-stone-100 align-top dark:border-zinc-900"
                    >
                      <td className="px-5 py-4 text-sm text-stone-600 dark:text-zinc-300">
                        {lineItem.sku}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-stone-900 dark:text-zinc-100">
                          {lineItem.name}
                        </div>
                        <div className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
                          {lineItem.description}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-600 dark:text-zinc-300">
                        Follow drawing schedule • {lineItem.lead_time_days} day lead
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-700 dark:text-zinc-200">
                        {lineItem.quantity}
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-700 dark:text-zinc-200">
                        {lineItem.uom}
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-700 dark:text-zinc-200">
                        {lineItem.package_id ? "BOM" : "Direct"}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-stone-900 dark:text-zinc-100">
                        {formatPriceVisibility(lineItem.line_total, activeRole)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 border-t border-stone-200 px-5 py-4 dark:border-zinc-800 md:grid-cols-3">
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-sm text-stone-500 dark:text-zinc-400">
                  Item count
                </div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-zinc-100">
                  {totals.itemCount}
                </div>
              </div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-sm text-stone-500 dark:text-zinc-400">
                  Package savings
                </div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-zinc-100">
                  {pricingVisible ? formatCurrency(totals.packageSavings) : "Hidden"}
                </div>
              </div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-sm text-stone-500 dark:text-zinc-400">
                  Total
                </div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-zinc-100">
                  {formatPriceVisibility(totals.total, activeRole)}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "bid-form" && (
          <div className="space-y-4 px-5 py-5">
            <Textarea
              label="Bid narrative"
              value={estimate.notes}
              placeholder="Add scope notes for the quote package"
              onChange={(event) => updateEstimateNotes(estimate.id, event.target.value)}
            />
            <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Current total: {formatPriceVisibility(totals.total, activeRole)}
            </div>
          </div>
        )}

        {activeTab === "submittal" && (
          <div className="space-y-4 px-5 py-5">
            <div className="text-sm text-stone-500 dark:text-zinc-400">
              Advance the mocked customer review milestones from the estimate workspace.
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              { stepId: "proposal-sent", label: "Mark Proposal Sent" },
              { stepId: "customer-reviewed", label: "Mark Customer Reviewed" },
              { stepId: "po-received", label: "Mark PO Received" },
            ].map((step) => (
              <Button
                key={step.stepId}
                className="h-12 w-full justify-start rounded-xl px-4"
                variant={
                  workspace.ui.active_workflow_step_id === step.stepId
                    ? "default"
                    : "outline"
                }
                onClick={() => setActiveWorkflowStep(step.stepId)}
              >
                <ClipboardList className="h-4 w-4" />
                <span>{step.label}</span>
              </Button>
            ))}
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="space-y-4 px-5 py-5">
            <Button onClick={() => addMockAttachment(estimate.id)}>
              <Plus className="h-4 w-4" />
              <span>Add Mock File</span>
            </Button>

            <div className="space-y-3">
              {estimate.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div>
                    <div className="font-medium text-stone-900 dark:text-zinc-100">
                      {attachment.file_name}
                    </div>
                    <div className="text-sm text-stone-500 dark:text-zinc-400">
                      {attachment.kind}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeAttachment(estimate.id, attachment.id)}
                    aria-label={`Remove ${attachment.file_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
