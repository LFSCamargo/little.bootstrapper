# Rule: solidity-anti-patterns

> Solidity smart contract development & Foundry/Hardhat safety rules.

- **Pin exact Solidity pragma**: Use `pragma solidity 0.8.28;` (never floating `^0.8.0`) in deployable contracts.
- **Prefer custom errors over revert strings**: Saves deployment and runtime gas while providing typed failure reasons.
- **Use `immutable` and `constant`**: Pack storage slots cleanly and mark set-once constructor addresses `immutable`.
- **Enforce CEI + `SafeERC20`**: Never ignore boolean return values on ERC-20 transfers; handle fee-on-transfer and rebasing tokens explicitly.
- **Run Slither & Foundry fuzzing**: Gate every PR with `forge test` (including `fuzz_` and `invariant_` suites) and static analysis.
