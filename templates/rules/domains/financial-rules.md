# Rule: financial-rules

> High-integrity engineering rules for Financial, FinTech, Payments, Ledger, and Trading systems.

- **NEVER use IEEE-754 floating-point numbers (`number` / `float` / `double`) for money**: Represent monetary values strictly as integer minor units (`bigint` / `int64` cents/satoshis) paired with ISO-4217 currency codes, or arbitrary-precision decimal types (`rust_decimal`, `shopspring/decimal`, `Decimal.js`).
- **Double-entry immutable append-only ledger**: Never `UPDATE` or `DELETE` historical financial transactions; record reversals/refunds as offsetting credit/debit entries where `SUM(debits) == SUM(credits)`.
- **Mandatory idempotency keys**: Every payment, transfer, payout, or balance mutation endpoint MUST require a client-supplied `Idempotency-Key` stored with a unique constraint so retries never double-charge or double-credit.
- **Atomic concurrency control**: Wrap balance checks and ledger writes in a single ACID database transaction using `SELECT ... FOR UPDATE`, `SERIALIZABLE` isolation, or optimistic version locking to prevent race-condition double spends.
- **Explicit deterministic rounding**: Always declare rounding policy (`HALF_EVEN` / banker's rounding or `FLOOR` per regulatory rule) and track remainder/dust explicitly; never silently drop fractional units.
- **Immutable audit trail**: Log every financial state transition with `actorId`, `correlationId`, `idempotencyKey`, UTC ISO-8601 timestamp, before/after state references, and reason code.
- **PCI-DSS & PII redaction**: NEVER log PANs, CVVs, bank account numbers, SSNs, or auth tokens. Mask sensitive fields at the logger serializer layer.
- **Reconciliation & invariant tests**: Write property-based and integration tests asserting conservation of money (`total_in == total_out + fees + balances`) under concurrent retries and partial failures.
