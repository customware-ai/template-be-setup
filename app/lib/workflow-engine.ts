/**
 * Pure workflow state used by the shell and any future backend-backed
 * workflow implementation. The engine owns only ordering and progression, not
 * persistence.
 */
export type WorkflowState = "complete" | "current" | "upcoming";

/**
 * Minimal workflow step contract that any data source can provide to the
 * engine. Extra page-specific data can live alongside these required fields.
 */
export interface WorkflowStepDefinition {
  id: string;
  label: string;
}

/**
 * Minimal workflow stage contract that groups ordered workflow steps. The
 * engine preserves any extra fields from the source object.
 */
export interface WorkflowStageDefinition<
  TStep extends WorkflowStepDefinition = WorkflowStepDefinition,
> {
  id: string;
  title: string;
  steps: readonly TStep[];
}

/**
 * Runtime workflow position tracked by whatever owns persistence today.
 */
export interface WorkflowRuntimeState {
  activeStepId: string;
  workflowCompleted: boolean;
}

/**
 * Resolved step with a computed runtime state.
 */
export type WorkflowResolvedStep<
  TStep extends WorkflowStepDefinition = WorkflowStepDefinition,
> = TStep & {
  state: WorkflowState;
};

/**
 * Resolved stage with a computed runtime state and summary label.
 */
export type WorkflowResolvedStage<
  TStage extends WorkflowStageDefinition = WorkflowStageDefinition,
> = Omit<TStage, "steps"> & {
  summary: string;
  state: WorkflowState;
  steps: Array<WorkflowResolvedStep<TStage["steps"][number]>>;
};

/**
 * Flattened step metadata used by navigation, route resolution, and proceed
 * actions.
 */
export interface WorkflowStepMeta<
  TStep extends WorkflowStepDefinition = WorkflowStepDefinition,
> {
  sectionId: string;
  sectionTitle: string;
  stepId: string;
  stepLabel: string;
  state: WorkflowState;
  stepIndex: number;
  stepCount: number;
  step: TStep;
}

/**
 * Progress summary derived from the resolved workflow state.
 */
export interface WorkflowProgress {
  completeSteps: number;
  totalSteps: number;
  percent: number;
}

/**
 * Reads the first step id so storage layers do not need to hardcode seeded
 * workflow ids.
 */
export function getFirstWorkflowStepId<
  TStage extends WorkflowStageDefinition,
>(stages: readonly TStage[]): string | null {
  return stages[0]?.steps[0]?.id ?? null;
}

/**
 * Resolves an invalid active step back to the first available step so the
 * engine can tolerate stale stored state while staying deterministic.
 */
function getResolvedActiveStepId<TStage extends WorkflowStageDefinition>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
): string | null {
  const orderedStepIds = stages.flatMap((stage) => stage.steps.map((step) => step.id));

  if (orderedStepIds.length === 0) {
    return null;
  }

  if (orderedStepIds.includes(runtimeState.activeStepId)) {
    return runtimeState.activeStepId;
  }

  return orderedStepIds[0] ?? null;
}

/**
 * Resolves stages and steps around the current runtime state while preserving
 * any extra stage fields provided by the data source.
 */
export function resolveWorkflowStages<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
): Array<WorkflowResolvedStage<TStage>> {
  if (stages.length === 0) {
    return [];
  }

  if (runtimeState.workflowCompleted) {
    return stages.map((stage) => ({
      ...stage,
      summary: "Completed",
      state: "complete",
      steps: stage.steps.map((step) => ({
        ...step,
        state: "complete",
      })),
    }));
  }

  const orderedStepIds = stages.flatMap((stage) => stage.steps.map((step) => step.id));
  const activeStepId = getResolvedActiveStepId(stages, runtimeState);
  const activeStepIndex = Math.max(orderedStepIds.indexOf(activeStepId ?? ""), 0);

  return stages.map((stage) => {
    // Compute each step state in global order so advancing across stages stays
    // consistent regardless of where the data is stored.
    const resolvedSteps = stage.steps.map((step) => {
      const stepIndex = orderedStepIds.indexOf(step.id);

      if (stepIndex < activeStepIndex) {
        return {
          ...step,
          state: "complete" as const,
        };
      }

      if (stepIndex === activeStepIndex) {
        return {
          ...step,
          state: "current" as const,
        };
      }

      return {
        ...step,
        state: "upcoming" as const,
      };
    });

    const completeCount = resolvedSteps.filter(
      (step) => step.state === "complete",
    ).length;
    const currentIndex = resolvedSteps.findIndex(
      (step) => step.state === "current",
    );

    if (completeCount === resolvedSteps.length) {
      return {
        ...stage,
        summary: "Completed",
        state: "complete" as const,
        steps: resolvedSteps,
      };
    }

    if (currentIndex >= 0) {
      return {
        ...stage,
        summary: `Step ${currentIndex + 1} of ${resolvedSteps.length}`,
        state: "current" as const,
        steps: resolvedSteps,
      };
    }

    return {
      ...stage,
      summary: "Upcoming",
      state: "upcoming" as const,
      steps: resolvedSteps,
    };
  });
}

