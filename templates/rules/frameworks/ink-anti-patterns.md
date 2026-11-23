# Rule: ink-anti-patterns

> React Ink CLI anti-patterns and workflow standards.

- **Use `@inkjs/ui` (official Ink UI library) inside `packages/ui-cli`**: Prefer `@inkjs/ui` (`Select`, `Spinner`, `ProgressBar`, `Alert`, `Badge`, `StatusMessage`, `ConfirmInput`, `ThemeProvider`, `extendTheme`) over legacy unmaintained Ink prompt wrappers.
- **Guard async effects & animation timers on unmount**: Always track a `let cancelled = false` flag inside `useEffect` async calls, `clearInterval()` on animated components, and handle `.catch()` errors; never call `setState` after unmount.
- **Check TTY before entering interactive raw mode**: Verify `process.stdin.isTTY` before `render(<App />)` so piped/CI runs fail gracefully with non-interactive flags instead of crashing Ink raw mode.
- **Never use raw `console.log` inside active Ink components**: Mixing stdout writes with Ink's reconciler corrupts terminal frames; render state via `<Text>` or exit Ink first.
- **Avoid unstable keys & heavy render-time computation**: Never use bare array indices for dynamic lists; memoize filtered/computed options with `useMemo`.
- **Keep screens isolated**: Put each interactive wizard in its own `src/ui/screens/*.tsx` file and reusable primitives (`MultiSelect`, banners, previews) inside `packages/ui-cli`.
- **Validate all text inputs inline with Zod**: Reject bad values immediately via `.safeParse()` with inline red `<Text color="red">` feedback rather than mutating silently.
- **Keep CLI commands headless-testable**: Separate argv parsing and command execution in `src/commands/` so E2E tests can run every workflow deterministically without flaky TTY hacks.
