# Implementation Plan: hackathon-team-bootstrap

## Overview

Implement the Bootstrap_Script as a TypeScript CLI (`scripts/bootstrap.ts`) with small helper modules in `scripts/lib/`. Pure logic (gitignore merge, gitkeep decision, report formatting) is built and tested first. File-system helpers, templates and the git wrapper follow. The step functions and `main` are then wired in `bootstrap.ts`. Tests use Vitest and fast-check.

## Tasks

- [x] 1. Set up project tooling and shared types
  - [x] 1.1 Create `package.json`, `tsconfig.json` and Vitest config, and add `scripts/lib/types.ts`
    - Add dev dependencies: typescript, tsx, vitest, fast-check, @types/node
    - Define `StepStatus`, `StepResult`, `BootstrapOptions`, `ROLE_FOLDERS`, `REQUIRED_DIRS` and `REQUIRED_GITIGNORE` as specified in the design
    - Add `test` script using `vitest --run`
    - _Requirements: 1.1, 1.2, 1.3, 2.2_

- [x] 2. Implement pure logic modules
  - [x] 2.1 Implement `mergeGitignore` in `scripts/lib/gitignore.ts`
    - Preserve existing lines in order and append only missing required entries (trimmed line equality)
    - _Requirements: 2.2, 2.3_

  - [ ]* 2.2 Write property tests for gitignore merge
    - **Property 3: Gitignore merge preserves existing and adds required entries**
    - **Property 4: Gitignore merge is idempotent**
    - **Validates: Requirements 2.2, 2.3, 8.2**

  - [x] 2.3 Implement `formatReport` in `scripts/lib/report.ts`
    - One line per result: `[OK|SKIP|FAIL] <step> - <detail>`, then a totals line
    - _Requirements: 8.1_

  - [ ]* 2.4 Write property test for report formatting
    - **Property 7: Report lists every step with its status**
    - **Validates: Requirements 8.1**

  - [x] 2.5 Implement `needsGitkeep` in `scripts/lib/gitkeep.ts`
    - Return true iff the entry list has nothing other than `.gitkeep`
    - _Requirements: 6.1, 6.2_

- [x] 3. Implement file-system helpers
  - [x] 3.1 Implement `writeIfAbsent`, `ensureDir` and `copyTreeNoOverwrite` in `scripts/lib/fsx.ts`
    - Never overwrite existing files; `copyTreeNoOverwrite` returns copied and kept lists
    - _Requirements: 1.4, 3.1, 3.3, 4.5, 5.5_

  - [ ]* 3.2 Write property test for tree copy
    - **Property 5: ECC copy reproduces the source tree without overwriting**
    - **Validates: Requirements 3.1, 3.3**

- [x] 4. Implement templates
  - [x] 4.1 Create `scripts/lib/templates.ts` with `CONTRACT_TS` and `STEERING_ES`
    - `CONTRACT_TS` exports `AgentContract`, `DataContract` and `UiContract`, each with only `id: string`
    - `STEERING_ES` is Spanish and states that `src/types/contract.ts` is the single source of truth, describes the agent, data and UI roles with their folders, and lists the basic rules
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3_

  - [ ]* 4.2 Write unit tests for templates
    - Steering text contains the `src/types/contract.ts` statement and the three role folders
    - Contract template exports three interfaces and compiles with `tsc --noEmit`
    - _Requirements: 4.2, 4.3, 5.2, 5.4_

- [x] 5. Implement git wrapper
  - [x] 5.1 Create `scripts/lib/git.ts` with `git(root, args)` using `execFile` and an argument array
    - Return `{ ok, stdout, stderr }` and never throw on a non-zero exit or a missing git binary
    - _Requirements: 7.1, 7.6_

- [x] 6. Implement bootstrap steps and wiring in `scripts/bootstrap.ts`
  - [x] 6.1 Implement `createDirectories`, `writeGitignore`, `writeSteering`, `writeContract` and `placeGitkeeps`
    - Each step takes `BootstrapOptions` and returns a `StepResult`; exceptions become `failed`
    - `writeGitignore` uses `mergeGitignore`; steering and contract use `writeIfAbsent`
    - `placeGitkeeps` creates `.gitkeep` in empty Role_Folders and removes a `.gitkeep` when other files exist
    - Export the step functions for testing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 4.1, 4.5, 5.1, 5.5, 6.1, 6.2_

  - [x] 6.2 Implement `copyEcc`
    - Use a local directory source directly, otherwise `git clone --depth 1` into a temp dir
    - Find `skills` and `agents` at the source root and one level down, and mirror them with `copyTreeNoOverwrite`
    - Return `failed` on a missing source, clone error or no matching directories, and remove the temp dir in `finally`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 6.3 Implement `gitInitCommitPush`
    - Run `git init -b main` only when `.git` is absent, then `git add -A` and commit, skipping the commit when nothing is staged
    - When `remoteUrl` is set, add or update `origin` and run `git push -u origin main`; on failure return `failed` with the manual command and stderr
    - When `remoteUrl` is undefined, return `skipped` with "no remote URL provided"
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 6.4 Implement `main` with argument parsing and step orchestration
    - Parse `--remote <url>`, `--no-remote` and `--ecc <path-or-url>`, using the design defaults
    - Run steps in design order, catch exceptions per step, print `formatReport`, exit 0 unless an unexpected exception occurs outside a step
    - _Requirements: 3.2, 7.7, 8.1, 8.2_

- [ ] 7. Write step and integration tests
  - [ ]* 7.1 Write property tests for directories and gitkeep
    - **Property 1: Required directories exist after any run**
    - **Property 6: Gitkeep present if and only if the folder has no other files**
    - **Validates: Requirements 1.1, 1.2, 6.1, 6.2**

  - [ ]* 7.2 Write property tests for idempotence and no overwrite
    - **Property 2: Existing files are never overwritten**
    - **Property 8: Running twice yields the same file tree**
    - Use a local fixture directory as `eccSource` and no remote
    - **Validates: Requirements 1.4, 3.3, 4.5, 5.5, 8.2**

  - [ ]* 7.3 Write unit tests for step behavior
    - `.kiro/steering` exists and `.gitignore` exists on an empty root
    - A nonexistent ECC source gives `failed` and later steps still run
    - Running without a remote gives a `skipped` push
    - _Requirements: 1.3, 2.1, 3.2, 7.7_

  - [ ]* 7.4 Write git integration tests with a local bare repository as remote
    - Repository initialized on branch `main` with an initial commit containing all scaffolded files
    - `origin` configured and `main` arrives in the bare repository
    - An unreachable remote gives `failed` with the manual push command and the local commit remains
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [-] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests validate the universal correctness properties from the design
- Unit and integration tests validate specific examples and edge cases
- Property tests for file-system behavior run against a fresh temporary directory per iteration

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "3.1", "4.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "3.2", "4.2", "6.1"] },
    { "id": 3, "tasks": ["6.2"] },
    { "id": 4, "tasks": ["6.3"] },
    { "id": 5, "tasks": ["6.4"] },
    { "id": 6, "tasks": ["7.1", "7.2", "7.3", "7.4"] }
  ]
}
```
