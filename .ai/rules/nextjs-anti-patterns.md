# Rule: nextjs-anti-patterns

> Planet Express Universal AI Rule (Framework) — applies across Open Code, Antigravity, Claude, Codex, and Cursor.

- Keep pages and layouts as Server Components by default; push `'use client'` strictly to interactive leaf components.
- Never drive 60fps pointer/scroll animations with React `useState`; use Framer Motion `useMotionValue` + `useMotionTemplate`.
- Add `suppressHydrationWarning` on `<html>` when toggling dark/light classes; configure `metadataBase` and `not-found.tsx`.
- Never use `useEffect` for data fetching or derived state, and never leak private keys via `NEXT_PUBLIC_`.
