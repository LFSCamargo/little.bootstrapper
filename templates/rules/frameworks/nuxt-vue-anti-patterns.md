# Rule: nuxt-vue-anti-patterns

> Nuxt.js & Vue 3 (Inspira UI / Motion) anti-patterns and SSR safety rules.

- **SSR-safe data fetching**: Use `useAsyncData` / `useFetch` instead of bare `fetch` inside `setup` to avoid double-fetching and hydration mismatches.
- **Never mutate props**: Emit typed events or use `defineModel()` for two-way bindings.
- **Guard browser-only globals**: Access `window`/`document` inside `onMounted` or `<ClientOnly>` wrappers.
- **Avoid `v-html` XSS**: Never bind unsanitized user HTML to `v-html`.
- **Clean up watchers & listeners**: Stop manual watchers/timers inside `onUnmounted`.
