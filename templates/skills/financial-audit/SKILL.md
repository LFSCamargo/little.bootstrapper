---
name: financial-audit
description: Audit financial/fintech code for floating-point money bugs, missing idempotency keys, mutable ledgers, and race conditions
---

# Financial Code Audit Skill

1. **Floating-Point Money Scan**: Search for `number`, `float`, `double`, or `parseFloat` used on fields named `amount`, `price`, `balance`, `fee`, `total`, `rate`, or `currency`. Flag and migrate to integer minor units (`bigint`/`int64`) or fixed-point decimals.
2. **Idempotency Check**: Verify every payment, transfer, refund, or credit/debit endpoint enforces a persisted unique `Idempotency-Key`.
3. **Ledger Immutability Check**: Flag any `UPDATE` or `DELETE` on transaction/ledger tables; enforce append-only double-entry offsetting rows.
4. **Concurrency & Locking Check**: Confirm balance mutations execute inside ACID transactions with row locks (`FOR UPDATE`) or optimistic version checks.
5. **PII / PCI Log Scan**: Ensure PANs, CVVs, SSNs, and account numbers are redacted before logging.
