# Rule: nextjs-anti-patterns

> Next.js App Router anti-patterns and performance standards.

- **Server Components by default**: Only add `'use client'` at leaf interactive components (theme toggles, tabs, pointer-tracked animations); never mark layouts or entire pages `'use client'`.
- **Avoid high-frequency `useState` in animations**: Never drive `mousemove` or scroll animations via React `useState`; use Framer Motion `useMotionValue` + `useMotionTemplate` or CSS transforms to avoid 60fps re-renders.
- **Prevent hydration mismatches**: Add `suppressHydrationWarning` on `<html>` when client-side dark/light theme classes mutate `documentElement`, and never branch initial render on `window`/`localStorage`.
- **Never use `useEffect` for data fetching or derived state**: Fetch in Server Components or compute derived values directly during render.
- **Always define `metadataBase` and `not-found.tsx`**: Configure `metadataBase` in root `layout.tsx` and ship a dedicated `not-found.tsx` boundary.
- **Keep shared UI in `packages/ui-web`**: Place ShadCN and Aceternity UI primitives in `packages/ui-web`, transpile via `transpilePackages`, and never duplicate UI primitives in `apps/*`.
- **Never expose private keys via `NEXT_PUBLIC_`**: Keep `ACETERNITY_PRO_API_KEY` and secrets server-only.
