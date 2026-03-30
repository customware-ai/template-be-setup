import { describe, expect, it } from "vitest";
import {
  advanceWorkflow,
  getCurrentWorkflowStepMeta,
  getFirstWorkflowStepId,
  getNextWorkflowStepMeta,
  getWorkflowProgress,
  resolveWorkflowStages,
  setActiveWorkflowStep,
  type WorkflowRuntimeState,
  type WorkflowStageDefinition,
} from "../../../app/lib/workflow-engine";

interface TestWorkflowStep {
  id: string;
  label: string;
}

interface TestWorkflowStage extends WorkflowStageDefinition<TestWorkflowStep> {
  icon_key: "capture";
}

const TEST_WORKFLOW_STAGES: TestWorkflowStage[] = [
  {
    id: "pre-configuration",
    title: "Pre-Configuration",
    icon_key: "capture",
    steps: [
      {
        id: "step-1",
        label: "Primary Details",
      },
      {
        id: "step-2",
        label: "Reference Details",
      },
    ],
  },
];

describe("workflow-engine", () => {
  it("derives workflow sections and step states from plain workflow data", () => {
    const runtimeState: WorkflowRuntimeState = {
      activeStepId: "step-2",
      workflowCompleted: false,
    };

    const resolvedStages = resolveWorkflowStages(
      TEST_WORKFLOW_STAGES,
      runtimeState,
    );

    expect(getFirstWorkflowStepId(TEST_WORKFLOW_STAGES)).toBe("step-1");
    expect(resolvedStages[0]).toMatchObject({
      id: "pre-configuration",
      icon_key: "capture",
      summary: "Step 2 of 2",
      state: "current",
    });
    expect(resolvedStages[0]?.steps.map((step) => step.state)).toEqual([
      "complete",
      "current",
    ]);
  });

  it("advances within the stage and marks the workflow complete on the final step", () => {
    let runtimeState: WorkflowRuntimeState = {
      activeStepId: "step-1",
      workflowCompleted: false,
    };

    runtimeState = advanceWorkflow(TEST_WORKFLOW_STAGES, runtimeState);
    expect(runtimeState).toEqual({
      activeStepId: "step-2",
      workflowCompleted: false,
    });
    expect(
      getCurrentWorkflowStepMeta(TEST_WORKFLOW_STAGES, runtimeState)?.stepLabel,
    ).toBe("Reference Details");
    expect(getNextWorkflowStepMeta(TEST_WORKFLOW_STAGES, runtimeState)).toBeNull();

    runtimeState = advanceWorkflow(TEST_WORKFLOW_STAGES, runtimeState);
    expect(runtimeState).toEqual({
      activeStepId: "step-2",
      workflowCompleted: true,
    });
    expect(getWorkflowProgress(TEST_WORKFLOW_STAGES, runtimeState)).toEqual({
      completeSteps: 2,
      totalSteps: 2,
      percent: 100,
    });
  });

  it("clears completion when selecting a valid step and ignores unknown steps", () => {
    const completedState: WorkflowRuntimeState = {
      activeStepId: "step-2",
      workflowCompleted: true,
    };

    expect(
      setActiveWorkflowStep(TEST_WORKFLOW_STAGES, completedState, "step-1"),
    ).toEqual({
      activeStepId: "step-1",
      workflowCompleted: false,
    });
    expect(
      setActiveWorkflowStep(TEST_WORKFLOW_STAGES, completedState, "missing-step"),
    ).toEqual(completedState);
  });
});
