import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  getDatabase,
  resetDatabaseConnection,
} from "../../../server/db/index.js";
import { runMigrations } from "../../../server/db/migrate.js";
import { estimates } from "../../../server/db/schemas.js";
import {
  createEstimate,
  listEstimates,
} from "../../../server/services/estimate.js";

let testDatabaseDirectoryPath = "";

/**
 * Creates an isolated sqlite file for the estimate service tests.
 */
function configureEstimateTestDatabase(): void {
  testDatabaseDirectoryPath = mkdtempSync(
    path.join(tmpdir(), "estimate-service-test-"),
  );
  process.env.E2E_DATABASE_FILE_PATH = path.join(
    testDatabaseDirectoryPath,
    "estimate-service.db",
  );
  resetDatabaseConnection();
}

/**
 * Ensures the template schema exists before service tests execute.
 */
beforeAll(async () => {
  configureEstimateTestDatabase();
  await runMigrations();
});

/**
 * Clears estimate rows between test cases for deterministic assertions.
 */
beforeEach(async () => {
  const db = getDatabase();
  await db.delete(estimates);
});

/**
 * Releases the shared sqlite connection and removes the temporary database.
 */
afterAll(() => {
  resetDatabaseConnection();
  delete process.env.E2E_DATABASE_FILE_PATH;

  if (testDatabaseDirectoryPath.length > 0) {
    rmSync(testDatabaseDirectoryPath, { recursive: true, force: true });
  }
});

describe("estimate service", () => {
  it("creates an estimate with default draft status", async () => {
    const result = await createEstimate({
      estimate_number: "EST-001002",
      account_name: "DR INC",
      project_name: "Retro Brand Focal Walls",
      workflow_stage: "Estimate Build",
      item_count: 4,
      total_value: 28640.14,
      margin_percent: 30,
      notes: "Priority account refresh",
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.estimate_number).toBe("EST-001002");
    expect(result.value.account_name).toBe("DR INC");
    expect(result.value.project_name).toBe("Retro Brand Focal Walls");
    expect(result.value.status).toBe("draft");
    expect(result.value.item_count).toBe(4);
    expect(result.value.total_value).toBe(28640.14);
  });

  it("returns a validation error for invalid create payload", async () => {
    const result = await createEstimate({
      estimate_number: "",
      account_name: "",
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error.type).toBe("VALIDATION_ERROR");
  });

  it("lists estimates with a status filter", async () => {
    await createEstimate({
      estimate_number: "EST-001002",
      account_name: "DR INC",
      project_name: "Retro Brand Focal Walls",
      status: "review",
      workflow_stage: "Estimate Build",
      item_count: 4,
      total_value: 28640.14,
      margin_percent: 30,
    });
    await createEstimate({
      estimate_number: "EST-001003",
      account_name: "DR INC",
      project_name: "Equipment Expansion",
      status: "approved",
      workflow_stage: "Proposal Delivered",
      item_count: 2,
      total_value: 52300,
      margin_percent: 28,
    });

    const reviewOnly = await listEstimates({ status: "review" });
    expect(reviewOnly.isOk()).toBe(true);

    if (reviewOnly.isErr()) {
      return;
    }

    expect(reviewOnly.value).toHaveLength(1);
    expect(reviewOnly.value[0]?.estimate_number).toBe("EST-001002");

    const db = getDatabase();
    const rows = await db
      .select()
      .from(estimates)
      .where(eq(estimates.status, "approved"));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.estimate_number).toBe("EST-001003");
  });
});
