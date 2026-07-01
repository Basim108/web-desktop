import { vi } from "vitest";

interface RegisteredObserver {
  callback: ResizeObserverCallback;
  elements: Set<Element>;
}

/**
 * jsdom doesn't implement ResizeObserver. This installs a controllable
 * fake so tests can manually trigger a size change for a specific
 * observed element, exercising the same code path a real browser resize
 * would.
 */
export function installResizeObserverMock() {
  const registry = new Set<RegisteredObserver>();

  class MockResizeObserver implements ResizeObserver {
    private entry: RegisteredObserver = {
      callback: () => {},
      elements: new Set(),
    };

    constructor(callback: ResizeObserverCallback) {
      this.entry.callback = callback;
      registry.add(this.entry);
    }
    observe(element: Element) {
      this.entry.elements.add(element);
    }
    unobserve(element: Element) {
      this.entry.elements.delete(element);
    }
    disconnect() {
      registry.delete(this.entry);
    }
  }

  vi.stubGlobal("ResizeObserver", MockResizeObserver);

  return {
    trigger(element: Element, size: { width: number; height: number }) {
      const fakeEntry = {
        target: element,
        contentRect: size,
      } as ResizeObserverEntry;
      for (const observer of registry) {
        if (observer.elements.has(element)) {
          observer.callback([fakeEntry], observer as unknown as ResizeObserver);
        }
      }
    },
    reset() {
      registry.clear();
    },
  };
}
