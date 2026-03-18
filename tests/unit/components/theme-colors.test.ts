import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reads the shared application stylesheet so the theme contract can be tested
 * without depending on browser-specific CSS module behavior in Vitest.
 */
function readAppStylesheet(): string {
  return readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");
}

describe("application theme stylesheet", () => {
  it("keeps the dark palette on neutral graphite tones", () => {
    const stylesheet = readAppStylesheet();

    expect(stylesheet).toContain("--background: hsl(240 6% 10%);");
    expect(stylesheet).toContain("--card: hsl(240 5% 14%);");
    expect(stylesheet).toContain("--secondary: hsl(240 4% 18%);");
    expect(stylesheet).toContain("--border: hsl(240 4% 24%);");
    expect(stylesheet).toContain("--sidebar: hsl(240 6% 11%);");

    expect(stylesheet).not.toContain("--background: hsl(30 9% 10%);");
    expect(stylesheet).not.toContain("--card: hsl(28 10% 14%);");
    expect(stylesheet).not.toContain("--sidebar: hsl(28 9% 12%);");
  });
});
