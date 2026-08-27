import { describe, expect, it } from "vitest";
import { sanitizeInheritedThinkingMachEnv } from "./server-utils.js";

describe("sanitizeInheritedThinkingMachEnv", () => {
  it("drops the host-only ThinkingMach CLI command pointer", () => {
    expect(sanitizeInheritedThinkingMachEnv({
      THINKINGMACH_CMD: "node /missing/thinkingmach/dist/index.js",
      THINKINGMACH_RUNTIME_API_URL: "http://127.0.0.1:3100",
      PATH: "/usr/bin",
    })).toEqual({
      THINKINGMACH_RUNTIME_API_URL: "http://127.0.0.1:3100",
      PATH: "/usr/bin",
    });
  });
});
