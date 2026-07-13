import { describe, expect, it } from "vitest";
import { computeGridCapacity, resolveTierIconSize } from "./sizing";

describe("resolveTierIconSize", () => {
  it("returns 48px below the 1660px breakpoint", () => {
    expect(resolveTierIconSize(0)).toBe(48);
    expect(resolveTierIconSize(1659)).toBe(48);
  });

  it("returns 63px from 1660px up to (not including) 2100px", () => {
    expect(resolveTierIconSize(1660)).toBe(63);
    expect(resolveTierIconSize(2099)).toBe(63);
  });

  it("returns 100px at 2100px and wider", () => {
    expect(resolveTierIconSize(2100)).toBe(100);
    expect(resolveTierIconSize(3000)).toBe(100);
  });
});

describe("computeGridCapacity", () => {
  it("fits as many whole cells as the available space allows", () => {
    // 1000/48 = 20.8 -> 20 cols; 500/48 = 10.4 -> 10 rows
    expect(computeGridCapacity(1000, 500, 48)).toEqual({ cols: 20, rows: 10 });
  });

  it("leaves leftover space unused rather than stretching icons", () => {
    // 200/63 = 3.17 -> 3 cols, with ~11px of unused slack
    expect(computeGridCapacity(200, 63, 63)).toEqual({ cols: 3, rows: 1 });
  });

  it("never returns fewer than 1 column or row", () => {
    expect(computeGridCapacity(10, 10, 100)).toEqual({ cols: 1, rows: 1 });
  });
});
