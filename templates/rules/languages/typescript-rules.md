# Rule: typescript-rules

> TypeScript strict engineering & boundary safety rules.

- **Zero `any` or unchecked casts**: Prefer `unknown` + Zod `.safeParse()` at external boundaries (CLI argv, HTTP payloads, JSON files, env vars).
- **Model state with discriminated unions**: Prefer `{ kind: 'ok'; data: T } | { kind: 'error'; message: string }` over loosely typed boolean flags.
- **No floating promises**: Every async call MUST be `await`ed, explicitly returned, or handled with `.catch()`.
- **Keep modules barrel-isolated**: Cross-module imports go through `index.ts`; never reach into sibling internals.
- **Use exact pinned versions**: Never ship `^` or `~` dependency ranges in `package.json`.
