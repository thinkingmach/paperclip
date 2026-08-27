export const THINKINGMACH_EVAL_KERNEL_COMPATIBILITY = Object.freeze({
  schema: "paperclip.eval-kernel.compatibility.v1" as const,
  packageName: "@thinkingmach/paperclip-eval-kernel" as const,
  packageVersion: "0.1.0" as const,
  apiVersion: 1 as const,
});

export interface ThinkingMachEvalScenario<TInput = unknown> {
  readonly id: string;
  readonly input: TInput;
}

export interface ThinkingMachEvalCandidate<TCandidate = unknown> {
  readonly id: string;
  readonly config: TCandidate;
  /** Fail-closed runner/catalog/provider compatibility check. */
  readonly preflight?: () => void | Promise<void>;
}

export interface ThinkingMachEvalResult<TOutput = unknown, TScore = unknown> {
  readonly scenarioId: string;
  readonly candidateId: string;
  readonly output: TOutput;
  readonly score: TScore;
}

export class ThinkingMachEvalKernelConfigurationError extends Error {
  readonly code = "paperclip_eval_kernel_configuration_invalid" as const;

  constructor(message: string) {
    super(message);
    this.name = "ThinkingMachEvalKernelConfigurationError";
  }
}

/**
 * Generic deterministic matrix orchestration. Scenario definitions, provider
 * configuration, scorers, reports, and persistence remain caller-owned.
 */
export async function runThinkingMachEvalMatrix<
  TInput,
  TCandidate,
  TOutput,
  TScore,
>(input: {
  readonly scenarios: readonly ThinkingMachEvalScenario<TInput>[];
  readonly candidates: readonly ThinkingMachEvalCandidate<TCandidate>[];
  readonly execute: (context: {
    readonly scenario: ThinkingMachEvalScenario<TInput>;
    readonly candidate: ThinkingMachEvalCandidate<TCandidate>;
  }) => Promise<TOutput>;
  readonly score: (context: {
    readonly scenario: ThinkingMachEvalScenario<TInput>;
    readonly candidate: ThinkingMachEvalCandidate<TCandidate>;
    readonly output: TOutput;
  }) => Promise<TScore> | TScore;
}): Promise<readonly ThinkingMachEvalResult<TOutput, TScore>[]> {
  assertUniqueNonEmptyIds("scenario", input.scenarios);
  assertUniqueNonEmptyIds("candidate", input.candidates);

  for (const candidate of input.candidates) {
    await candidate.preflight?.();
  }

  const results: ThinkingMachEvalResult<TOutput, TScore>[] = [];
  for (const scenario of input.scenarios) {
    for (const candidate of input.candidates) {
      const output = await input.execute({ scenario, candidate });
      const score = await input.score({ scenario, candidate, output });
      results.push(Object.freeze({
        scenarioId: scenario.id,
        candidateId: candidate.id,
        output,
        score,
      }));
    }
  }
  return Object.freeze(results);
}

function assertUniqueNonEmptyIds(
  kind: "scenario" | "candidate",
  values: readonly { readonly id: string }[],
): void {
  if (values.length === 0) {
    throw new ThinkingMachEvalKernelConfigurationError(`${kind} list must not be empty`);
  }
  const ids = new Set<string>();
  for (const value of values) {
    if (value.id.trim().length === 0) {
      throw new ThinkingMachEvalKernelConfigurationError(`${kind} id must not be empty`);
    }
    if (ids.has(value.id)) {
      throw new ThinkingMachEvalKernelConfigurationError(`duplicate ${kind} id: ${value.id}`);
    }
    ids.add(value.id);
  }
}
