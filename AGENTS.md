# AGENTS.md

Guidance for AI agents working in this repository.

## Scope

These instructions apply to the landing repository. Follow them when reading, editing, testing, committing, or pushing changes.

Landing is a Next.js marketing/landing page project. Maintain high performance, accessibility standards, and consistent design language throughout.

## Tool Choices

- Use `rg` and `rg --files` for text and file searches.
- Use `apply_patch` for manual file edits.
- Use existing package scripts and project tooling before adding new commands.
- Prefer built-in Node.js utilities over third-party packages unless the package gives a clear benefit.
- Prefer existing components, hooks, styling patterns, and utilities in this repo.
- Prefer typed and structured code over ad hoc implementations.
- Do not use destructive git commands unless the user explicitly approves them.

## General Rules

- Keep changes simple, concise, and limited to the requested scope.
- When the user asks for a narrow change, implement only that change. Do not broaden the work into a better or safer design unless the user asks.
- Prefer changing existing code in place over adding one-off helpers, types, or abstractions.
- Prefer camelCase to snake_case in landing code.
- Avoid redundant local variables. Use values directly when they are already the value needed throughout.
- Avoid unnecessary branching. Prefer early returns when they keep the main logic at top level.
- Avoid repetition while preserving readability.
- Keep function signatures on one line when they fit within the maximum line length.
- Avoid deeply nested calls. Keep call depth to three levels or fewer where practical, and never allow excessive abstraction chains beyond five levels.
- For simple functions with required parameters, prefer positional arguments over object composition when appropriate.
- Use descriptive names for functions, files, components, variables, and utilities. Rename them when the old name no longer matches their responsibility.
- Function names should describe the action being taken. Avoid vague names; prefer clear, specific names.
- If one function is doing multiple unrelated actions, split it when the combined behavior cannot be named clearly.
- Avoid excessive parameterisation. Assign complex expressions to named locals first when that improves readability.
- Avoid complex maps inside function calls. Build the mapped value in a clearly named local variable first when the transformation is not trivial.
- Use compact layouts for arrays of small strings or constants when all values still fit clearly within line length.
- Name top-level constants that never change across runs in uppercase SNAKE_CASE.
- Do not add explicit fallbacks for values that already have the same default behavior unless there is a clear reason.
- Do not export values that are used only locally.
- Reuse and export existing functions or types when needed instead of duplicating them.
- Do not create wrapper functions that only pass through to third-party library functions.
- Remove stale comments, debug logs, unused imports, and unused code when touching related files.
- Indent code with tabs. Keep `.editorconfig` and `prettier.config.js` aligned with `useTabs: true` and `tabWidth: 4`.

## TypeScript Rules

- Apply TypeScript type safety throughout the changed code.
- Prefer existing types when they fit correctly.
- Avoid creating new types unless they clarify a real boundary or prevent unsafe behavior.
- Prefer required option fields when the implementation already assumes those fields are present.
- Derive unions from existing types or object properties rather than duplicating string literal unions by hand.
- Prefer overloads or wrapper signatures that distinguish return shapes instead of relying on loose generic return types.
- Do not hide type problems with `any`, unsafe casts, or broad generics unless there is no better local option.

## Imports And Modules

- Use `@/*` package imports for internal modules, not relative parent imports.
- Keep `package.json` imports and `tsconfig.json` paths in sync.
- Do not introduce a new import style in a file unless the repo has been configured for it.
- Keep module boundaries obvious. UI components should not know unnecessary implementation details.

## Frontend Rules

- Follow existing Next.js App Router patterns in this repo.
- Use client components only when client state, effects, browser APIs, or interactive hooks are needed.
- Keep components focused on rendering and interaction.
- Optimize performance for landing pages: minimize bundle size, prioritize core content, lazy load non-critical assets.
- Preserve loading, empty, error, and disabled states for interactive elements.
- Use accessible controls with labels, keyboard-friendly interactions, and clear disabled states.
- Maintain visual hierarchy, readability, and consistency with the existing design language.
- Ensure text does not overflow buttons, cards, sections, or controls on mobile or desktop.
- Do not introduce new UI libraries without approval.

## Workflow Rules

- Before making code changes, confirm the ticket number unless the user explicitly says the work has no ticket.
- Before creating or switching branches, ask where the branch should be created from.
- The default base branch is `main`.
- Always pull the latest `origin/main` before creating a branch from `main`.
- Commit only when the user asks.
- Push only when the user asks.
- Do not change product behavior or user-facing features without informing the user first.
- If the user asks for a code review, prioritize defects, regressions, performance issues, accessibility concerns, and contract mismatches.

## Clarification And Pushback

- Ask for clarification when a requirement is ambiguous, risky, or likely to affect product behavior.
- Push back firmly when a request would degrade performance, harm accessibility, create misleading UI behavior, or violate project rules.
- Do not silently do something that contradicts the user's request.
- If the requested approach is not optimal, explain the concern clearly and ask the user to reconsider.

## Tests

- Tests should cover only the changed behavior and the risk introduced by the change.
- Do not expand test scope into nearby behavior unless the user asked for broader coverage or the change touches a shared contract.
- Keep test data realistic and representative of actual use cases.

## Validation Contract

Use this command for repo-level validation before submitting code:

```bash
npm run check
```

`npm run check` includes linting, TypeScript checks, tests, and format verification.

Use this command while iterating on code:

```bash
npm run lint
```

For code formatting validation:

```bash
npm run format:check
```

To auto-fix formatting issues:

```bash
npm run format
```

Before submitting code, ensure the changed code passes ESLint and TypeScript checks.
