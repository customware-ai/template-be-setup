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

  it("hydrates the neutral workspace and persists starter fields", async () => {
    const { result } = renderHook(() => useCpqWorkspaceStorage());

    await act(async () => {
      result.current.updateStarterPreConfigurationField("primary_label", "Workspace");
      result.current.updateStarterPreConfigurationField("secondary_label", "Context");
      result.current.updateStarterPreConfigurationField("reference_year", "2026");
      result.current.updateStarterPreConfigurationField("reference_sequence", "014");
      result.current.updateStarterPreConfigurationField("item_label", "Item");
    });

    expect(result.current.workspace.starter_pre_configuration.primary_label).toBe(
      "Workspace",
    );
    expect(result.current.workspace.estimates[0]?.estimate_number).toBe(
      "REF-2026-014",
    );

    const storedWorkspace = JSON.parse(
      window.localStorage.getItem(CPQ_WORKSPACE_STORAGE_KEY) ?? "null",
    ) as {
      starter_pre_configuration: {
        primary_label: string;
        reference_sequence: string;
      };
      estimates: Array<{ estimate_number: string }>;
    };

    expect(storedWorkspace.starter_pre_configuration.primary_label).toBe(
      "Workspace",
    );
    expect(storedWorkspace.estimates[0]?.estimate_number).toBe("REF-2026-014");
  });

  it("advances workflow state across the neutral two-step shell", async () => {
    const { result } = renderHook(() => useCpqWorkspaceStorage());

    await act(async () => {
      result.current.advanceWorkflow();
      result.current.advanceWorkflow();
      result.current.toggleThemeMode();
    });

    expect(result.current.workspace.ui.active_workflow_step_id).toBe("step-2");
    expect(result.current.workspace.ui.workflow_completed).toBe(true);
    expect(result.current.workspace.ui.theme_mode).toBe("dark");
  });

  it("creates a new workspace division and returns its estimate id", async () => {
    const { result } = renderHook(() => useCpqWorkspaceStorage());

    let estimateId = "";

    await act(async () => {
      estimateId = result.current.createDivision();
    });

    expect(estimateId).toContain("est-");
    expect(result.current.workspace.estimates[0]?.id).toBe(estimateId);
  });
});
