# CLI Reference

ThinkingMach CLI now supports both:

- installation and lifecycle management (`install`, `uninstall`, `update`, `upgrade`, `service`)
- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`, `env-lab`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Security: safe invocation for content-bearing arguments

Use `npx thinkingmach` for any command whose argument can hold untrusted or
semi-trusted content. Untrusted content includes issue text, comment bodies,
Markdown, pasted snippets, and model output. `npx` runs the CLI binary directly.
It passes the argument as an inert `argv` value. It does not run a shell over the
value. `npx thinkingmach` works on any machine with Node: it runs a local install
of the `thinkingmach` package, and it fetches the published package when no local
install is present.

Do not use `pnpm thinkingmach` for a content-bearing argument. `pnpm thinkingmach`
is a `package.json` script. `pnpm` builds a `/bin/sh` command string and appends
the argument to it, so the shell reads the argument first. The shell interprets
these spans before the CLI starts:

- command substitution: a backtick pair or `$( )`
- variable expansion: `$NAME` or `${NAME}` (this can leak a secret value into the persisted argument)

A crafted value can run an arbitrary command as the invoking user. A crafted
value can also expand an environment variable into the stored argument. No
CLI-side check stops this, because the shell runs before `cli/src` starts. This
is true even when the argument comes from a quoted shell variable, because `pnpm`
re-evaluates the value in its own shell.

Safe forms:

- `npx thinkingmach <command> <args>` — the documented default. It passes an inert
  `argv` value and runs on any machine.
- `node cli/node_modules/tsx/dist/cli.mjs cli/src/index.ts <command> <args>` —
  the safe form to run the local source from a monorepo checkout. It is the exact
  command that the `pnpm thinkingmach` script wraps, but it runs directly, so no
  shell reads the argument. Use it when you must test your local `cli/src`
  changes with a content-bearing argument.

Unsafe or broken forms:

- `pnpm thinkingmach <command> <args>` — unsafe. `pnpm` runs the argument through a
  shell first.
- `pnpm run <script> -- <args>`, or any `package.json` script that wraps the CLI —
  unsafe for the same reason.
- `pnpm exec thinkingmach <command> <args>` — broken. The root workspace does not
  depend on the `thinkingmach` package, so `pnpm` does not link its binary into
  `node_modules/.bin`. The command fails with `Command "thinkingmach" not found`,
  even after a build. Do not use it.

Static placeholders only: a document must show a static placeholder such as
`<host>` in a command example, never a live `$( )` or `$NAME` span. The reader's
own shell expands such a span on paste, before any CLI or `npx` receives argv, so
a direct-exec form does not stop it.

`pnpm thinkingmach` stays acceptable only for a fully literal local lifecycle or
setup command. A fully literal command carries no substitutable value. It has no
placeholder, no example value the reader replaces, no interpolation, no path, no
ref, no id, and no name. It holds the subcommand and, at most, flags that take no
value.

The allowlist of literal commands lives in one place:
`server/src/__tests__/cli-invocation-safety.test.ts`. A guard test enforces it
fail-closed. Any `pnpm thinkingmach` line whose command string is not an exact
allowlist entry is an offender. The allowlist holds commands such as `run`,
`onboard`, `onboard --yes`, `doctor`, `configure --section <name>`, `connect`,
`env-lab up`, `env-lab down`, `context show`, `context list`,
`worktree ensure-seeded`, and `worktree env`.

Every invocation that carries a positional value or an option value uses
`npx thinkingmach` instead. This covers a hostname (`allowed-hostname`), an import
URL or folder (`company import`), an identifier or secret (`--company-id`,
`--agent-id`, `--claim-secret`), a payload (`--payload-json`), free text
(`--body`, `--title`, `--comment`), a data directory (`--data-dir`), an instance
(`--instance`), a bind preset (`--bind`), a context-profile name, and every
worktree path, ref, id, or name option. A runtime value counts as non-fixed even
when it looks safe. The private-hostname guard builds `allowed-hostname <value>`
from the request Host header, so it uses `npx thinkingmach`.

For a command that must run the local checked-out source with a value, use the
direct-exec form: `node cli/node_modules/tsx/dist/cli.mjs cli/src/index.ts
<command> <args>`.

The `pnpm --filter @thinkingmach/*` build and test commands are not CLI
invocation. They do not change.

### Offline and air-gapped use

`npx thinkingmach` runs offline when the `thinkingmach` package is already in a
local install or in the npm cache. It reaches the network only when the package
is in neither place.

To force cache-only resolution and block any network attempt, run
`npx --offline thinkingmach <command> <args>`. Use `npx --prefer-offline
thinkingmach` when you accept a fetch only for a missing package.

To prepare an air-gapped host, install the package one time while the host is
online. Run `npm install -g thinkingmach`, or run the documented `install.sh`
path. After that step, both `npx thinkingmach` and the installed `thinkingmach`
binary run offline. Both pass an inert `argv` value.

To move the package without a registry, run `npm pack thinkingmach` on an online
host. Copy the tarball to the air-gapped host. Run `npm install -g
./thinkingmach-<version>.tgz`.

Do not use `pnpm thinkingmach` as an offline fallback for a content-bearing
argument. It runs the argument through a shell first, offline or online. It also
resolves only inside a monorepo checkout.

A monorepo contributor who works offline uses the direct-exec form that this
section documents above: `node cli/node_modules/tsx/dist/cli.mjs
cli/src/index.ts <command> <args>`. It passes an inert `argv` value and runs the
local source.

## Base Usage

Use repo script in development:

```sh
pnpm thinkingmach --help
```

Recommended installation and interactive onboarding:

```sh
curl -fsSLO https://thinkingmach.com/install.sh
curl -fsSLO https://thinkingmach.com/install.sh.sha256
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c install.sh.sha256
else
  shasum -a 256 -c install.sh.sha256
fi
bash install.sh
```

The checksum detects transfer or publishing mistakes but is served from the
same origin as the installer. Use a release-tag or commit-pinned GitHub copy
when you need an independently hosted source. Piped installs require supported
Node.js, npm, and npx to already be installed; download the script first before
allowing it to bootstrap Node.js with privileged package-manager commands.

First-time local bootstrap from a source checkout:

```sh
pnpm thinkingmach run
```

Choose local instance:

```sh
npx thinkingmach run --instance dev
```

## Install, Update, And Uninstall

Managed installs keep CLI payloads under `~/.paperclip/cli`, expose a stable
`~/.local/bin/thinkingmach` shim, switch versions atomically, and retain two
previous payloads for rollback.

```sh
thinkingmach install
thinkingmach install --canary
thinkingmach install --version <version>
thinkingmach install --ref <branch|tag|sha> [--repo owner/repo]
thinkingmach update
thinkingmach update --latest|--canary|--version <version>
thinkingmach update --rollback
thinkingmach upgrade
thinkingmach uninstall
```

`upgrade` aliases `update`. `uninstall` removes managed code and the shim but
preserves instance data under `~/.paperclip/instances/`. See
`doc/INSTALLING.md` for installation methods, security notes, PATH setup, and
the complete update and rollback behavior.

## Onboarding And Service Management

Interactive onboarding offers to install a background service on supported
platforms. `--yes` never installs it implicitly; automation must opt in.

```sh
thinkingmach onboard
thinkingmach onboard --yes
thinkingmach onboard --yes --install-service
thinkingmach onboard --yes --no-install-service
```

Service lifecycle commands remain under the `service` namespace:

```sh
thinkingmach service install [--no-start-now] [--no-start-on-login]
thinkingmach service uninstall
thinkingmach service start
thinkingmach service stop
thinkingmach service restart [--wait]
thinkingmach service status [--json]
thinkingmach service logs [-f]
```

Every service verb supports `--instance <id>` and `--json`. Linux and WSL2 use
a systemd user unit when available; macOS uses a LaunchAgent. Unsupported
environments receive foreground `thinkingmach run` guidance.

`thinkingmach doctor` includes managed-install and service-health diagnostics in
addition to configuration, storage, database, logging, and port checks.

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `thinkingmach onboard` and `thinkingmach configure --section server` set deployment mode in config
- server onboarding/configure ask for reachability intent and write `server.bind`
- `thinkingmach run --bind <loopback|lan|tailnet>` passes a quickstart bind preset into first-run onboarding when config is missing
- runtime can override mode with `THINKINGMACH_DEPLOYMENT_MODE`
- `thinkingmach run` and `thinkingmach doctor` still do not expose a direct low-level `--mode` flag

Canonical behavior is documented in `doc/DEPLOYMENT-MODES.md`.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
npx thinkingmach allowed-hostname dotta-macbook-pro
```

Bring up the default local SSH fixture for environment testing:

```sh
pnpm thinkingmach env-lab up
pnpm thinkingmach env-lab doctor
pnpm thinkingmach env-lab status --json
pnpm thinkingmach env-lab down
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

API base resolution order:

1. `--api-base <url>`
2. `THINKINGMACH_API_URL`
3. selected context profile `apiBase`
4. local ThinkingMach config server port
5. `http://localhost:3100`

Connection failures include the attempted URL and a `GET /api/health` check hint.

## Connect Wizard

```sh
pnpm thinkingmach connect
```

`connect` confirms the resolved API base, verifies `GET /api/health`, authenticates board access when needed, and saves a persona-aware profile:

- `persona=board` for board operator profiles
- `persona=agent` with `agentId` and `agentName` for agent profiles

Profiles store token env-var names, not plaintext tokens. The wizard prints shell exports for the newly created token.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.paperclip`:

```sh
npx thinkingmach run --data-dir ./tmp/paperclip-dev
npx thinkingmach issue list --data-dir ./tmp/paperclip-dev
```

## Context Profiles

Store local defaults in `~/.paperclip/context.json`:

```sh
npx thinkingmach context set --api-base http://localhost:3100 --company-id <company-id>
npx thinkingmach context set --persona agent --agent-id <agent-id> --api-key-env-var-name THINKINGMACH_API_KEY
pnpm thinkingmach context show
pnpm thinkingmach context list
npx thinkingmach context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
npx thinkingmach context set --api-key-env-var-name THINKINGMACH_API_KEY
export THINKINGMACH_API_KEY=...
```

## Organization Commands

```sh
npx thinkingmach company list
npx thinkingmach company get <company-id>
npx thinkingmach company current [--company-id <company-id>]
npx thinkingmach company stats
npx thinkingmach company create --payload-json '{...}'
npx thinkingmach company update <company-id> --payload-json '{...}'
npx thinkingmach company branding:update <company-id> --payload-json '{...}'
npx thinkingmach company archive <company-id>
npx thinkingmach company export <company-id> --out ./company --include company,agents,projects,issues,skills
npx thinkingmach company export:preview <company-id> --payload-json '{...}'
npx thinkingmach company export:api <company-id> --payload-json '{...}'
npx thinkingmach company import ./company --target new --new-company-name "Imported Company"
npx thinkingmach company import:preview <company-id> --payload-json '{...}'
npx thinkingmach company import:apply <company-id> --payload-json '{...}'
npx thinkingmach company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
npx thinkingmach company delete PAP --yes --confirm PAP
npx thinkingmach company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- With agent authentication, `company list` and `company current` are
  agent-safe company selectors. `company list` first tries the board-wide list;
  if that is forbidden, it uses `--company-id`, `THINKINGMACH_COMPANY_ID`, context,
  or `/api/agents/me` and then reads only that scoped company.
- `company create` requires board/instance-admin authentication because it is
  an instance-wide setup command.
- Deletion is server-gated by `THINKINGMACH_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `THINKINGMACH_COMPANY_ID`), not another company.

## Issue Commands

```sh
npx thinkingmach issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
npx thinkingmach issue get <issue-id-or-identifier>
npx thinkingmach issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
npx thinkingmach issue update <issue-id> [--status in_progress] [--comment "..."]
npx thinkingmach issue delete <issue-id> --yes
npx thinkingmach issue comment <issue-id> --body "..." [--reopen]
npx thinkingmach issue comments <issue-id> [--limit 50]
npx thinkingmach issue comment:get <issue-id> <comment-id>
npx thinkingmach issue comment:delete <issue-id> <comment-id>
npx thinkingmach issue runs <issue-id-or-identifier>
npx thinkingmach issue live-runs <issue-id-or-identifier>
npx thinkingmach issue active-run <issue-id-or-identifier>
npx thinkingmach issue heartbeat-context <issue-id>
npx thinkingmach issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
npx thinkingmach issue release <issue-id>
npx thinkingmach issue force-release <issue-id>
```

Issue subresources are exposed as ThinkingMach API wrappers. Commands that map to broad server schemas accept JSON payloads and validate them with shared schemas before sending.

```sh
npx thinkingmach issue child:create <issue-id> --payload-json '{"title":"Child task"}'
npx thinkingmach issue approvals <issue-id>
npx thinkingmach issue approval:link <issue-id> <approval-id>
npx thinkingmach issue approval:unlink <issue-id> <approval-id>
npx thinkingmach issue read <issue-id>
npx thinkingmach issue unread <issue-id>
npx thinkingmach issue archive <issue-id>
npx thinkingmach issue unarchive <issue-id>
npx thinkingmach issue recovery-actions <issue-id>
npx thinkingmach issue recovery:resolve <issue-id> --outcome restored --source-issue-status todo
```

```sh
npx thinkingmach issue documents <issue-id> [--include-system]
npx thinkingmach issue document:get <issue-id> <key>
npx thinkingmach issue document:put <issue-id> <key> --body-file ./plan.md [--title Plan]
npx thinkingmach issue document:lock <issue-id> <key>
npx thinkingmach issue document:unlock <issue-id> <key>
npx thinkingmach issue document:revisions <issue-id> <key>
npx thinkingmach issue document:restore <issue-id> <key> <revision-id>
npx thinkingmach issue document:delete <issue-id> <key>
```

```sh
npx thinkingmach issue work-products <issue-id>
npx thinkingmach issue work-product:create <issue-id> --payload-json '{"type":"pull_request","provider":"github","title":"PR"}'
npx thinkingmach issue work-product:update <work-product-id> --payload-json '{"status":"archived"}'
npx thinkingmach issue work-product:delete <work-product-id>
npx thinkingmach issue interactions <issue-id>
npx thinkingmach issue interaction:create <issue-id> --payload-json '{"kind":"request_confirmation","payload":{"version":1,"prompt":"Continue?"}}'
npx thinkingmach issue interaction:accept <issue-id> <interaction-id> [--selected-client-keys key1,key2]
npx thinkingmach issue interaction:reject <issue-id> <interaction-id> [--reason "..."]
npx thinkingmach issue interaction:respond <issue-id> <interaction-id> --answers-json '[{"questionId":"q1","optionIds":["yes"]}]'
npx thinkingmach issue interaction:cancel <issue-id> <interaction-id> [--reason "..."]
```

```sh
npx thinkingmach issue tree-state <issue-id>
npx thinkingmach issue tree-preview <issue-id> --payload-json '{"mode":"pause"}'
npx thinkingmach issue tree-holds <issue-id> [--status active] [--include-members]
npx thinkingmach issue tree-hold:create <issue-id> --payload-json '{"mode":"pause","reason":"review"}'
npx thinkingmach issue tree-hold:get <issue-id> <hold-id>
npx thinkingmach issue tree-hold:release <issue-id> <hold-id> [--payload-json '{"reason":"done"}']
npx thinkingmach issue attachments <issue-id>
npx thinkingmach issue attachment:upload <issue-id> --company-id <company-id> --file ./artifact.txt
npx thinkingmach issue attachment:download <attachment-id> [--out ./artifact.txt]
npx thinkingmach issue attachment:delete <attachment-id>
npx thinkingmach issue label:list --company-id <company-id>
npx thinkingmach issue label:create --company-id <company-id> --name bug --color '#ff0000'
npx thinkingmach issue label:delete <label-id>
npx thinkingmach issue feedback:votes <issue-id>
npx thinkingmach issue feedback:vote <issue-id> --payload-json '{"targetType":"issue_comment","targetId":"...","vote":"up"}'
```

## Project Commands

```sh
npx thinkingmach project list --company-id <company-id>
npx thinkingmach project get <project-id-or-shortname> [--company-id <company-id>]
npx thinkingmach project create --company-id <company-id> --name "Launch Site" [--goal-ids <id1,id2>] [--lead-agent-id <id>]
npx thinkingmach project update <project-id-or-shortname> [--status in_progress] [--company-id <company-id>]
npx thinkingmach project delete <project-id-or-shortname> --yes [--company-id <company-id>]
```

Advanced project fields accept JSON:

```sh
npx thinkingmach project create --company-id <company-id> --name "Ops" --env-json '{"OPENAI_API_KEY":{"kind":"secret","secretName":"openai-api-key"}}'
npx thinkingmach project update <project-id> --execution-workspace-policy-json '{"enabled":true,"defaultMode":"shared_workspace"}'
```

## Goal Commands

```sh
npx thinkingmach goal list --company-id <company-id>
npx thinkingmach goal get <goal-id>
npx thinkingmach goal create --company-id <company-id> --title "Grow revenue" [--level company] [--status active]
npx thinkingmach goal update <goal-id> [--title "..."] [--status achieved]
npx thinkingmach goal delete <goal-id> --yes
```

## Agent Commands

```sh
npx thinkingmach agent list --company-id <company-id>
npx thinkingmach agent get <agent-id>
npx thinkingmach agent create --company-id <company-id> --payload-json '{"name":"Builder","adapterType":"codex_local"}'
npx thinkingmach agent hire --company-id <company-id> --payload-json '{...}'
npx thinkingmach agent update <agent-id> --payload-json '{"title":"Senior Builder"}'
npx thinkingmach agent delete <agent-id> --yes
npx thinkingmach agent me
npx thinkingmach agent inbox
npx thinkingmach agent inbox-mine --user-id <board-user-id>
npx thinkingmach agent wake <agent-id-or-shortname> [--company-id <company-id>] [--reason "..."] [--payload '{"issueId":"..."}']
npx thinkingmach agent pause <agent-id>
npx thinkingmach agent resume <agent-id>
npx thinkingmach agent approve <agent-id>
npx thinkingmach agent terminate <agent-id>
npx thinkingmach agent heartbeat:invoke <agent-id>
npx thinkingmach agent claude-login <agent-id>
npx thinkingmach agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

Agent configuration and runtime endpoints:

```sh
npx thinkingmach agent permissions:update <agent-id> --payload-json '{"canCreateAgents":true,"canCreateSkills":true,"canAssignTasks":true}'
npx thinkingmach agent configuration <agent-id>
npx thinkingmach agent config-revisions <agent-id>
npx thinkingmach agent config-revision:get <agent-id> <revision-id>
npx thinkingmach agent config-revision:rollback <agent-id> <revision-id>
npx thinkingmach agent runtime-state <agent-id>
npx thinkingmach agent runtime-state:reset-session <agent-id> [--task-key <key>]
npx thinkingmach agent task-sessions <agent-id>
npx thinkingmach agent skills <agent-id>
npx thinkingmach agent skills:sync <agent-id> --desired-skills paperclip,github --mode add
npx thinkingmach agent instructions-path:update <agent-id> --payload-json '{"path":"/path/to/AGENTS.md"}'
npx thinkingmach agent instructions-bundle <agent-id>
npx thinkingmach agent instructions-bundle:update <agent-id> --payload-json '{"mode":"managed"}'
npx thinkingmach agent instructions-file:get <agent-id> --path AGENTS.md
npx thinkingmach agent instructions-file:put <agent-id> --path AGENTS.md --content-file ./AGENTS.md
npx thinkingmach agent instructions-file:delete <agent-id> --path AGENTS.md
```

Agent config, instructions, skills, project env, environment, secret, and workspace edits affect the next run. Active runs finish with the config they started with. When a saved session, reused workspace, or sandbox lease no longer matches the effective next-run config, ThinkingMach may start fresh execution and records non-sensitive freshness categories in run result JSON and workspace operation logs.

`agent local-cli` is the quickest way to run local Claude/Codex manually as a ThinkingMach agent:

- creates a new long-lived agent API key
- installs missing ThinkingMach skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `THINKINGMACH_API_URL`, `THINKINGMACH_COMPANY_ID`, `THINKINGMACH_AGENT_ID`, and `THINKINGMACH_API_KEY`

Example for shortname-based local setup:

```sh
npx thinkingmach agent local-cli codexcoder --company-id <company-id>
npx thinkingmach agent local-cli claudecoder --company-id <company-id>
```

## Token Commands

Agent API keys are scoped to one company and one agent. Plaintext tokens are printed once at creation.

```sh
npx thinkingmach token agent create --company-id <company-id> --agent <agent-id-or-name> --name external-worker
npx thinkingmach token agent list --company-id <company-id> --agent <agent-id-or-name>
npx thinkingmach token agent revoke --company-id <company-id> --agent <agent-id-or-name> <key-id>
```

Named board API keys use the board authorization model, support revocation and expiration metadata, and are audited server-side.

```sh
npx thinkingmach token board create --company-id <company-id> --name external-admin
npx thinkingmach token board create --name short-lived --ttl-days 7
npx thinkingmach token board list
npx thinkingmach token board revoke <key-id>
```

## Run Commands

`thinkingmach run` without a subcommand still bootstraps and starts a local ThinkingMach instance. The subcommands below inspect and control API heartbeat runs.

```sh
npx thinkingmach run list --company-id <company-id> [--agent-id <agent-id>] [--limit 50]
npx thinkingmach run live --company-id <company-id> [--limit 50] [--min-count 0]
npx thinkingmach run get <run-id>
npx thinkingmach run events <run-id> [--after-seq 0] [--limit 200]
npx thinkingmach run log <run-id> [--offset 0] [--limit-bytes 16384] [--text]
npx thinkingmach run cancel <run-id>
npx thinkingmach run issues <run-id>
npx thinkingmach run workspace-operations <run-id>
npx thinkingmach run workspace-log <operation-id> [--offset 0] [--limit-bytes 16384] [--text]
npx thinkingmach run watchdog-decision <run-id> --decision continue [--reason "..."]
```

## Routine Commands

`thinkingmach routines disable-all` remains the local maintenance command. The singular `routine` group maps to the REST API.

```sh
npx thinkingmach routine list --company-id <company-id> [--project-id <project-id>]
npx thinkingmach routine create --company-id <company-id> --payload-json '{...}'
npx thinkingmach routine get <routine-id>
npx thinkingmach routine update <routine-id> --payload-json '{...}'
npx thinkingmach routine revisions <routine-id>
npx thinkingmach routine revision:restore <routine-id> <revision-id>
npx thinkingmach routine runs <routine-id> [--limit 50]
npx thinkingmach routine run <routine-id> [--payload-json '{...}']
npx thinkingmach routine trigger:create <routine-id> --payload-json '{...}'
npx thinkingmach routine trigger:update <trigger-id> --payload-json '{...}'
npx thinkingmach routine trigger:delete <trigger-id>
npx thinkingmach routine trigger:rotate-secret <trigger-id>
npx thinkingmach routine trigger:fire <public-id> [--payload-json '{...}']
```

## Prompt Handoff

Prompt handoff creates ThinkingMach work. It does not create a chat session.

```sh
npx thinkingmach agent-prompt <agent-name-or-id> <agent-api-key> "Prompt here"
npx thinkingmach agent prompt --agent <agent-name-or-id> --api-key-env THINKINGMACH_API_KEY "Prompt here"
npx thinkingmach agent prompt --profile my-agent "Prompt here"
npx thinkingmach board prompt --company-id <company-id> --agent <agent-name-or-id> "Prompt here"
```

By default the command creates a `todo` issue assigned to the target agent and wakes the agent. Use `--issue <issue-id>` to add a comment to existing work, and `--no-wake` to skip the wakeup.

## Skills Commands

`thinkingmach skills` covers three distinct operations:

1. **Company install** — adds or updates a row in `company_skills` for the
   whole company. This is what `skills install`, `skills import`, `skills create`,
   and `skills scan-projects` do.
2. **Agent attach** — merges an agent's *desired* company skill set with an
   explicit `add`, `remove`, or `replace` mode (`skills agent sync`/`clear`).
   This is a desired-state operation on the agent's adapter config; it does not
   change the company library.
3. **Adapter runtime sync** — the adapter reconciles the desired skill set
   with files on disk and reports an `AgentSkillSnapshot` (`skills agent list`).
   `skills agent sync` triggers this automatically after updating desired state.

Required ThinkingMach runtime skills (heartbeat, etc.) remain server-enforced and
are added on top of whatever the desired set names.

Company skill mutations (`skills install`, `skills import`, `skills create`, and
`skills scan-projects`) are open to same-company actors by default. Missing
`skills:create` grants and `canCreateSkills` settings do not deny these commands;
only an explicit company skill policy restriction does. Core safety and company
boundary checks still apply, and `agents:create` remains required when a command
also creates agents.

### Catalog (app-shipped skills)

The ThinkingMach app ships a curated catalog under `@thinkingmach/skills-catalog`.
Browse and inspect commands never mutate company state; `install` adds a catalog
skill to the company library.

```sh
npx thinkingmach skills browse [--kind bundled|optional] [--category <slug>] [--query <text>]
npx thinkingmach skills search "<text>" [--kind bundled|optional] [--category <slug>]
npx thinkingmach skills inspect <catalog-id-or-key-or-slug>
npx thinkingmach skills install <catalog-id-or-key-or-slug> [--as <slug>] [--force] --company-id <company-id>
```

Catalog semantics:

- **Bundled** skills live in `packages/skills-catalog/catalog/bundled/<category>/<slug>`
  and are recommended defaults for most companies. They use canonical key
  `thinkingmach/bundled/<category>/<slug>`.
- **Optional** skills live in `packages/skills-catalog/catalog/optional/<category>/<slug>`
  and are role-specific or domain-specific (browser, AWS ops, etc.). Same key
  shape with `optional` in place of `bundled`.
- `skills install` materializes the catalog files into a company-managed skill
  directory and records provenance (`catalogId`, `catalogKey`, `packageVersion`,
  `originHash`, …) so future updates and audit decisions stay consistent.
- `--as <slug>` overrides the company skill slug. `--force` may replace a
  same-key catalog-managed skill but never bypasses hard validation or hard-stop
  audit findings.

Examples:

```sh
npx thinkingmach skills browse --kind bundled --company-id <company-id>
npx thinkingmach skills search "pull request" --kind bundled
npx thinkingmach skills inspect github-pr-workflow
npx thinkingmach skills install github-pr-workflow --company-id <company-id>
npx thinkingmach skills install thinkingmach:optional:browser:agent-browser --company-id <company-id>
```

External GitHub, skills.sh, local-path, and URL sources still go through
`skills import`; catalog commands are for the app-shipped catalog only.

### Organization library

```sh
npx thinkingmach skills list --company-id <company-id>
npx thinkingmach skills show <skill-id-or-key-or-slug> --company-id <company-id>
npx thinkingmach skills file <skill-id-or-key-or-slug> [--path SKILL.md] --company-id <company-id>
npx thinkingmach skills import <source> --company-id <company-id>
npx thinkingmach skills create --name "Review PRs" [--slug review-prs] [--description "..."] [--body-file SKILL.md] --company-id <company-id>
npx thinkingmach skills scan-projects [--project-id <id>...] [--workspace-id <id>...] --company-id <company-id>
npx thinkingmach skills check [skill-id-or-key-or-slug] --company-id <company-id>
npx thinkingmach skills update <skill-id-or-key-or-slug> [--force] --company-id <company-id>
npx thinkingmach skills update --all [--force] --company-id <company-id>
npx thinkingmach skills audit [skill-id-or-key-or-slug] --company-id <company-id>
npx thinkingmach skills reset <skill-id-or-key-or-slug> [--yes] [--force] --company-id <company-id>
npx thinkingmach skills remove <skill-id-or-key-or-slug> --yes --company-id <company-id>
```

`skills import <source>` accepts a skills.sh URL, the equivalent
`<owner>/<repo>/<skill>` shorthand, a GitHub URL, a local path, or an
`npx skills add …` command. See `references/company-skills.md` in the agent
skill bundle for the source-type table.

`skills check`, `skills update`, `skills audit`, and `skills reset` are the
maintenance loop for catalog-installed skills:

- `check` reports whether each skill's installed bytes match its pinned origin
  (`hasUpdate`, `installedHash`, `originHash`, `updateHoldReason`,
  `auditVerdict`).
- `update` installs the pinned update through the existing install-update API.
  `--all` checks every company skill and updates only those with
  `hasUpdate=true`. `--force` discards local-modification or soft-audit holds;
  hard-stop audit findings still block the update.
- `audit` re-scans installed bytes and reports findings without executing
  anything.
- `reset` reinstalls a catalog-managed skill from its pinned origin, discarding
  local edits. Prompts in a TTY; requires `--yes` for non-interactive use.

### Agent attach

```sh
npx thinkingmach skills agent list <agent-id-or-shortname> --company-id <company-id>
npx thinkingmach skills agent sync <agent-id-or-shortname> --skill <skill-id-or-key-or-slug> [--skill <skill-id-or-key-or-slug>...] --mode <add|remove|replace> --company-id <company-id>
npx thinkingmach skills agent clear <agent-id-or-shortname> --yes --company-id <company-id>
```

`skills agent sync` requires a merge mode and returns the resulting adapter
`AgentSkillSnapshot`. `add` preserves all unnamed assignments, `remove` deletes
only named assignments, and `replace` destructively overwrites the complete
non-required desired skill set.
`skills agent clear` sends an empty desired list. Required ThinkingMach skills are
still enforced by the server in both cases.

### Notes

- Skill references accept company skill `id`, canonical `key`, or unique
  `slug`; catalog references accept catalog `id`, `key`, or unique `slug`.
- `skills file` prints raw file content in human mode so it can be piped.
- `skills create --body-file -` reads the skill markdown body from stdin.
- `skills remove`, `skills reset`, and `skills agent clear` prompt in a TTY and
  require `--yes` in non-interactive use.
- `--json` prints the raw API result for each command.

## Teams Commands

`thinkingmach teams` works with the app-shipped team catalog in
`@thinkingmach/teams-catalog`. Browse, search, inspect, and file reads do not
change company state. `preview` runs the company import planner, and `install`
imports the catalog team into an existing company.

```sh
npx thinkingmach teams browse [--kind bundled|optional] [--category <slug>] [--query <text>]
npx thinkingmach teams search "<text>" [--kind bundled|optional] [--category <slug>]
npx thinkingmach teams inspect <catalog-id-or-key-or-slug> [--file TEAM.md]
npx thinkingmach teams preview <catalog-id-or-key-or-slug> --company-id <company-id>
npx thinkingmach teams install <catalog-id-or-key-or-slug> --company-id <company-id>
```

Preview/install options:

- Under agent authentication, use `thinkingmach company list --json`,
  `thinkingmach company current --json`, or `THINKINGMACH_COMPANY_ID` to select the
  target company. `company list` falls back to the scoped current company when
  board-wide listing is forbidden. `teams install` creates agents and therefore
  requires board authentication, an `agents:create` grant, or an agent with the
  `canCreateAgents` permission (enabled by default for newly created
  standard-trust agents; low-trust agents and pre-existing agents without an
  explicit value stay disabled).
- `--request-approval-on-forbidden` turns a 403 install denial into a linked
  board approval request instead of a raw failed command; use
  `--approval-issue-id <id>` to attach it to a specific issue. During ThinkingMach
  task runs with `THINKINGMACH_TASK_ID` set, this fallback is automatic so
  agent-run walkthroughs leave a pending approval path instead of a raw 403.
- `--target-manager-agent-id <id>` or `--target-manager-slug <slug>` reparents
  catalog root agents under an existing manager.
- `--agent <slug>` and `--selected-file <path>` narrow the import.
- `--collision-strategy rename|skip|replace` controls name/key collisions.
- `--allow-external-sources`, `--allow-unpinned-optional-sources`, and
  `--allow-local-path-sources` explicitly opt into higher-trust source policy.
  Local-path sources are development-only and stay blocked unless that flag is
  passed.

## Secrets Commands

```sh
npx thinkingmach secrets list --company-id <company-id>
npx thinkingmach secrets declarations --company-id <company-id> [--include agents,projects] [--kind secret]
npx thinkingmach secrets create --company-id <company-id> --name anthropic-api-key --value-env ANTHROPIC_API_KEY
npx thinkingmach secrets link --company-id <company-id> --name prod-stripe-key --provider aws_secrets_manager --external-ref <provider-ref>
npx thinkingmach secrets doctor --company-id <company-id>
npx thinkingmach secrets provider-configs --company-id <company-id>
npx thinkingmach secrets provider-config:create --company-id <company-id> --payload-json '{...}'
npx thinkingmach secrets provider-config:discovery-preview --company-id <company-id> --payload-json '{...}'
npx thinkingmach secrets provider-config:get <config-id>
npx thinkingmach secrets provider-config:update <config-id> --payload-json '{...}'
npx thinkingmach secrets provider-config:default <config-id>
npx thinkingmach secrets provider-config:health <config-id>
npx thinkingmach secrets provider-config:delete <config-id>
npx thinkingmach secrets remote-import:preview --company-id <company-id> --payload-json '{...}'
npx thinkingmach secrets remote-import --company-id <company-id> --payload-json '{...}'
npx thinkingmach secrets migrate-inline-env --company-id <company-id> [--apply]
```

Secret listing and declarations never print secret values. `create` accepts
`--value-env` so shell history does not capture the value. `link` records
provider-owned references without copying the secret value into ThinkingMach.
For AWS-backed secrets, `secrets doctor` reports missing non-secret provider
env and the expected AWS SDK runtime credential source; do not store AWS
bootstrap credentials in ThinkingMach secrets.

Per-company provider vaults (multiple vault instances per provider, default
vault selection, coming-soon GCP/Vault) can be configured from the board UI under
`Organization Settings → Secrets → Provider vaults` or through the provider-config CLI
commands above. See the
[secrets deploy guide](../docs/deploy/secrets.md#provider-vaults) and
[API reference](../docs/api/secrets.md#provider-vaults) for the contract.

## Approval Commands

```sh
npx thinkingmach approval list --company-id <company-id> [--status pending]
npx thinkingmach approval get <approval-id>
npx thinkingmach approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
npx thinkingmach approval approve <approval-id> [--decision-note "..."]
npx thinkingmach approval reject <approval-id> [--decision-note "..."]
npx thinkingmach approval request-revision <approval-id> [--decision-note "..."]
npx thinkingmach approval resubmit <approval-id> [--payload '{"...":"..."}']
npx thinkingmach approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
npx thinkingmach activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
npx thinkingmach activity create --company-id <company-id> --payload-json '{...}'
npx thinkingmach activity issue <issue-id>
```

## Dashboard Commands

```sh
npx thinkingmach dashboard get --company-id <company-id>
```

## Org And Agent Config Commands

```sh
npx thinkingmach whoami
npx thinkingmach openapi
npx thinkingmach org get --company-id <company-id>
npx thinkingmach org svg --company-id <company-id> [--out org.svg]
npx thinkingmach org png --company-id <company-id> [--out org.png]
npx thinkingmach agent-config list --company-id <company-id>
```

## Access, Profile, And Instance Commands

```sh
npx thinkingmach profile session
npx thinkingmach profile get
npx thinkingmach profile update --payload-json '{...}'
npx thinkingmach profile company-user <user-slug> --company-id <company-id>
npx thinkingmach invite list --company-id <company-id>
npx thinkingmach invite create --company-id <company-id> --payload-json '{...}'
npx thinkingmach invite revoke <invite-id>
npx thinkingmach invite show <token>
npx thinkingmach invite accept <token> [--payload-json '{...}']
npx thinkingmach invite onboarding:text <token>
npx thinkingmach join list --company-id <company-id> [--status pending_approval]
npx thinkingmach join approve <request-id> --company-id <company-id>
npx thinkingmach join reject <request-id> --company-id <company-id>
npx thinkingmach join claim-key <request-id> --claim-secret <secret>
npx thinkingmach member list --company-id <company-id>
npx thinkingmach member update <member-id> --company-id <company-id> --payload-json '{...}'
npx thinkingmach member role-and-grants <member-id> --company-id <company-id> --payload-json '{...}'
npx thinkingmach member permissions <member-id> --company-id <company-id> --payload-json '{...}'
npx thinkingmach member archive <member-id> --company-id <company-id> [--payload-json '{...}']
npx thinkingmach admin user list [--query <text>]
npx thinkingmach admin user promote <user-id>
npx thinkingmach admin user demote <user-id>
npx thinkingmach admin user company-access <user-id>
npx thinkingmach admin user company-access:update <user-id> --payload-json '{...}'
```

CLI auth challenge endpoints are also exposed for tooling that needs the raw challenge lifecycle:

```sh
npx thinkingmach auth challenge create --payload-json '{...}'
THINKINGMACH_CHALLENGE_SECRET=<challenge-secret> npx thinkingmach auth challenge get <challenge-id> --token-env THINKINGMACH_CHALLENGE_SECRET
THINKINGMACH_CHALLENGE_SECRET=<challenge-secret> npx thinkingmach auth challenge approve <challenge-id> --token-env THINKINGMACH_CHALLENGE_SECRET
THINKINGMACH_CHALLENGE_SECRET=<challenge-secret> npx thinkingmach auth challenge cancel <challenge-id> --token-env THINKINGMACH_CHALLENGE_SECRET
npx thinkingmach auth revoke-current
```

`--token <challenge-secret>` is still supported for compatibility, but `--token-env` avoids putting challenge secrets in shell history or process arguments.

## Instance Settings Commands

```sh
npx thinkingmach instance scheduler-heartbeats
npx thinkingmach instance settings:general
npx thinkingmach instance settings:general:update --payload-json '{...}'
npx thinkingmach instance settings:experimental
npx thinkingmach instance settings:experimental:update --payload-json '{...}'
npx thinkingmach instance database-backup
```

Experimental features are opt-in and are provided without compatibility guarantees. They may break, change, or be removed at any time. Use them at your own risk.

```sh
npx thinkingmach sidebar preferences
npx thinkingmach sidebar preferences:update --payload-json '{...}'
npx thinkingmach sidebar project-preferences --company-id <company-id>
npx thinkingmach sidebar project-preferences:update --company-id <company-id> --payload-json '{...}'
npx thinkingmach sidebar badges --company-id <company-id>
npx thinkingmach inbox dismissals --company-id <company-id>
npx thinkingmach inbox dismiss --company-id <company-id> --payload-json '{"itemKey":"run:<run-id>"}'
npx thinkingmach board-claim show <token>
npx thinkingmach board-claim claim <token> [--payload-json '{...}']
npx thinkingmach openclaw invite-prompt --company-id <company-id> --payload-json '{...}'
npx thinkingmach available-skill list
npx thinkingmach available-skill index
npx thinkingmach available-skill get <skill-name>
npx thinkingmach llm agent-configuration
npx thinkingmach llm agent-configuration:adapter <adapter-type>
npx thinkingmach llm agent-icons
```

Hermes gateway uses the generic invite/join commands above rather than
`openclaw invite-prompt`. Create an agent invite, read
`invite onboarding:text`, submit a join request with
`adapterType: "hermes_gateway"` and `agentDefaultsPayload.apiBaseUrl` /
`agentDefaultsPayload.apiKey`, then approve and claim the key with the `join`
commands. See [HERMES_GATEWAY_ONBOARDING.md](./HERMES_GATEWAY_ONBOARDING.md).

## Adapter, Asset, And Skill Commands

```sh
npx thinkingmach adapter list
npx thinkingmach adapter install --payload-json '{"packageName":"@scope/adapter","version":"1.2.3"}'
npx thinkingmach adapter get <adapter-type>
npx thinkingmach adapter update <adapter-type> --payload-json '{"disabled":true}'
npx thinkingmach adapter override <adapter-type> --payload-json '{"paused":true}'
npx thinkingmach adapter reload <adapter-type>
npx thinkingmach adapter reinstall <adapter-type>
npx thinkingmach adapter delete <adapter-type>
npx thinkingmach adapter config-schema <adapter-type>
npx thinkingmach adapter ui-parser <adapter-type>
npx thinkingmach adapter models <adapter-type> --company-id <company-id> [--refresh] [--environment-id <id>]
npx thinkingmach adapter detect-model <adapter-type> --company-id <company-id>
npx thinkingmach adapter test-environment <adapter-type> --company-id <company-id> --payload-json '{...}'
```

```sh
npx thinkingmach asset image:upload --company-id <company-id> --file ./image.png [--namespace docs] [--alt "..."]
npx thinkingmach asset logo:upload --company-id <company-id> --file ./logo.svg
npx thinkingmach asset content <asset-id> --out ./asset.bin
```

```sh
npx thinkingmach skill list --company-id <company-id>
npx thinkingmach skill get <skill-id> --company-id <company-id>
npx thinkingmach skill file <skill-id> --company-id <company-id> [--path SKILL.md]
npx thinkingmach skill create --company-id <company-id> --payload-json '{...}'
npx thinkingmach skill file:update <skill-id> --company-id <company-id> --payload-json '{...}'
npx thinkingmach skill import --company-id <company-id> --payload-json '{"source":"github:owner/repo/path"}'
npx thinkingmach skill scan-projects --company-id <company-id> --payload-json '{...}'
npx thinkingmach skill update-status <skill-id> --company-id <company-id>
npx thinkingmach skill install-update <skill-id> --company-id <company-id>
npx thinkingmach skill delete <skill-id> --company-id <company-id>
```

## Cost, Finance, And Budget Commands

```sh
npx thinkingmach cost summary --company-id <company-id>
npx thinkingmach cost by-agent --company-id <company-id>
npx thinkingmach cost by-agent-model --company-id <company-id>
npx thinkingmach cost by-provider --company-id <company-id>
npx thinkingmach cost by-biller --company-id <company-id>
npx thinkingmach cost by-project --company-id <company-id>
npx thinkingmach cost window-spend --company-id <company-id>
npx thinkingmach cost quota-windows --company-id <company-id>
npx thinkingmach cost issue <issue-id>
npx thinkingmach cost event:create --company-id <company-id> --payload-json '{...}'
```

```sh
npx thinkingmach finance event:create --company-id <company-id> --payload-json '{...}'
npx thinkingmach finance events --company-id <company-id>
npx thinkingmach finance summary --company-id <company-id>
npx thinkingmach finance by-biller --company-id <company-id>
npx thinkingmach finance by-kind --company-id <company-id>
npx thinkingmach budget overview --company-id <company-id>
npx thinkingmach budget policy:upsert --company-id <company-id> --payload-json '{...}'
npx thinkingmach budget company:update --company-id <company-id> --payload-json '{...}'
npx thinkingmach budget agent:update <agent-id> --payload-json '{...}'
npx thinkingmach budget incident:resolve <incident-id> --company-id <company-id> [--payload-json '{...}']
```

## Workspace And Environment Commands

```sh
npx thinkingmach workspace list --company-id <company-id>
npx thinkingmach workspace get <execution-workspace-id>
npx thinkingmach workspace close-readiness <execution-workspace-id>
npx thinkingmach workspace operations <execution-workspace-id>
npx thinkingmach workspace update <execution-workspace-id> --payload-json '{...}'
npx thinkingmach workspace runtime-service <execution-workspace-id> start --payload-json '{...}'
npx thinkingmach workspace runtime-command <execution-workspace-id> run --payload-json '{...}'
```

```sh
npx thinkingmach environment list --company-id <company-id>
npx thinkingmach environment capabilities --company-id <company-id>
npx thinkingmach environment create --company-id <company-id> --payload-json '{...}'
npx thinkingmach environment get <environment-id>
npx thinkingmach environment leases <environment-id>
npx thinkingmach environment lease <lease-id>
npx thinkingmach environment update <environment-id> --payload-json '{...}'
npx thinkingmach environment delete <environment-id>
npx thinkingmach environment probe <environment-id>
npx thinkingmach environment probe-config --company-id <company-id> --payload-json '{...}'
```

```sh
npx thinkingmach project-workspace list <project-id>
npx thinkingmach project-workspace create <project-id> --payload-json '{...}'
npx thinkingmach project-workspace update <project-id> <workspace-id> --payload-json '{...}'
npx thinkingmach project-workspace delete <project-id> <workspace-id>
npx thinkingmach project-workspace runtime-service <project-id> <workspace-id> restart --payload-json '{...}'
npx thinkingmach project-workspace runtime-command <project-id> <workspace-id> run --payload-json '{...}'
```

## Plugin Commands

Existing plugin lifecycle commands remain available: `plugin init`, `list`, `install`, `uninstall`, `enable`, `disable`, `inspect`, and `examples`.

```sh
npx thinkingmach plugin ui-contributions
npx thinkingmach plugin tools
npx thinkingmach plugin tool:execute --payload-json '{...}'
npx thinkingmach plugin health <plugin-id>
npx thinkingmach plugin logs <plugin-id>
npx thinkingmach plugin upgrade <plugin-id>
npx thinkingmach plugin config <plugin-id> --company-id <company-id>
npx thinkingmach plugin config:set <plugin-id> --company-id <company-id> --payload-json '{"configJson":{...}}'
npx thinkingmach plugin config:test <plugin-id> --company-id <company-id> --payload-json '{"configJson":{...}}'
npx thinkingmach plugin jobs <plugin-id>
npx thinkingmach plugin job:runs <plugin-id> <job-id>
npx thinkingmach plugin job:trigger <plugin-id> <job-id> [--payload-json '{...}']
npx thinkingmach plugin webhook <plugin-id> <endpoint-key> [--payload-json '{...}']
npx thinkingmach plugin dashboard <plugin-id>
npx thinkingmach plugin bridge:data <plugin-id> --payload-json '{...}'
npx thinkingmach plugin bridge:action <plugin-id> --payload-json '{...}'
npx thinkingmach plugin bridge:stream <plugin-id> <channel> [--duration-ms 10000]
npx thinkingmach plugin data <plugin-id> <key> --payload-json '{...}'
npx thinkingmach plugin action <plugin-id> <key> --payload-json '{...}'
npx thinkingmach plugin local-folders <plugin-id> --company-id <company-id>
npx thinkingmach plugin local-folder:status <plugin-id> <folder-key> --company-id <company-id>
npx thinkingmach plugin local-folder:validate <plugin-id> <folder-key> --company-id <company-id> [--payload-json '{...}']
npx thinkingmach plugin local-folder:set <plugin-id> <folder-key> --company-id <company-id> --payload-json '{...}'
```

Feedback traces can be fetched directly by ID when automating export workflows:

```sh
npx thinkingmach feedback trace <trace-id>
npx thinkingmach feedback bundle <trace-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
npx thinkingmach heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Local ThinkingMach data lives under the selected instance root. `THINKINGMACH_HOME` chooses the home directory and `THINKINGMACH_INSTANCE_ID` chooses the instance.

```text
~/.paperclip/                                     # THINKINGMACH_HOME
└── instances/
    └── default/                                  # instance root (THINKINGMACH_INSTANCE_ID)
        ├── config.json                           # runtime config
        ├── .env                                  # instance env file
        ├── db/                                   # embedded PostgreSQL data
        ├── data/
        │   ├── storage/                          # local_disk uploads
        │   └── backups/                          # automatic DB backups
        ├── logs/
        ├── secrets/
        │   └── master.key                        # local_encrypted master key
        ├── workspaces/                           # default agent workspaces
        ├── projects/                             # project execution workspaces
        ├── companies/                            # per-company adapter homes (e.g. codex-home)
        └── codex-home/                           # per-instance codex home (when not company-scoped)
```

Default paths for the canonical install:

- config: `~/.paperclip/instances/default/config.json`
- embedded db: `~/.paperclip/instances/default/db`
- logs: `~/.paperclip/instances/default/logs`
- storage: `~/.paperclip/instances/default/data/storage`
- secrets key: `~/.paperclip/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
THINKINGMACH_HOME=/custom/home THINKINGMACH_INSTANCE_ID=dev pnpm thinkingmach run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm thinkingmach configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
