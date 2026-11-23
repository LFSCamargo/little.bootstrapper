# Rule: smart-contracts-anti-patterns

> Smart contract security rules for Solidity (Foundry/Hardhat) and Rust (Anchor, Soroban, Near, Stylus).

- **Checks-Effects-Interactions (CEI)**: Always validate preconditions and update state BEFORE external calls or token transfers; apply `ReentrancyGuard` on value-moving entrypoints.
- **Explicit access control & signer checks**: Verify caller authority, PDA/account ownership, and initialization guards on every privileged instruction.
- **No unchecked arithmetic or unsafe rounding**: Round in favor of the protocol, prevent precision loss before division (multiply before divide), and never silently truncate integers.
- **Avoid unbounded loops over dynamic storage arrays**: Cap iteration bounds or use pull-over-push withdrawal patterns to prevent gas/compute DoS.
- **Oracle & flash-loan hardening**: Never trust spot AMM reserves as price oracles; use TWAPs or verified feeds with staleness and circuit-breaker checks.
- **Mandatory fuzz & invariant testing**: Run Foundry fuzz/invariant tests or Anchor integration tests covering edge balances, zero amounts, and adversarial call sequences.
