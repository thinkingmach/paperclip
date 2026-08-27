import { describe, expect, it } from "vitest";
import { encodeEnvValue, updateEnvFileContents } from "./env-file.js";

describe("env file editor", () => {
  it("pins minimal and JSON value encoding", () => {
    expect(encodeEnvValue("plain-value", "minimal")).toBe("plain-value");
    expect(encodeEnvValue("#439edb", "minimal")).toBe('"#439edb"');
    expect(encodeEnvValue("plain-value", "json")).toBe('"plain-value"');
  });

  it("preserves unrelated content and CRLF while updating every stale duplicate", () => {
    const original = [
      "# operator comment",
      "UNKNOWN='keep this encoding'",
      "",
      "export THINKINGMACH_HOME = '/old path'  # managed path",
      "THINKINGMACH_DUPLICATE=stale",
      'THINKINGMACH_DUPLICATE="current"',
      "TRAILING=untouched",
      "",
    ].join("\r\n");

    const updated = updateEnvFileContents(
      original,
      {
        THINKINGMACH_HOME: "/new path",
        THINKINGMACH_DUPLICATE: "current",
        THINKINGMACH_WORKTREE_COLOR: "#439edb",
      },
      { valueEncoding: "minimal" },
    );

    expect(updated).toBe([
      "# operator comment",
      "UNKNOWN='keep this encoding'",
      "",
      'export THINKINGMACH_HOME = "/new path"  # managed path',
      "THINKINGMACH_DUPLICATE=current",
      'THINKINGMACH_DUPLICATE="current"',
      "TRAILING=untouched",
      'THINKINGMACH_WORKTREE_COLOR="#439edb"',
      "",
    ].join("\r\n"));
    expect(updated.replaceAll("\r\n", "")).not.toContain("\n");
  });

  it("uses JSON encoding for changed values without re-encoding current assignments", () => {
    const original = [
      "THINKINGMACH_CURRENT=plain-value",
      "THINKINGMACH_CHANGED=old",
      "UNKNOWN=\"operator value\"",
      "",
    ].join("\n");

    expect(
      updateEnvFileContents(
        original,
        {
          THINKINGMACH_CURRENT: "plain-value",
          THINKINGMACH_CHANGED: "new",
          THINKINGMACH_ADDED: "added",
        },
        { valueEncoding: "json" },
      ),
    ).toBe([
      "THINKINGMACH_CURRENT=plain-value",
      'THINKINGMACH_CHANGED="new"',
      'UNKNOWN="operator value"',
      'THINKINGMACH_ADDED="added"',
      "",
    ].join("\n"));
  });

  it("does not treat an unquoted dotenv comment as the managed value", () => {
    expect(
      updateEnvFileContents(
        ["THINKINGMACH_COLOR=#439edb", "THINKINGMACH_HOME=old# keep this comment"].join("\n"),
        {
          THINKINGMACH_COLOR: "#439edb",
          THINKINGMACH_HOME: "new",
        },
        { valueEncoding: "minimal" },
      ),
    ).toBe(
      ['THINKINGMACH_COLOR="#439edb"#439edb', "THINKINGMACH_HOME=new# keep this comment"].join("\n"),
    );
  });

  it("is a no-op when every managed duplicate is already current", () => {
    const original = [
      "export THINKINGMACH_HOME = '/same path' # first",
      'THINKINGMACH_HOME="/same path"',
      "UNKNOWN=value",
    ].join("\n");

    expect(updateEnvFileContents(original, { THINKINGMACH_HOME: "/same path" })).toBe(original);
  });
});
