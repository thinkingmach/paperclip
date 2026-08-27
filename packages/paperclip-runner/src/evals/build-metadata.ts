import { createHash } from "node:crypto";

import { THINKINGMACH_RUNNER_COMPATIBILITY } from "../compatibility.js";
import { PRP_PROTOCOL_NAME, PRP_PROTOCOL_VERSION } from "../protocol/replay-contract.js";
import { canonicalCapabilitySemanticCatalog } from "../semantic-tools/catalog.js";

export const THINKINGMACH_RUNNER_BUILD_METADATA_SCHEMA =
  "paperclip-runner/build-metadata/v1" as const;
export const THINKINGMACH_RUNNER_NATIVE_EXECUTION_SCHEMA =
  "paperclip-runner/native-execution/v1" as const;
export const THINKINGMACH_RUNNER_EVAL_INTEGRATION_SCHEMA =
  "paperclip-runner/evals-integration/v1" as const;
export const THINKINGMACH_RUNNERD_BUILD_METADATA_SCHEMA =
  "paperclip-runner/runnerd-build-metadata/v1" as const;

export const THINKINGMACH_RUNNER_SEMANTIC_CATALOG_SHA256 =
  `sha256:${createHash("sha256")
    .update(canonicalCapabilitySemanticCatalog())
    .digest("hex")}` as const;

/**
 * App-owned release metadata that Evals pins beside every native attempt.
 * Contract versions are independent from package semver so consumers can give
 * a precise mismatch instead of guessing from a package version.
 */
export const THINKINGMACH_RUNNER_BUILD_METADATA = Object.freeze({
  schema: THINKINGMACH_RUNNER_BUILD_METADATA_SCHEMA,
  package: Object.freeze({
    name: THINKINGMACH_RUNNER_COMPATIBILITY.packageName,
    version: THINKINGMACH_RUNNER_COMPATIBILITY.packageVersion,
  }),
  contracts: Object.freeze({
    evalIntegration: THINKINGMACH_RUNNER_COMPATIBILITY.components.evalIntegration,
    nativeExecution: THINKINGMACH_RUNNER_COMPATIBILITY.components.nativeExecution,
    runnerdArtifact: THINKINGMACH_RUNNER_COMPATIBILITY.components.runnerdBinary,
    prp: PRP_PROTOCOL_VERSION,
    semanticCatalog: THINKINGMACH_RUNNER_COMPATIBILITY.components.catalog,
    harnessDriver: THINKINGMACH_RUNNER_COMPATIBILITY.components.harnessDriver,
    controlPlaneAdapter: THINKINGMACH_RUNNER_COMPATIBILITY.components.controlPlaneAdapter,
    testkit: THINKINGMACH_RUNNER_COMPATIBILITY.components.testkit,
  }),
  prp: Object.freeze({
    name: PRP_PROTOCOL_NAME,
    minimumVersion: PRP_PROTOCOL_VERSION,
    maximumVersion: PRP_PROTOCOL_VERSION,
  }),
  semanticCatalog: Object.freeze({
    version: THINKINGMACH_RUNNER_COMPATIBILITY.components.catalog,
    sha256: THINKINGMACH_RUNNER_SEMANTIC_CATALOG_SHA256,
  }),
  runnerd: Object.freeze({
    binaryName: "paperclip-runnerd" as const,
    metadataSchema: THINKINGMACH_RUNNERD_BUILD_METADATA_SCHEMA,
    digestAlgorithm: "sha256" as const,
  }),
});

export type ThinkingMachRunnerBuildMetadata = typeof THINKINGMACH_RUNNER_BUILD_METADATA;
