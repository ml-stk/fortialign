# FortiAlign V2 Batch 7 — Production Assurance

## Objective

Batch 7 focuses on making the migration result easier to assess and safer to review before a target-device deployment.

## Assurance changes

- Add a migration readiness state: `BLOCK`, `REVIEW`, or `PASS`.
- Provide dependency diagnostics with source path, reference, dependency type, severity, status, and reason.
- Distinguish genuinely unresolved dependencies from dependencies that require engineering review.
- Recognize `virtual-wan-link` as the FortiGate SD-WAN logical interface rather than a missing physical interface.
- Model local FortiGate users separately from authentication servers when resolving user-group membership.
- Treat user-group identities that cannot be resolved locally as authentication reviews rather than automatic missing-object failures, because they may represent LDAP/RADIUS/TACACS+, FSSO, or remote-group identities.
- Provide dependency review counts alongside unresolved dependency counts.
- Provide unresolved dependency counts by type and severity.
- Provide orphan-candidate counts by inventory category.
- Classify orphan candidates into actionable review categories: `cleanup-candidate`, `potentially-unused`, `security-profile-review`, and `identity-system-review`.
- Treat orphan objects as candidates for review rather than automatic migration failures.
- Reduce repetitive credential/secret findings to one finding per source configuration object while deliberately avoiding secret values in reports.
- Add a security finding summary so repetitive credential, SHA-1, and legacy-cryptography findings can be assessed without losing the detailed findings.
- Make finding identifiers unique when multiple detection stages produce the same base identifier.
- Preserve the existing mandatory target-device validation requirement.

## Readiness semantics

- **BLOCK** — at least one migration blocker exists; do not deploy the generated candidate until the blocker is remediated.
- **REVIEW** — no hard blocker was detected by the current checks, but manual engineering review remains required.
- **PASS** — no blocker, manual action, or review item was detected by the current checks.

A `PASS` result does not replace target-device validation.

## Orphan semantics

An orphan candidate means that the current dependency model found no inbound dependency edge. It does **not** prove that the object is unused or safe to delete.

- **cleanup-candidate** — disabled and unreferenced; high-confidence cleanup candidate, subject to confirmation.
- **potentially-unused** — enabled and unreferenced by modeled dependencies; medium-confidence review candidate.
- **security-profile-review** — security profile with no modeled consumer; implicit or configuration-specific usage must be checked before removal.
- **identity-system-review** — user, authentication, or certificate object with no modeled consumer; implicit/system or unmodeled usage is possible.

## Regression acceptance criteria

Before Batch 7 is merged into production:

1. `npm ci` completes successfully.
2. `npm run lint` completes successfully.
3. `npm run build` completes successfully.
4. A real FortiGate configuration is imported locally without sending the configuration to an external service.
5. Quoted FortiGate object names remain intact during dependency analysis.
6. Genuine unresolved references include actionable source-path diagnostics.
7. `virtual-wan-link` references are classified as SD-WAN logical-interface reviews, not missing-interface blockers.
8. User-group membership is resolved against local users/authentication servers where possible, with remote identities classified as review items rather than false missing-object errors.
9. Dependency reviews are reported separately from genuine unresolved references.
10. Orphan candidates are clearly separated from unresolved references and receive an explicit classification.
11. Finding IDs are unique within the generated report.
12. Credential/secret findings are not emitted once for every secret-bearing command in the same configuration object.
13. For the current 100E → 120G profile, active unmapped physical interfaces and HA heartbeat interfaces require engineering review; they are not assigned arbitrarily. Inactive unmapped physical interfaces are low-severity review items.
14. The generated configuration remains a candidate and is not represented as production-safe without target-device validation.
15. The exported report states clearly that `REVIEW` means no automated migration blocker was detected, while engineering validation is still required.

## Current profile

The active production profile is FortiGate 100E / FortiOS 7.0.19 to FortiGate 120G / FortiOS 7.4.12. Deterministic same-name interface mappings are enabled for the known target ports; source-specific interfaces without exact equivalents remain explicitly unmapped for engineering review.
