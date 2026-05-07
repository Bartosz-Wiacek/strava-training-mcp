---
description: Audit and fix npm/pnpm vulnerabilities and Docker image OS-level CVEs. Prioritizes version bumps over overrides. Cleans up stale overrides.
---

# Fix Vulnerabilities

You are tasked with resolving security vulnerabilities reported by `pnpm audit`. Follow this procedure strictly.

## Step 1: Audit

Run `pnpm audit` to get the full list of vulnerabilities. Analyze each one — note the package name, severity (critical/high/moderate/low), the vulnerable version range, and the fixed version.

## Step 2: Fix vulnerabilities (in priority order)

For each vulnerability, try the following approaches **in order**. Move to the next approach only if the previous one is not possible.

### 2a. Bump the direct dependency

If the vulnerable package is a direct dependency in `package.json`, bump it to a version that includes the fix:

```
pnpm update <package-name>
```

This is the best and cleanest solution. Always try this first.

### 2b. Bump a parent dependency

If the vulnerability is in a transitive (nested) dependency, check if bumping the **parent** direct dependency pulls in the fixed version:

```
pnpm why <vulnerable-package>
pnpm update <parent-package>
```

Then verify with `pnpm why <vulnerable-package>` that the version changed.

### 2c. Use `pnpm update` with depth

Try updating the transitive dependency directly:

```
pnpm update <vulnerable-package>
```

Sometimes pnpm can resolve it through the dependency tree without overrides.

### 2d. Check if a newer major version of the parent exists

If the parent dependency is on an old major version, check if a newer major version fixes the transitive vulnerability. If upgrading the parent's major version is safe (check changelog for breaking changes relevant to our usage), do it.

### 2e. Override (last resort, only for moderate+ severity)

**IMPORTANT: Do NOT add overrides for LOW severity vulnerabilities.** Skip those — the maintenance cost of overrides outweighs the risk.

For **moderate, high, or critical** vulnerabilities where none of the above worked, add a pnpm override in `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "<vulnerable-package>": ">= <fixed-version>"
    }
  }
}
```

When adding an override:

- Use the **minimum fixed version** with `>=`, not a pinned version
- Add a comment above or next to it explaining WHY the override exists (which parent depends on the vulnerable version)
- After adding, run `pnpm install` and verify the vulnerability is gone with `pnpm audit`
- Make sure the application still builds (`pnpm build`) — overrides can break things

### 2f. Skip (low severity with no easy fix)

If the vulnerability is **low severity** and cannot be fixed by bumping versions (2a–2d), skip it. Do not add an override. Note it in your response so the user knows.

## Step 3: Clean up stale overrides

After fixing new vulnerabilities, check if there are any existing `pnpm.overrides` in `package.json`. Use the **batch approach** — it's faster and equally reliable:

1. **Remove ALL existing overrides** from `package.json` at once (set `"overrides": {}`)
2. Run `pnpm install`
3. Run `pnpm audit`
4. Check which vulnerabilities reappear — only add back overrides for those that are **moderate+ severity**
5. Any override whose vulnerability did NOT reappear is stale — leave it removed
6. Any override that was only covering a **low severity** vulnerability should also be removed, even if the vuln reappears — overrides for low severity are not worth the maintenance cost

This ensures we don't accumulate dead or unnecessary overrides over time.

## Step 4: Verify

After all changes:

1. Run `pnpm install` to regenerate the lockfile
2. Run `pnpm audit` to confirm remaining vulnerabilities
3. Run `pnpm build` to make sure nothing is broken
4. Report a summary: what was fixed, how (bump vs override), what was skipped and why

## Rules

- **Prefer version bumps over overrides. Always.**
- **Never add overrides for low severity vulnerabilities.**
- **Always verify with `pnpm audit` and `pnpm build` after changes.**
- **Clean up overrides that are no longer necessary.**
- If you are unsure whether bumping a major version is safe, ask the user before proceeding.
- If a fix requires a **small refactor** (e.g., changing an import, adjusting a config), do it directly.
- If a fix requires a **large refactor** (e.g., replacing a library, changing architecture, major version upgrade with breaking changes), **stop and inform the user first** — describe what needs to change and why.
- If a vulnerability **cannot be easily fixed** because it requires a business or technology decision (e.g., choosing between alternative libraries, dropping a feature, changing the base image type), **stop and inform the user** — summarize the problem and the decision needed in max 2 sentences.

---

# Fix Docker Image OS-Level Vulnerabilities

OS-level CVEs (e.g., in `libssl3`, `zlib`, `glibc`) live in the base image, not in npm packages. They are reported by container image scanners (Harbor, Trivy, Docker Scout) — not by `pnpm audit`.

