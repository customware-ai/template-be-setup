import type { ChangeEvent, ReactElement } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import { Textarea } from "../components/ui/Textarea";
import {
  getDashboardOpportunitySummaries,
  formatCurrency,
  formatPercent,
  getDashboardMetrics,
} from "../lib/cpq-data";
import { useCpqWorkspaceStorage } from "../utils/cpq-storage";

interface AccountFieldConfig {
  field: "contact_person" | "email" | "phone" | "address";
  label: string;
  placeholder: string;
  icon: ReactElement;
  type?: "email" | "tel" | "text";
}

const accountFields: AccountFieldConfig[] = [
  {
    field: "contact_person",
    label: "Contact Person",
    placeholder: "Add contact",
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    field: "email",
    label: "Email",
    placeholder: "Add email",
    icon: <Mail className="h-4 w-4" />,
    type: "email",
  },
  {
    field: "phone",
    label: "Phone",
    placeholder: "Add phone",
    icon: <Phone className="h-4 w-4" />,
    type: "tel",
  },
  {
    field: "address",
    label: "Address",
    placeholder: "Add address",
    icon: <MapPin className="h-4 w-4" />,
  },
];

/**
 * Dashboard route for the seeded account workflow view.
 */
export default function IndexPage(): ReactElement {
  const navigate = useNavigate();
  const {
    workspace,
    isHydrated,
    createDivision,
    setActiveEstimate,
    updateAccountField,
  } = useCpqWorkspaceStorage();

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const metrics = getDashboardMetrics(workspace);
  const opportunitySummaries = getDashboardOpportunitySummaries(workspace);

  /**
   * The dashboard fields write through immediately so the mock feels like a real
   * local-first app rather than a static read-only card.
   */
  const handleAccountFieldChange = (
    field: AccountFieldConfig["field"],
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    updateAccountField(field, event.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
        <span>Accounts</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-stone-700 dark:text-stone-200">
          {workspace.account.name}
        </span>
      </div>

      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-start md:justify-between dark:border-stone-800">
        <div className="space-y-3">
          <div className="text-sm font-medium text-stone-600 dark:text-stone-300">
            Accounts
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="mt-1 h-6 w-6 text-stone-400 dark:text-stone-500" />
            <div>
              <h1 className="text-[32px] font-semibold tracking-tight text-stone-950 dark:text-stone-100">
                {workspace.account.name}
              </h1>
              <p className="mt-1 text-[15px] text-stone-500 dark:text-stone-400">
                {workspace.account.subtitle}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="min-w-[150px] justify-center"
          onClick={() => {
            const estimateId = createDivision();
            void navigate(`/configure/${estimateId}`);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Division</span>
        </Button>
      </div>

      <section className="rounded-xl border border-stone-200 bg-card dark:border-stone-800">
        <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {workspace.account.status}
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 lg:grid-cols-2">
          {accountFields.map((field) => (
            <div key={field.field} className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-300">
                <span className="text-stone-400 dark:text-stone-500">
                  {field.icon}
                </span>
                <span>{field.label}</span>
              </div>
              <Input
                type={field.type ?? "text"}
                value={workspace.account[field.field] ?? ""}
                placeholder={field.placeholder}
                aria-label={field.label}
                onChange={(event) => handleAccountFieldChange(field.field, event)}
              />
            </div>
          ))}
        </div>

        <div className="border-t border-stone-200 px-5 py-4 dark:border-stone-800">
          <Textarea
            label="Notes"
            value={workspace.account.notes ?? ""}
            placeholder="Add account notes"
            onChange={(event) => updateAccountField("notes", event.target.value)}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-card px-5 py-5 dark:border-stone-800">
          <div className="text-3xl font-semibold text-stone-950 dark:text-stone-100">
            {metrics.opportunityCount}
          </div>
          <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Opportunities
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-card px-5 py-5 dark:border-stone-800">
          <div className="text-3xl font-semibold text-stone-950 dark:text-stone-100">
            {metrics.quoteCount}
          </div>
          <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Quotes
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-card px-5 py-5 dark:border-stone-800">
          <div className="text-3xl font-semibold text-stone-950 dark:text-stone-100">
            {formatCurrency(metrics.totalValue)}
          </div>
          <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Total Value
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-card px-5 py-5 dark:border-stone-800">
          <div className="text-3xl font-semibold text-stone-950 dark:text-stone-100">
            {formatPercent(metrics.averageMargin)}
          </div>
          <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Avg Margin
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-card dark:border-stone-800">
        <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-stone-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-stone-500 dark:text-stone-400" />
            <h2 className="text-2xl font-semibold text-stone-950 dark:text-stone-100">
              Opportunities ({opportunitySummaries.length})
            </h2>
          </div>
          <Button
            onClick={() => {
              const estimateId = createDivision();
              void navigate(`/configure/${estimateId}`);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>New Opportunity</span>
          </Button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {opportunitySummaries.map((opportunity) => (
            <Link
              key={opportunity.id}
              to={`/estimates/${opportunity.estimate_id}`}
              onClick={() => setActiveEstimate(opportunity.estimate_id)}
              className="flex flex-col gap-3 rounded-lg border border-stone-200 px-4 py-4 transition-colors duration-150 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-semibold text-stone-950 dark:text-stone-100">
                    {opportunity.name}
                  </span>
                  <span className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
                    {opportunity.kind}
                  </span>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    {opportunity.stage} • {opportunity.probability}% probability
                  </span>
                </div>
              </div>
              <div className="text-xl font-semibold text-stone-950 dark:text-stone-100">
                {formatCurrency(opportunity.value)}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
