# Rule: shadcn-aceternity-rules

> ShadCN UI + Aceternity UI + Tailwind CSS v4 design system rules.

- **Centralize primitives in `packages/ui-web`**: Store ShadCN Radix primitives (`src/shadcn/`), Aceternity animated effects (`src/aceternity/`), and `components.json` in `packages/ui-web`.
- **Use CVA + `cn()` for variants**: Style component variants via `class-variance-authority` and merge classes safely with `cn()` (`clsx` + `tailwind-merge`).
- **Keep Aceternity Pro keys server-only**: Store `ACETERNITY_PRO_API_KEY` and `ACETERNITY_PRO_LICENSE_KEY` in `.env.local` (documented in `.env.example`); never prefix secrets with `NEXT_PUBLIC_`.
- **Zero React re-renders on pointer animations**: Use Framer Motion `useMotionValue` + `useMotionTemplate` instead of `useState` on `mousemove`.
- **Accessible & theme-safe**: Support both dark and light modes, preserve Radix keyboard navigation, and ensure WCAG contrast on liquid glass surfaces.
