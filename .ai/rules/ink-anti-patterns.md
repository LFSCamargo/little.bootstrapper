# Rule: ink-anti-patterns

> little.bootstrapper Universal AI Rule (Framework) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Use `@inkjs/ui` (`Select`, `Spinner`, `ProgressBar`, `Alert`, `Badge`, `StatusMessage`, `ConfirmInput`, `ThemeProvider`, `extendTheme`) inside `packages/ui-cli` instead of legacy Ink prompt wrappers.
- Guard async `useEffect` calls with a `cancelled` cleanup flag, `clearInterval()` on animations, and `.catch()` error handling.
- Check `process.stdin.isTTY` before `render(<App />)` so non-TTY pipes exit cleanly with helpful flags.
- Never mix raw `console.log` inside active Ink components; memoize filtered/computed lists with `useMemo`.
- Validate interactive text inputs inline with Zod and keep CLI commands headless-testable in `src/commands/`.
