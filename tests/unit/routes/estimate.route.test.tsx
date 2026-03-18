import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import EstimateDetailPage from "../../../app/routes/estimates.$estimateId";
import { clearCpqWorkspaceFromStorage, seedCpqWorkspaceInStorage } from "../../../app/utils/cpq-storage";

describe("estimate route", () => {
  beforeEach(() => {
    clearCpqWorkspaceFromStorage();
    seedCpqWorkspaceInStorage();
  });

  it("renders the seeded estimate workspace", async () => {
    render(
      <MemoryRouter initialEntries={["/estimates/est-001002"]}>
        <Routes>
          <Route path="/estimates/:estimateId" element={<EstimateDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "EST-001002" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/4\.0 Retro Brand Focal Walls/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Configure" })).toBeInTheDocument();
    expect(screen.getByText("Estimate workspace")).toBeInTheDocument();
  });

  it("adds a mock attachment from the files tab", async () => {
    render(
      <MemoryRouter initialEntries={["/estimates/est-001002"]}>
        <Routes>
          <Route path="/estimates/:estimateId" element={<EstimateDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "EST-001002" });

    await userEvent.click(screen.getByRole("button", { name: "Files" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Mock File" }));

    expect(await screen.findByText("mock-file-2.pdf")).toBeInTheDocument();
  });

  it("renders the submittal actions in the estimate workspace", async () => {
    render(
      <MemoryRouter initialEntries={["/estimates/est-001002?tab=submittal"]}>
        <Routes>
          <Route path="/estimates/:estimateId" element={<EstimateDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "EST-001002" });

    expect(
      screen.getByText(
        "Advance the mocked customer review milestones from the estimate workspace.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark Proposal Sent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark Customer Reviewed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark PO Received" }),
    ).toBeInTheDocument();
  });
});