## Step 1: Identify

When a CVE scan flags a vulnerability in the deployed image:

1. Note the **library name**, **installed version**, **fixed version**, and **severity**
2. Confirm the vulnerability is in the **runtime image** (not the build stages — multi-stage build intermediate stages are discarded)
3. Check if it affects a library actually used at runtime (e.g., `libssl3` is used by Node.js)
4. Read the Dockerfile to determine what **type of base image** the runtime stage uses — this determines the fix approach

## Step 2: Fix vulnerabilities (in priority order)

### 2a. Rebuild with `--no-cache --pull`

Base image tags (e.g., `:latest`, `:nonroot`, `:lts-slim`) are rolling tags that maintainers update with security patches. A fresh rebuild may pull a patched base:

```bash
docker build --file <Dockerfile> --no-cache --pull --tag <image-name> .
```

Then re-scan the image. If the CVE is gone, no code changes are needed. Always try this first.

### 2b. Update the base image tag or version

If the current base image tag is outdated or pinned to an old version, check if a newer tag or version exists that includes the fix. For example:
- `node:22-slim` → `node:22.x-slim` (newer patch)
- `debian:bookworm-20240101-slim` → `debian:bookworm-slim` (latest)
- Pinned digest → update to a newer digest

### 2c. Add a system upgrade to the runtime stage (standard images)

If the runtime image has a package manager (Debian/Ubuntu-based, Alpine, etc.), add a security upgrade step to the runtime stage.

**If the Dockerfile already has a `RUN apt-get install` / `RUN apk add` instruction in the runtime stage**, prepend the upgrade to that same `RUN` instruction to avoid creating an extra Docker layer:

**Debian/Ubuntu-based:**
```dockerfile
RUN apt-get update && apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends <existing-packages> && \
    rm -rf /var/lib/apt/lists/*
```

**Alpine-based:**
```dockerfile
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache <existing-packages>
```

**If there is no existing package install instruction**, add a new `RUN` line early in the runtime stage:

**Debian/Ubuntu-based:**
```dockerfile
RUN apt-get update && apt-get upgrade -y --no-install-recommends && rm -rf /var/lib/apt/lists/*
```

**Alpine-based:**
```dockerfile
RUN apk update && apk upgrade --no-cache
```

### 2d. Add an `os-security-patch` stage (distroless / minimal images)

If the runtime image has **no package manager** (e.g., distroless, scratch-based), you cannot run `apt-get upgrade` directly. Instead, add an intermediate stage that patches libraries and copies them into the runtime:

```dockerfile
# Add between build and runtime stages
FROM debian:bookworm-slim AS os-security-patch
RUN apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

FROM <distroless-base-image> AS runtime
# Overlay patched system libraries
COPY --from=os-security-patch /usr/lib/ /usr/lib/
# ... rest of runtime stage
```

Match the patch stage OS to the runtime base (e.g., `debian:bookworm-slim` for debian12-based distroless, `debian:bullseye-slim` for debian11-based).

### 2e. Skip (low severity or not exploitable at runtime)

If the CVE is **low severity** and the vulnerable library is not used at runtime, or the attack vector doesn't apply (e.g., a local-only exploit on a container with no shell), skip it. Note it in your response so the user knows.

## Step 3: Verify

After changes:

1. Rebuild the image with `--no-cache`
2. Scan with Trivy: `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image <image-name> --vuln-type os --severity HIGH,MEDIUM,CRITICAL`
3. Confirm the specific CVEs no longer appear
4. Verify the app still starts and the health endpoint responds

## Rules

- **Always fix HIGH and CRITICAL OS-level CVEs.**
- **Try a fresh rebuild (2a) before modifying the Dockerfile.**
- **Rebuild with `--no-cache`** to ensure upgrade steps actually run with fresh package lists.
- **Do not change the base image type** (e.g., switching from distroless to a full image) just to fix a CVE — use the appropriate patching approach for the image type instead.
- If you are unsure whether changing the base image tag/version is safe, ask the user before proceeding.
- If a fix requires a **small refactor** (e.g., adding a build stage, changing a COPY path), do it directly.
- If a fix requires a **large refactor** (e.g., switching base image type, changing the build pipeline, multi-file changes), **stop and inform the user first** — describe what needs to change and why.
- If a vulnerability **cannot be easily fixed** because it requires a business or technology decision (e.g., the upstream base image hasn't released a patch yet, the fix breaks compatibility with the build system), **stop and inform the user** — summarize the problem and the decision needed in max 2 sentences.
