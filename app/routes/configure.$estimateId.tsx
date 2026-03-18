import type { ReactElement } from "react";
import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ChevronRight,
  Minus,
  PackagePlus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import {
  canEditWorkspace,
  canViewPricing,
  formatCurrency,
  formatPriceVisibility,
  formatPercent,
  getEstimateById,
  getEstimateLineItems,
  getEstimateTotals,
  type CatalogItem,
} from "../lib/cpq-data";
import { cn } from "../lib/utils";
import { useCpqWorkspaceStorage } from "../utils/cpq-storage";

const configureTabs = [
  { id: "configure", label: "Configure" },
  { id: "quote", label: "Quote" },
] as const;

type ConfigureTabId = (typeof configureTabs)[number]["id"];

/**
 * Simple package card used in the configure catalog.
 */
function PackageCard({
  name,
  description,
  onAdd,
  disabled,
}: {
  name: string;
  description: string;
  onAdd: () => void;
  disabled: boolean;
}): ReactElement {
  return (
    <div className="rounded-xl border border-stone-200 bg-card px-4 py-4 dark:border-zinc-800">
      <div className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
        {name}
      </div>
      <div className="mt-2 text-sm text-stone-500 dark:text-zinc-400">
        {description}
      </div>
      <div className="mt-4">
        <Button onClick={onAdd} disabled={disabled}>
          <Plus className="h-4 w-4" />
          <span>{disabled ? "Read Only" : "Add Bundle"}</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * Catalog card used in the configure route.
 */
function CatalogItemCard({
  item,
  onAdd,
  disabled,
  pricingVisible,
}: {
  item: CatalogItem;
  onAdd: () => void;
  disabled: boolean;
  pricingVisible: boolean;
}): ReactElement {
  return (
    <div className="rounded-xl border border-stone-200 bg-card px-4 py-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
            {item.name}
          </div>
          <div className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            {item.description}
          </div>
        </div>
        <div className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          {pricingVisible ? formatCurrency(item.unit_price) : "Hidden"}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-stone-500 dark:text-zinc-400">
          {item.sku} • {item.lead_time_days}D
        </div>
        <Button onClick={onAdd} disabled={disabled}>
          <Plus className="h-4 w-4" />
          <span>{disabled ? "Read Only" : "Add"}</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * Configure route for the local-first CPQ starter.
 */
export default function ConfigureEstimatePage(): ReactElement {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const estimateId = params.estimateId ?? "";
  const activeTab = (searchParams.get("tab") as ConfigureTabId | null) ?? "configure";
  const {
    workspace,
    isHydrated,
    addCatalogItem,
    addPackage,
    updateSelectionQuantity,
    removeSelection,
    updateEstimateIntakePrompt,
  } = useCpqWorkspaceStorage();

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[720px] w-full" />
      </div>
    );
  }

  const estimate = getEstimateById(workspace, estimateId);
  const normalizedFilter = estimate?.intake_prompt.trim().toLowerCase() ?? "";
  const filteredPackages = useMemo(
    () =>
      workspace.packages.filter((packageRecord) => {
        if (!normalizedFilter) {
          return true;
        }

        const searchIndex = [packageRecord.name, packageRecord.description]
          .join(" ")
          .toLowerCase();

        return searchIndex.includes(normalizedFilter);
      }),
    [normalizedFilter, workspace.packages],
  );
  const groupedCatalog = useMemo((): Array<{ category: string; items: CatalogItem[] }> => {
    const grouped = new Map<string, CatalogItem[]>();

    for (const catalogItem of workspace.catalog) {
      const searchIndex = [
        catalogItem.category,
        catalogItem.name,
        catalogItem.description,
        catalogItem.sku,
        ...catalogItem.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (normalizedFilter && !searchIndex.includes(normalizedFilter)) {
        continue;
      }

      const existingItems = grouped.get(catalogItem.category) ?? [];
      grouped.set(catalogItem.category, [...existingItems, catalogItem]);
    }

    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [normalizedFilter, workspace.catalog]);

  if (!estimate) {
    return (
      <div className="rounded-xl border border-stone-200 bg-card px-6 py-8 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold text-stone-950 dark:text-zinc-100">
          Estimate not found
        </h1>
        <p className="mt-2 text-[15px] text-stone-500 dark:text-zinc-400">
          The mocked workspace does not contain that configure target.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link to="/">Return to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const activeRole = workspace.ui.active_role;
  const pricingVisible = canViewPricing(activeRole);
  const isEditable = canEditWorkspace(activeRole);

  const lineItems = getEstimateLineItems(workspace, estimate.id);
  const totals = getEstimateTotals(workspace, estimate.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500 dark:text-zinc-400">
        <Link to="/" className="transition-colors hover:text-stone-900 dark:hover:text-zinc-100">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          to={`/estimates/${estimate.id}`}
          className="transition-colors hover:text-stone-900 dark:hover:text-zinc-100"
        >
          {estimate.estimate_number}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-stone-700 dark:text-zinc-200">Configure</span>
      </div>

      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 dark:border-zinc-800 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <h1 className="text-[32px] font-semibold tracking-tight text-stone-950 dark:text-zinc-100">
            Configure
          </h1>
          <div className="text-[15px] text-stone-500 dark:text-zinc-400">
            {estimate.account_name} • {estimate.project_name}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {configureTabs.map((tab) => (
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
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-stone-200 bg-card px-4 py-4 dark:border-zinc-800">
            <Input
              label="Filter build options"
              value={estimate.intake_prompt}
              placeholder='Type to filter packages and catalog items, e.g. "inspection"'
              helperText="Search by application, product name, SKU, or keyword."
              onChange={(event) =>
                updateEstimateIntakePrompt(estimate.id, event.target.value)
              }
            />
          </section>

          {!isEditable && (
            <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {activeRole} role is read-only. Switch role from the header to edit the build.
            </div>
          )}

          {activeTab === "configure" && (
            <>
              <section className="space-y-4">
                <div className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
                  Packages
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredPackages.map((packageRecord) => (
                    <PackageCard
                      key={packageRecord.id}
                      name={packageRecord.name}
                      description={packageRecord.description}
                      disabled={!isEditable}
                      onAdd={() => addPackage(estimate.id, packageRecord.id)}
                    />
                  ))}
                </div>
              </section>

              {filteredPackages.length === 0 && groupedCatalog.length === 0 ? (
                <section className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
                  No build options match the current filter. Adjust the text or clear it to browse the full catalog.
                </section>
              ) : (
                groupedCatalog.map((categoryGroup) => (
                  <section key={categoryGroup.category} className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
                        {categoryGroup.category}
                      </h2>
                      <Search className="h-4 w-4 text-stone-400 dark:text-zinc-500" />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {categoryGroup.items.map((catalogItem) => (
                        <CatalogItemCard
                          key={catalogItem.id}
                          item={catalogItem}
                          disabled={!isEditable}
                          pricingVisible={pricingVisible}
                          onAdd={() => addCatalogItem(estimate.id, catalogItem.id)}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </>
          )}

          {activeTab === "quote" && (
            <section className="rounded-xl border border-stone-200 bg-card px-5 py-5 dark:border-zinc-800">
              <div className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
                Quote Summary
              </div>
              <div className="mt-4 space-y-3">
                {lineItems.map((lineItem) => (
                  <div
                    key={lineItem.id}
                    className="grid gap-3 rounded-lg border border-stone-200 px-4 py-4 dark:border-zinc-800 md:grid-cols-[minmax(0,1fr)_120px_140px]"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 dark:text-zinc-100">
                        {lineItem.name}
                      </div>
                      <div className="text-sm text-stone-500 dark:text-zinc-400">
                        {lineItem.quantity} x {lineItem.uom}
                      </div>
                    </div>
                    <div className="text-sm text-stone-600 dark:text-zinc-300">
                      Lead time: {lineItem.lead_time_days}D
                    </div>
                    <div className="text-right text-sm font-medium text-stone-900 dark:text-zinc-100">
                      {formatPriceVisibility(lineItem.line_total, activeRole)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-stone-200 bg-card dark:border-zinc-800">
            <div className="border-b border-stone-200 px-4 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xl font-semibold text-stone-950 dark:text-zinc-100">
                <ShoppingCart className="h-5 w-5" />
                <span>Build</span>
              </div>
            </div>

            <div className="space-y-3 px-4 py-4">
              {lineItems.map((lineItem) => (
                <div
                  key={lineItem.id}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-stone-950 dark:text-zinc-100">
                        {lineItem.name}
                      </div>
                      <div className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                        {lineItem.package_id ? "BUN" : lineItem.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelection(estimate.id, lineItem.id)}
                      disabled={!isEditable}
                      className="rounded-md p-1 text-stone-400 transition-colors duration-150 hover:bg-stone-200 hover:text-stone-700 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      aria-label={`Remove ${lineItem.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="inline-flex items-center rounded-md border border-stone-200 bg-card dark:border-zinc-800 dark:bg-zinc-950">
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectionQuantity(
                            estimate.id,
                            lineItem.id,
                            lineItem.quantity - 1,
                          )
                        }
                        disabled={!isEditable}
                        className="px-3 py-2 text-stone-600 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                        aria-label={`Decrease ${lineItem.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="min-w-10 border-x border-stone-200 px-3 py-2 text-center text-sm font-medium text-stone-900 dark:border-zinc-800 dark:text-zinc-100">
                        {lineItem.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectionQuantity(
                            estimate.id,
                            lineItem.id,
                            lineItem.quantity + 1,
                          )
                        }
                        disabled={!isEditable}
                        className="px-3 py-2 text-stone-600 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                        aria-label={`Increase ${lineItem.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
                        {formatPriceVisibility(lineItem.line_total, activeRole)}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-zinc-400">
                        {pricingVisible ? formatCurrency(lineItem.unit_price) : "Hidden"} each
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {lineItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
                  Add packages or products to start the build.
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 px-4 py-4 dark:border-zinc-800">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-stone-600 dark:text-zinc-300">
                  <span>Equipment</span>
                  <span>{formatPriceVisibility(totals.subtotal, activeRole)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-zinc-300">
                  <span>Bundle savings</span>
                  <span>
                    {pricingVisible ? `-${formatCurrency(totals.packageSavings)}` : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-zinc-300">
                  <span>Modifiers</span>
                  <span>{formatPriceVisibility(totals.modifiersTotal, activeRole)}</span>
                </div>
              </div>
              <div className="mt-4 border-t border-stone-200 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm text-stone-500 dark:text-zinc-400">
                  <span>Margin</span>
                  <span>{pricingVisible ? formatPercent(totals.marginPercent) : "Hidden"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xl font-semibold text-stone-950 dark:text-zinc-100">
                    Total
                  </span>
                  <span className="text-[30px] font-semibold tracking-tight text-stone-950 dark:text-zinc-100">
                    <span aria-label="Build total">
                      {formatPriceVisibility(totals.total, activeRole)}
                    </span>
                  </span>
                </div>
                <div className="mt-4">
                  <Button asChild className="w-full justify-center">
                    <Link to={`/estimates/${estimate.id}`}>
                      <PackagePlus className="h-4 w-4" />
                      <span>Continue to Quote</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