/**
 * Flattens resolved stages into ordered step metadata for navigation and next
 * step lookup.
 */
export function getWorkflowStepMetas<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
): Array<WorkflowStepMeta<TStage["steps"][number]>> {
  return resolveWorkflowStages(stages, runtimeState).flatMap((stage) =>
    stage.steps.map(
      (step, stepIndex): WorkflowStepMeta<TStage["steps"][number]> => ({
        sectionId: stage.id,
        sectionTitle: stage.title,
        stepId: step.id,
        stepLabel: step.label,
        state: step.state,
        stepIndex,
        stepCount: stage.steps.length,
        step,
      }),
    ),
  );
}

/**
 * Resolves one step metadata record by id.
 */
export function getWorkflowStepMetaById<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
  stepId: string,
): WorkflowStepMeta<TStage["steps"][number]> | null {
  return (
    getWorkflowStepMetas(stages, runtimeState).find(
      (step) => step.stepId === stepId,
    ) ?? null
  );
}

/**
 * Resolves the current step from the runtime state, with a fallback to the
 * first current or first defined step.
 */
export function getCurrentWorkflowStepMeta<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
): WorkflowStepMeta<TStage["steps"][number]> | null {
  const steps = getWorkflowStepMetas(stages, runtimeState);

  return (
    steps.find((step) => step.stepId === runtimeState.activeStepId) ??
    steps.find((step) => step.state === "current") ??
    steps[0] ??
    null
  );
}

/**
 * Resolves the next step in the ordered flow, including when the next step
 * crosses a stage boundary.
 */
export function getNextWorkflowStepMeta<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
  stepId: string = runtimeState.activeStepId,
): WorkflowStepMeta<TStage["steps"][number]> | null {
  const steps = getWorkflowStepMetas(stages, runtimeState);
  const currentIndex = steps.findIndex((step) => step.stepId === stepId);

  if (currentIndex < 0 || currentIndex >= steps.length - 1) {
    return null;
  }

  return steps[currentIndex + 1] ?? null;
}

/**
 * Reports whether the runtime state is already marked complete.
 */
export function isWorkflowComplete(
  runtimeState: WorkflowRuntimeState,
): boolean {
  return runtimeState.workflowCompleted;
}

/**
 * Derives completion counts and percent from the current resolved stages.
 */
export function getWorkflowProgress<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
): WorkflowProgress {
  const allSteps = resolveWorkflowStages(stages, runtimeState).flatMap(
    (stage) => stage.steps,
  );
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
 * Moves the runtime state to a selected step if that step exists in the
 * definition, and always clears completion when navigating explicitly.
 */
export function setActiveWorkflowStep<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
  stepId: string,
): WorkflowRuntimeState {
  if (!getWorkflowStepMetaById(stages, { ...runtimeState, workflowCompleted: false }, stepId)) {
    return runtimeState;
  }

  return {
    activeStepId: stepId,
    workflowCompleted: false,
  };
}

/**
 * Advances the runtime state to the next ordered step, or marks the workflow
 * complete when the current step is the final one.
 */
export function advanceWorkflow<
  TStage extends WorkflowStageDefinition,
>(
  stages: readonly TStage[],
  runtimeState: WorkflowRuntimeState,
): WorkflowRuntimeState {
  if (runtimeState.workflowCompleted) {
    return runtimeState;
  }

  const nextStep = getNextWorkflowStepMeta(stages, runtimeState);

  if (nextStep) {
    return {
      activeStepId: nextStep.stepId,
      workflowCompleted: false,
    };
  }

  return {
    ...runtimeState,
    workflowCompleted: true,
  };
}
