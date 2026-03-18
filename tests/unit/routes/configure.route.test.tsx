import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import ConfigureEstimatePage from "../../../app/routes/configure.$estimateId";
import { clearCpqWorkspaceFromStorage, seedCpqWorkspaceInStorage } from "../../../app/utils/cpq-storage";
import {
  addCatalogItemToEstimateInWorkspace,
  createDefaultCpqWorkspace,
  formatCurrency,
  getEstimateTotals,
} from "../../../app/lib/cpq-data";

describe("configure route", () => {
  beforeEach(() => {
    clearCpqWorkspaceFromStorage();
    seedCpqWorkspaceInStorage();
  });

  it("adds a catalog item and updates the build totals", async () => {
    const expectedTotal = formatCurrency(
      getEstimateTotals(
        addCatalogItemToEstimateInWorkspace(
          createDefaultCpqWorkspace(),
          "est-001002",
          "item-inspection-plan",
        ),
        "est-001002",
      ).total,
    );

    render(
      <MemoryRouter initialEntries={["/configure/est-001002"]}>
        <Routes>
          <Route path="/configure/:estimateId" element={<ConfigureEstimatePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Configure" })).toBeInTheDocument();

    const inspectionCard = screen.getByText("Inspection Plan").closest(".rounded-xl");

    expect(inspectionCard).not.toBeNull();

    await userEvent.click(
      within(inspectionCard as HTMLElement).getByRole("button", { name: "Add" }),
    );

    expect(await screen.findByText(expectedTotal)).toBeInTheDocument();
  });

  it("filters the catalog from the intake prompt", async () => {
    render(
      <MemoryRouter initialEntries={["/configure/est-001002"]}>
        <Routes>
          <Route path="/configure/:estimateId" element={<ConfigureEstimatePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("What do you need?")).not.toBeInTheDocument();

    const intakePrompt = await screen.findByRole("textbox", {
      name: "Filter build options",
    });

    await userEvent.clear(intakePrompt);
    await userEvent.type(intakePrompt, "starter");

    expect(await screen.findByText("Starter Crane Package")).toBeInTheDocument();
    expect(screen.queryByText("Inspection Plan")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Services" })).not.toBeInTheDocument();
  });
});
