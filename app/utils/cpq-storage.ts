import { useEffect, useMemo, useState } from "react";
import {
  addCatalogItemToEstimateInWorkspace,
  addMockAttachmentToEstimateInWorkspace,
  addPackageToEstimateInWorkspace,
  advanceWorkflowInWorkspace,
  createDefaultCpqWorkspace,
  createDivisionInWorkspace,
  CpqWorkspaceSchema,
  duplicateEstimateInWorkspace,
  removeAttachmentFromEstimateInWorkspace,
  removeSelectionFromWorkspace,
  setActiveEstimateInWorkspace,
  setActiveWorkflowStepInWorkspace,
  toggleThemeModeInWorkspace,
  type AccountSummary,
  type CpqWorkspace,
  type EstimateStatus,
  type UserRole,
  updateAccountFieldInWorkspace,
  updateEstimateIntakePromptInWorkspace,
  updateEstimateNotesInWorkspace,
  updateEstimateStatusInWorkspace,
  updateSelectionQuantityInWorkspace,
} from "../lib/cpq-data";
import {
  clearLocalStorageKey,
  useLocalStorage,
} from "../hooks/use-local-storage";

/**
 * Storage key used for the seeded CPQ workspace.
 */
export const CPQ_WORKSPACE_STORAGE_KEY = "cohesiv_cpq_workspace";

/**
 * Stable seeded workspace reference used during hydration.
 */
const DEFAULT_CPQ_WORKSPACE = createDefaultCpqWorkspace();
let rolePreviewOverride: UserRole | null = null;
const rolePreviewListeners = new Set<(role: UserRole | null) => void>();

/**
 * Shares the in-memory role preview across routes without persisting it.
 */
function setRolePreviewOverride(role: UserRole | null): void {
  rolePreviewOverride = role;

  for (const listener of rolePreviewListeners) {
    listener(rolePreviewOverride);
  }
}

/**
 * Subscribes hook instances so role preview changes stay in sync.
 */
function subscribeToRolePreview(
  listener: (role: UserRole | null) => void,
): () => void {
  rolePreviewListeners.add(listener);

  return (): void => {
    rolePreviewListeners.delete(listener);
  };
}

/**
 * Shared hook contract for the local-first CPQ starter.
 */
interface UseCpqWorkspaceStorageResult {
  workspace: CpqWorkspace;
  isHydrated: boolean;
  replaceWorkspace: (workspace: CpqWorkspace) => void;
  resetWorkspace: () => void;
  duplicateEstimate: (estimateId: string) => string | null;
  updateEstimateStatus: (estimateId: string, status: EstimateStatus) => void;
  updateEstimateNotes: (estimateId: string, notes: string) => void;
  updateEstimateIntakePrompt: (estimateId: string, intakePrompt: string) => void;
  addCatalogItem: (estimateId: string, itemId: string) => void;
  addPackage: (estimateId: string, packageId: string) => void;
  updateSelectionQuantity: (
    estimateId: string,
    selectionId: string,
    quantity: number,
  ) => void;
  removeSelection: (estimateId: string, selectionId: string) => void;
  addMockAttachment: (estimateId: string) => void;
  removeAttachment: (estimateId: string, attachmentId: string) => void;
  updateAccountField: (
    field: keyof Pick<
      AccountSummary,
      "contact_person" | "email" | "phone" | "address" | "notes"
    >,
    value: string,
  ) => void;
  createDivision: () => string;
  setActiveEstimate: (estimateId: string) => void;
  setActiveWorkflowStep: (stepId: string) => void;
  advanceWorkflow: () => void;
  setActiveRole: (role: UserRole) => void;
  toggleThemeMode: () => void;
}

/**
 * Clears the CPQ workspace from localStorage.
 */
export function clearCpqWorkspaceFromStorage(): void {
  setRolePreviewOverride(null);
  clearLocalStorageKey(CPQ_WORKSPACE_STORAGE_KEY);
}

/**
 * Seeds the CPQ workspace into localStorage for browser tests.
 */
export function seedCpqWorkspaceInStorage(workspace?: CpqWorkspace): void {
  if (typeof window === "undefined") {
    return;
  }

  const value = workspace ?? createDefaultCpqWorkspace();
  window.localStorage.setItem(
    CPQ_WORKSPACE_STORAGE_KEY,
    JSON.stringify(value),
  );
}

/**
 * Wraps the generic localStorage hook with CPQ-specific validation and actions.
 */
