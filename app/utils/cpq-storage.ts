import { useEffect, useMemo, useState } from "react";
import {
  addCatalogItemToEstimateInWorkspace,
  addExampleAttachmentToEstimateInWorkspace,
  addPackageToEstimateInWorkspace,
  advanceWorkflowInWorkspace,
  createDefaultCpqWorkspace,
  createDivisionInWorkspace,
  CpqWorkspaceSchema,
  duplicateEstimateInWorkspace,
  getDefaultWorkflowStepId,
  removeAttachmentFromEstimateInWorkspace,
  removeSelectionFromWorkspace,
  setActiveEstimateInWorkspace,
  setActiveWorkflowStepInWorkspace,
  toggleThemeModeInWorkspace,
  type AccountSummary,
  type CpqWorkspace,
  type EstimateStatus,
  type StarterPreConfiguration,
  type UserRole,
  updateAccountFieldInWorkspace,
  updateEstimateIntakePromptInWorkspace,
  updateEstimateNotesInWorkspace,
  updateStarterPreConfigurationFieldInWorkspace,
  updateEstimateStatusInWorkspace,
  updateSelectionQuantityInWorkspace,
} from "../lib/cpq-data";
import {
  clearLocalStorageKey,
  useLocalStorage,
} from "../hooks/use-local-storage";

/**
 * Storage key used for the local CPQ workspace.
 */
export const CPQ_WORKSPACE_STORAGE_KEY = "cohesiv_cpq_workspace";

/**
 * Stable workspace reference used during hydration.
 */
const DEFAULT_CPQ_WORKSPACE = createDefaultCpqWorkspace();
let rolePreviewOverride: UserRole | null = null;
const rolePreviewListeners = new Set<(role: UserRole | null) => void>();

function normalizeWorkspaceShape(workspace: CpqWorkspace): CpqWorkspace {
  const defaultWorkflowStepId = getDefaultWorkflowStepId();
  const normalizedWorkflowStepId =
    workspace.ui.active_workflow_step_id === "customer-collection"
      ? "step-1"
      : workspace.ui.active_workflow_step_id === "quote-identity"
        ? "step-2"
        : workspace.ui.active_workflow_step_id === "scope-review" ||
            workspace.ui.active_workflow_step_id === "starter-scope"
          ? "step-2"
          : workspace.ui.active_workflow_step_id || defaultWorkflowStepId;

  return {
    ...workspace,
    starter_pre_configuration: {
      primary_label: workspace.starter_pre_configuration.primary_label ?? "",
      secondary_label:
        workspace.starter_pre_configuration.secondary_label ?? "",
      reference_year: workspace.starter_pre_configuration.reference_year ?? "",
      reference_sequence:
        workspace.starter_pre_configuration.reference_sequence ?? "",
      item_label: workspace.starter_pre_configuration.item_label ?? "",
    },
    ui: {
      active_workflow_step_id: normalizedWorkflowStepId,
      workflow_completed: workspace.ui.workflow_completed ?? false,
      active_role: workspace.ui.active_role,
      theme_mode: workspace.ui.theme_mode,
    },
  };
}

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
 * Shared hook contract for the local-first CPQ shell.
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
  addExampleAttachment: (estimateId: string) => void;
  removeAttachment: (estimateId: string, attachmentId: string) => void;
  updateAccountField: (
    field: keyof Pick<
      AccountSummary,
      "contact_person" | "email" | "phone" | "address" | "notes"
    >,
    value: string,
  ) => void;
  updateStarterPreConfigurationField: (
    field: keyof StarterPreConfiguration,
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
  const normalizedWorkspace = useMemo<CpqWorkspace>(
    () => normalizeWorkspaceShape(workspace),
    [workspace],
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
      ...normalizedWorkspace,
      ui: {
        ...normalizedWorkspace.ui,
        active_role:
          activeRolePreview ?? normalizedWorkspace.ui.active_role,
      },
    }),
    [activeRolePreview, normalizedWorkspace],
  );

  /**
   * Re-validates workspace writes so routes cannot bypass the shared schema.
   */
  const replaceWorkspace = (nextWorkspace: CpqWorkspace): void => {
    const validation = CpqWorkspaceSchema.safeParse(
      normalizeWorkspaceShape(nextWorkspace),
    );
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
      const nextWorkspace = updateWorkspace(
        normalizeWorkspaceShape(currentWorkspace),
      );
      const validation = CpqWorkspaceSchema.safeParse(
        normalizeWorkspaceShape(nextWorkspace),
      );

      return validation.success ? validation.data : currentWorkspace;
    });
  };

  /**
   * Restores the default workspace.
   *
   * This is a development and test helper for the workspace, not a
   * product requirement for the eventual backend-backed CPQ app.
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
   * Adds a workspace file record to the selected estimate.
   */
  const addExampleAttachment = (estimateId: string): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      addExampleAttachmentToEstimateInWorkspace(currentWorkspace, estimateId),
    );
  };

  /**
   * Removes a workspace file record from the selected estimate.
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
   * Persists the shell CPQ inputs that power the single-page template.
   */
  const updateStarterPreConfigurationField = (
    field: keyof StarterPreConfiguration,
    value: string,
  ): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      updateStarterPreConfigurationFieldInWorkspace(
        currentWorkspace,
        field,
        value,
      ),
    );
  };

  /**
   * Creates a new workspace division/opportunity pair and returns its estimate id.
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
   * Advances the workflow to the next step.
   */
  const advanceWorkflow = (): void => {
    commitWorkspaceUpdate((currentWorkspace) =>
      advanceWorkflowInWorkspace(currentWorkspace),
    );
  };

  /**
   * Updates the active role for RBAC previews without persisting it.
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
    addExampleAttachment,
    removeAttachment,
    updateAccountField,
    updateStarterPreConfigurationField,
    createDivision,
    setActiveEstimate,
    setActiveWorkflowStep,
    advanceWorkflow,
    setActiveRole,
    toggleThemeMode,
  };
}
