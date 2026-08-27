---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `thinkingmach run`

One-command bootstrap and start:

```sh
pnpm thinkingmach run
```

Does:

1. Auto-onboards if config is missing
2. Runs `thinkingmach doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
npx thinkingmach run --instance dev
```

## `thinkingmach onboard`

Interactive first-time setup:

```sh
pnpm thinkingmach onboard
```

If ThinkingMach is already configured, rerunning `onboard` keeps the existing config in place. Use `thinkingmach configure` to change settings on an existing install.

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm thinkingmach onboard --run
```

Quickstart defaults + immediate start:

```sh
pnpm thinkingmach onboard --yes
```

When onboarding starts ThinkingMach from an interactive terminal, it opens the
onboarding page in your browser once. Non-interactive terminals stay silent.
Suppress browser opening explicitly for headless or automated runs with either
environment variable:

```sh
THINKINGMACH_NO_BROWSER=1 pnpm thinkingmach onboard --yes
THINKINGMACH_OPEN_ON_LISTEN=false pnpm thinkingmach onboard --yes
```

On an existing install, `--yes` now preserves the current config and just starts ThinkingMach with that setup.

## `thinkingmach doctor`

Health checks with optional auto-repair:

```sh
pnpm thinkingmach doctor
pnpm thinkingmach doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration, including AWS Secrets Manager non-secret env
  config when selected
- Storage configuration
- Missing key files

## `thinkingmach configure`

Update configuration sections:

```sh
pnpm thinkingmach configure --section server
pnpm thinkingmach configure --section secrets
pnpm thinkingmach configure --section storage
```

`--section secrets` updates the deployment-level provider used as the fallback
for secrets that do not target a specific company vault. Per-company provider
vaults (named instances, default vault selection, multiple vaults per provider,
coming-soon GCP/Vault) live in the board UI under
`Company Settings → Secrets → Provider vaults` and the
`/api/companies/{companyId}/secret-provider-configs` API.

## `thinkingmach env`

Show resolved environment configuration:

```sh
pnpm thinkingmach env
```

This now includes bind-oriented deployment settings such as `THINKINGMACH_BIND` and `THINKINGMACH_BIND_HOST` when configured.

## `thinkingmach allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
npx thinkingmach allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.paperclip/instances/default/config.json` |
| Database | `~/.paperclip/instances/default/db` |
| Logs | `~/.paperclip/instances/default/logs` |
| Storage | `~/.paperclip/instances/default/data/storage` |
| Secrets key | `~/.paperclip/instances/default/secrets/master.key` |

Override with:

```sh
THINKINGMACH_HOME=/custom/home THINKINGMACH_INSTANCE_ID=dev pnpm thinkingmach run
```

Or pass `--data-dir` directly on any command:

```sh
npx thinkingmach run --data-dir ./tmp/paperclip-dev
npx thinkingmach doctor --data-dir ./tmp/paperclip-dev
```
