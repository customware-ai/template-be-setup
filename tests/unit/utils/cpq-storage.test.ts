import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  CPQ_WORKSPACE_STORAGE_KEY,
  clearCpqWorkspaceFromStorage,
  useCpqWorkspaceStorage,
} from "../../../app/utils/cpq-storage";

describe("useCpqWorkspaceStorage", () => {
  beforeEach(() => {
    clearCpqWorkspaceFromStorage();
  });

  it("hydrates the seeded workspace and can add a catalog item", async () => {
    const { result } = renderHook(() => useCpqWorkspaceStorage());

    await act(async () => {
      result.current.addCatalogItem("est-001002", "item-inspection-plan");
    });

    expect(result.current.workspace.estimates).toHaveLength(1);
    expect(
      result.current.workspace.estimates[0]?.build_selections.some(
        (selection) => selection.item_id === "item-inspection-plan",
      ),
    ).toBe(true);

    const storedWorkspace = JSON.parse(
      window.localStorage.getItem(CPQ_WORKSPACE_STORAGE_KEY) ?? "null",
    ) as { estimates: Array<{ build_selections: Array<{ item_id: string }> }> };

    expect(
      storedWorkspace.estimates[0]?.build_selections.some(
        (selection) => selection.item_id === "item-inspection-plan",
      ),
    ).toBe(true);
  });

  it("duplicates an estimate into a new draft record", async () => {
    const { result } = renderHook(() => useCpqWorkspaceStorage());

    let duplicatedEstimateId: string | null = null;

    await act(async () => {
      duplicatedEstimateId = result.current.duplicateEstimate("est-001002");
    });

    expect(duplicatedEstimateId).toBe("est-001002-copy");
    expect(result.current.workspace.estimates).toHaveLength(2);
    expect(result.current.workspace.estimates[0]?.status).toBe("draft");
  });

  it("updates workflow and theme state", async () => {
    const { result } = renderHook(() => useCpqWorkspaceStorage());

    await act(async () => {
      result.current.setActiveWorkflowStep("proposal-sent");
      result.current.toggleThemeMode();
    });

    expect(result.current.workspace.ui.active_workflow_step_id).toBe("proposal-sent");
    expect(result.current.workspace.ui.theme_mode).toBe("dark");
  });

  it("creates a new mocked division and returns its estimate id", async () => {
    const { result } = renderHook(() => useCpqWorkspaceStorage());

    let estimateId = "";

    await act(async () => {
      estimateId = result.current.createDivision();
    });

    expect(estimateId).toContain("est-");
    expect(result.current.workspace.estimates[0]?.id).toBe(estimateId);
  });
});