export function useCpqWorkspaceStorage(): UseCpqWorkspaceStorageResult {
  const [workspace, setWorkspace, isHydrated] = useLocalStorage(
    CPQ_WORKSPACE_STORAGE_KEY,
    DEFAULT_CPQ_WORKSPACE,
  );
  const [activeRolePreview, setActiveRolePreview] = useState<UserRole | null>(
    rolePreviewOverride,
  );

  /**
   * A preview role should follow the live shell in-memory, but should never be
   * written into the persisted workspace payload.
   */
  useEffect(() => subscribeToRolePreview(setActiveRolePreview), []);

  /**
   * Consumers should read the preview role when present so route permissions
   * update immediately without mutating local storage.
   */
  const workspaceWithRolePreview = useMemo<CpqWorkspace>(
    () => ({
      ...workspace,
      ui: {
        ...workspace.ui,
        active_role: activeRolePreview ?? workspace.ui.active_role,
      },
    }),
    [activeRolePreview, workspace],
  );

  /**
   * Re-validates workspace writes so routes cannot bypass the shared schema.
   */
  const replaceWorkspace = (nextWorkspace: CpqWorkspace): void => {
    const validation = CpqWorkspaceSchema.safeParse(nextWorkspace);
    if (!validation.success) {
      return;
    }

    setWorkspace(validation.data);
  };

  /**
   * Functional updates keep sequential actions in the same event from closing
   * over stale workspace snapshots.
   */
  const commitWorkspaceUpdate = (
    updateWorkspace: (currentWorkspace: CpqWorkspace) => CpqWorkspace,
  ): void => {
    setWorkspace((currentWorkspace) => {
      const nextWorkspace = updateWorkspace(currentWorkspace);
      const validation = CpqWorkspaceSchema.safeParse(nextWorkspace);

      return validation.success ? validation.data : currentWorkspace;
    });
  };

  /**
   * Restores the default seeded workspace.
   */
  const resetWorkspace = (): void => {
    setRolePreviewOverride(null);
    replaceWorkspace(createDefaultCpqWorkspace());
  };

  /**
   * Clones the requested estimate and returns the new estimate id.
   */
  const duplicateEstimate = (estimateId: string): string | null => {
    let duplicatedEstimateId: string | null = null;

    commitWorkspaceUpdate((currentWorkspace) => {
      const duplication = duplicateEstimateInWorkspace(currentWorkspace, estimateId);
      duplicatedEstimateId = duplication?.duplicatedEstimateId ?? null;

      return duplication?.workspace ?? currentWorkspace;
    });

    return duplicatedEstimateId;
  };

  /**
   * Updates one estimate status in local storage.
   */
  const updateEstimateStatus = (
    estimateId: string,
    status: EstimateStatus,
  ): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      updateEstimateStatusInWorkspace(currentWorkspace, estimateId, status),
    );
  };

  /**
   * Updates the estimate narrative note from workspace tabs.
   */
  const updateEstimateNotes = (estimateId: string, notes: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      updateEstimateNotesInWorkspace(currentWorkspace, estimateId, notes),
    );
  };

  /**
   * Updates the configure intake prompt text.
   */
  const updateEstimateIntakePrompt = (
    estimateId: string,
    intakePrompt: string,
  ): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      updateEstimateIntakePromptInWorkspace(
        currentWorkspace,
        estimateId,
        intakePrompt,
      ),
    );
  };

  /**
   * Adds a single catalog item to an estimate.
   */
  const addCatalogItem = (estimateId: string, itemId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      addCatalogItemToEstimateInWorkspace(currentWorkspace, estimateId, itemId),
    );
  };

  /**
   * Adds a full package to an estimate.
   */
  const addPackage = (estimateId: string, packageId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      addPackageToEstimateInWorkspace(currentWorkspace, estimateId, packageId),
    );
  };

  /**
   * Changes a selection quantity while keeping all writes immutable.
   */
  const updateSelectionQuantity = (
    estimateId: string,
    selectionId: string,
    quantity: number,
  ): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      updateSelectionQuantityInWorkspace(
        currentWorkspace,
        estimateId,
        selectionId,
        quantity,
      ),
    );
  };

  /**
   * Removes a selection from the estimate build.
   */
  const removeSelection = (estimateId: string, selectionId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      removeSelectionFromWorkspace(currentWorkspace, estimateId, selectionId),
    );
  };

  /**
   * Adds a mock file record to the selected estimate.
   */
  const addMockAttachment = (estimateId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      addMockAttachmentToEstimateInWorkspace(currentWorkspace, estimateId),
    );
  };

  /**
   * Removes a mock file record from the selected estimate.
   */
  const removeAttachment = (estimateId: string, attachmentId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      removeAttachmentFromEstimateInWorkspace(
        currentWorkspace,
        estimateId,
        attachmentId,
      ),
    );
  };

  /**
   * Persists dashboard account edits.
   */
  const updateAccountField = (
    field: keyof Pick<
      AccountSummary,
      "contact_person" | "email" | "phone" | "address" | "notes"
    >,
    value: string,
  ): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      updateAccountFieldInWorkspace(currentWorkspace, field, value),
    );
  };

  /**
   * Creates a new mocked division/opportunity pair and returns its estimate id.
   */
  const createDivision = (): string => {
    let createdEstimateId = "";

    commitWorkspaceUpdate((currentWorkspace) => {
      const creation = createDivisionInWorkspace(currentWorkspace);
      createdEstimateId = creation.estimateId;

      return creation.workspace;
    });

    return createdEstimateId;
  };

  /**
   * Tracks which estimate the shell should treat as active.
   */
  const setActiveEstimate = (estimateId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      setActiveEstimateInWorkspace(currentWorkspace, estimateId),
    );
  };

  /**
   * Allows workflow navigation from the left rail and route actions.
   */
  const setActiveWorkflowStep = (stepId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      setActiveWorkflowStepInWorkspace(currentWorkspace, stepId),
    );
  };

  /**
   * Advances the mocked workflow to the next step.
   */
  const advanceWorkflow = (): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      advanceWorkflowInWorkspace(currentWorkspace),
    );
  };

  /**
   * Updates the active demo role for RBAC previews without persisting it.
   */
  const setActiveRole = (role: UserRole): void => {
    setRolePreviewOverride(role);
  };

  /**
   * Persists theme toggles from the shell.
   */
  const toggleThemeMode = (): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      toggleThemeModeInWorkspace(currentWorkspace),
    );
  };

  return {
    workspace: workspaceWithRolePreview,
    isHydrated,
    replaceWorkspace,
    resetWorkspace,
    duplicateEstimate,
    updateEstimateStatus,
    updateEstimateNotes,
    updateEstimateIntakePrompt,
    addCatalogItem,
    addPackage,
    updateSelectionQuantity,
    removeSelection,
    addMockAttachment,
    removeAttachment,
    updateAccountField,
    createDivision,
    setActiveEstimate,
    setActiveWorkflowStep,
    advanceWorkflow,
    setActiveRole,
    toggleThemeMode,
  };
}
