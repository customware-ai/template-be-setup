import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import IndexPage from "../../../app/routes/index";
import { clearCpqWorkspaceFromStorage, seedCpqWorkspaceInStorage } from "../../../app/utils/cpq-storage";

describe("dashboard route", () => {
  beforeEach(() => {
    clearCpqWorkspaceFromStorage();
    seedCpqWorkspaceInStorage();
  });

  it("renders the seeded DR INC dashboard", async () => {
    render(
      <MemoryRouter>
        <IndexPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "DR INC" })).toBeInTheDocument();
    expect(screen.getByText("Account details and history")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Division" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Opportunities (1)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Retro Brand Focal Walls")).toBeInTheDocument();
    expect(screen.getByText(/Lead Created • 35% probability/i)).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("edits account details and creates a new division", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/configure/:estimateId" element={<div>Configure workspace</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const contactInput = await screen.findByRole("textbox", { name: "Contact Person" });
    await userEvent.clear(contactInput);
    await userEvent.type(contactInput, "Morgan Lee");

    expect((contactInput as HTMLInputElement).value).toBe("Morgan Lee");

    await userEvent.click(screen.getByRole("button", { name: "Add Division" }));

    expect(await screen.findByText("Configure workspace")).toBeInTheDocument();
  });
});
