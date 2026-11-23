# Rule: mobile-ui-components

> Reusable Mobile UI separation rule (for projects targeting React Native or Lynx).

- All reusable Mobile UI components, design tokens, and theme primitives MUST live inside `packages/ui-mobile`.
- Mobile apps in `apps/*` MUST import shared primitives from `packages/ui-mobile` rather than duplicating styling across screens.
