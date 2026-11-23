# Rule: go-anti-patterns

> Idiomatic Go anti-patterns and concurrency safety rules.

- **Never ignore errors**: Handle every returned `error` explicitly with wrapped context (`fmt.Errorf("...: %w", err)`).
- **`context.Context` always first**: Propagate cancellation and deadlines through every I/O, DB, and HTTP call.
- **Prevent goroutine leaks**: Bound every goroutine lifetime with a context, channel close, or `errgroup.Group`.
- **Define interfaces at the consumer**: Keep interfaces small (1–3 methods) in the consuming package, not the implementing package.
- **Avoid `init()` side effects & global mutable state**: Inject dependencies explicitly via constructors (`NewService(repo)`).
- **Use `shopspring/decimal` or integer minor units for money**: Never use `float64` for currency.
