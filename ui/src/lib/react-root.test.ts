import { describe, expect, it, vi } from "vitest";
import type { Root } from "react-dom/client";
import {
  getOrCreateThinkingMachReactRoot,
  type ThinkingMachReactRootHost,
} from "./react-root";

describe("getOrCreateThinkingMachReactRoot", () => {
  it("reuses the existing root when the entry module runs again", () => {
    const host: ThinkingMachReactRootHost = {};
    const container = {} as Parameters<typeof getOrCreateThinkingMachReactRoot>[1];
    const root = { render: vi.fn(), unmount: vi.fn() } as unknown as Root;
    const createRoot = vi.fn(() => root);

    expect(getOrCreateThinkingMachReactRoot(host, container, createRoot)).toBe(root);
    expect(getOrCreateThinkingMachReactRoot(host, container, createRoot)).toBe(root);
    expect(createRoot).toHaveBeenCalledTimes(1);
    expect(createRoot).toHaveBeenCalledWith(container);
  });
});
