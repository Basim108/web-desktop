import { describe, expect, it } from "vitest";
import { isValidFolderName } from "./validation";

describe("isValidFolderName", () => {
  it("accepts a normal name", () => {
    expect(isValidFolderName("Work")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidFolderName("")).toBe(false);
  });

  it("rejects a whitespace-only string", () => {
    expect(isValidFolderName("   \t\n")).toBe(false);
  });

  it("accepts a name with surrounding whitespace but real content", () => {
    expect(isValidFolderName("  Work  ")).toBe(true);
  });
});
