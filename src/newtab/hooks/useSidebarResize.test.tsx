import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import {
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  getSidebarWidth,
} from "../../lib/storage/sidebarSettings";
import { getMaxWidthForViewport, useSidebarResize } from "./useSidebarResize";

const mock = installChromeMock();

beforeEach(() => {
  mock.reset();
});

/** Ultra-large tier (max 1024) by default, so existing min/drag tests aren't constrained by the max. */
function TestHandle({ viewportWidth = 2000 }: { viewportWidth?: number }) {
  const { width, isDragging, startDrag } = useSidebarResize(viewportWidth);
  return (
    <div
      data-testid="handle"
      data-dragging={isDragging}
      onPointerDown={startDrag}
    >
      {width}
    </div>
  );
}

describe("getMaxWidthForViewport", () => {
  it("returns 212 below the 1024px breakpoint", () => {
    expect(getMaxWidthForViewport(0)).toBe(212);
    expect(getMaxWidthForViewport(1023)).toBe(212);
  });

  it("returns 512 from 1024px up to (not including) 1920px", () => {
    expect(getMaxWidthForViewport(1024)).toBe(512);
    expect(getMaxWidthForViewport(1919)).toBe(512);
  });

  it("returns 1024 at 1920px and above", () => {
    expect(getMaxWidthForViewport(1920)).toBe(1024);
    expect(getMaxWidthForViewport(4000)).toBe(1024);
  });
});

describe("useSidebarResize", () => {
  it("starts at the default width", async () => {
    render(<TestHandle />);
    await waitFor(() => {
      expect(screen.getByTestId("handle")).toHaveTextContent(
        String(DEFAULT_SIDEBAR_WIDTH),
      );
    });
  });

  it("follows the pointer while dragging and persists the width on release", async () => {
    render(<TestHandle />);
    const handle = await screen.findByTestId("handle");
    await waitFor(() =>
      expect(handle).toHaveTextContent(String(DEFAULT_SIDEBAR_WIDTH)),
    );

    fireEvent.pointerDown(handle, { clientX: 240 });
    expect(handle).toHaveAttribute("data-dragging", "true");

    fireEvent.pointerMove(window, { clientX: 290 });
    expect(handle).toHaveTextContent(String(DEFAULT_SIDEBAR_WIDTH + 50));

    fireEvent.pointerUp(window);
    expect(handle).toHaveAttribute("data-dragging", "false");

    await waitFor(async () => {
      expect(await getSidebarWidth()).toBe(DEFAULT_SIDEBAR_WIDTH + 50);
    });
  });

  it("clamps the width to the minimum while dragging past it", async () => {
    render(<TestHandle />);
    const handle = await screen.findByTestId("handle");
    await waitFor(() =>
      expect(handle).toHaveTextContent(String(DEFAULT_SIDEBAR_WIDTH)),
    );

    fireEvent.pointerDown(handle, { clientX: 240 });
    fireEvent.pointerMove(window, { clientX: -1000 });
    expect(handle).toHaveTextContent(String(MIN_SIDEBAR_WIDTH));

    fireEvent.pointerUp(window);
    await waitFor(async () => {
      expect(await getSidebarWidth()).toBe(MIN_SIDEBAR_WIDTH);
    });
  });

  it("clamps dragging to the current viewport tier's maximum", async () => {
    render(<TestHandle viewportWidth={800} />);
    const handle = await screen.findByTestId("handle");
    // Default width (240) already exceeds this tier's 212px cap, so the
    // very first render is already clamped.
    await waitFor(() => expect(handle).toHaveTextContent("212"));

    fireEvent.pointerDown(handle, { clientX: 240 });
    fireEvent.pointerMove(window, { clientX: 5000 });
    expect(handle).toHaveTextContent("212");

    fireEvent.pointerUp(window);
    await waitFor(async () => {
      expect(await getSidebarWidth()).toBe(212);
    });
  });

  it("live re-clamps on shrink without persisting, then restores the preferred width on grow-back", async () => {
    const { rerender } = render(<TestHandle viewportWidth={2000} />);
    const handle = await screen.findByTestId("handle");
    await waitFor(() =>
      expect(handle).toHaveTextContent(String(DEFAULT_SIDEBAR_WIDTH)),
    );

    fireEvent.pointerDown(handle, { clientX: 240 });
    fireEvent.pointerMove(window, { clientX: 900 });
    expect(handle).toHaveTextContent("900");
    fireEvent.pointerUp(window);
    await waitFor(async () => {
      expect(await getSidebarWidth()).toBe(900);
    });

    // Shrink the viewport into the small/medium tier (same component
    // instance, no remount) — the displayed width re-clamps live.
    rerender(<TestHandle viewportWidth={800} />);
    expect(handle).toHaveTextContent("212");
    // The clamp is viewport-driven, not a drag, so the stored preference
    // must be untouched.
    expect(await getSidebarWidth()).toBe(900);

    // Grow the viewport back out — the original preference is restored
    // without any further drag.
    rerender(<TestHandle viewportWidth={2000} />);
    expect(handle).toHaveTextContent("900");
  });

  it("clamps the stored preference to the current tier immediately on mount", async () => {
    await mock.chrome.storage.local.set({ sidebarWidth: 900 });

    render(<TestHandle viewportWidth={800} />);
    await waitFor(() => {
      expect(screen.getByTestId("handle")).toHaveTextContent("212");
    });
  });
});
