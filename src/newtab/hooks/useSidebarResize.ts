import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  getSidebarWidth,
  setSidebarWidth,
} from "../../lib/storage/sidebarSettings";

/** Viewport-width breakpoints for the sidebar's max-width tiers. */
const LARGE_BREAKPOINT = 1024;
const ULTRA_LARGE_BREAKPOINT = 1920;

const SMALL_MEDIUM_MAX_WIDTH = 212;
const LARGE_MAX_WIDTH = 512;
const ULTRA_LARGE_MAX_WIDTH = 1024;

/** Maps a viewport width to the sidebar's max-width cap for that tier. */
export function getMaxWidthForViewport(viewportWidth: number): number {
  if (viewportWidth < LARGE_BREAKPOINT) {
    return SMALL_MEDIUM_MAX_WIDTH;
  }
  if (viewportWidth < ULTRA_LARGE_BREAKPOINT) {
    return LARGE_MAX_WIDTH;
  }
  return ULTRA_LARGE_MAX_WIDTH;
}

/**
 * Drag-to-resize for the sidebar's right border. `preferredWidth` is the
 * user's chosen width (persisted once per drag, on release). The rendered
 * `width` is derived by clamping that preference to the current viewport
 * tier's max, so a window resize never overwrites the stored preference —
 * only an explicit drag does. Growing the window back into a tier whose
 * cap covers the original preference restores it automatically, since
 * `width` is recomputed from `preferredWidth` on every render rather than
 * synced into its own state.
 */
export function useSidebarResize(viewportWidth: number): {
  width: number;
  isDragging: boolean;
  startDrag: (event: React.PointerEvent<HTMLElement>) => void;
} {
  const [preferredWidth, setPreferredWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );
  const preferredWidthRef = useRef(preferredWidth);

  useEffect(() => {
    preferredWidthRef.current = preferredWidth;
  }, [preferredWidth]);

  useEffect(() => {
    let cancelled = false;
    void getSidebarWidth().then((stored) => {
      if (!cancelled) {
        setPreferredWidth(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxWidth = getMaxWidthForViewport(viewportWidth);
  const width = Math.min(maxWidth, Math.max(MIN_SIDEBAR_WIDTH, preferredWidth));

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const dragStart = dragStartRef.current;
      if (!dragStart) {
        return;
      }
      const delta = event.clientX - dragStart.startX;
      setPreferredWidth(
        Math.min(
          maxWidth,
          Math.max(MIN_SIDEBAR_WIDTH, dragStart.startWidth + delta),
        ),
      );
    }

    function endDrag() {
      dragStartRef.current = null;
      setIsDragging(false);
      void setSidebarWidth(preferredWidthRef.current);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [isDragging, maxWidth]);

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStartRef.current = {
      startX: event.clientX,
      startWidth: width,
    };
    setIsDragging(true);
  }

  return { width, isDragging, startDrag };
}
