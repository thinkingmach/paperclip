# ThinkingMach Eval Kernel

`@thinkingmach/paperclip-eval-kernel` is the workspace-private, provider-neutral
matrix orchestrator owned by ThinkingMach Evals. It contains no ThinkingMach scenario
corpus, provider configuration, product fixture, scorer, or report template.

Consumers pass scenario and candidate values plus execution and scoring
callbacks. Candidate `preflight` hooks should call the runner package's
`assertThinkingMachRunnerCompatibility` before any provider work starts. This keeps
catalog, protocol, runner-client, control-plane-adapter, testkit, corpus, and
provider-operation incompatibilities explicit.

ThinkingMach App may consume this package only as a development dependency for CI
or parity tests. `@thinkingmach/paperclip-runner` has no runtime dependency on it.
