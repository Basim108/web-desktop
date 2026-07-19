import { describe, expect, it } from "vitest";
import {
  checkImportCompatibility,
  EXPORT_FORMAT_VERSION,
  parseVersion,
} from "./version";

describe("parseVersion", () => {
  it("parses a strict x.y.z string", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion("10.0.42")).toEqual({ major: 10, minor: 0, patch: 42 });
  });

  it("returns undefined for non-x.y.z strings", () => {
    expect(parseVersion("1.2")).toBeUndefined();
    expect(parseVersion("1.2.3.4")).toBeUndefined();
    expect(parseVersion("v1.2.3")).toBeUndefined();
    expect(parseVersion("1.2.x")).toBeUndefined();
    expect(parseVersion("")).toBeUndefined();
  });

  it("returns undefined for non-strings", () => {
    expect(parseVersion(undefined)).toBeUndefined();
    expect(parseVersion(null)).toBeUndefined();
    expect(parseVersion(123)).toBeUndefined();
    expect(parseVersion({ major: 1 })).toBeUndefined();
  });
});

describe("checkImportCompatibility", () => {
  const current = parseVersion(EXPORT_FORMAT_VERSION)!;

  it("accepts an equal major regardless of minor/patch", () => {
    expect(checkImportCompatibility(`${current.major}.0.0`)).toBe("ok");
    expect(checkImportCompatibility(`${current.major}.99.99`)).toBe("ok");
    expect(checkImportCompatibility(EXPORT_FORMAT_VERSION)).toBe("ok");
  });

  it("denies a lower major as too-old", () => {
    expect(checkImportCompatibility(`${current.major - 1}.9.9`)).toBe(
      "too-old",
    );
  });

  it("denies a higher major as too-new", () => {
    expect(checkImportCompatibility(`${current.major + 1}.0.0`)).toBe(
      "too-new",
    );
  });

  it("treats a missing or malformed version as invalid", () => {
    expect(checkImportCompatibility(undefined)).toBe("invalid");
    expect(checkImportCompatibility("garbage")).toBe("invalid");
    expect(checkImportCompatibility("1.0")).toBe("invalid");
    expect(checkImportCompatibility(1)).toBe("invalid");
  });
});
