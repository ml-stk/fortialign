# FortiAlign V2 Batch 7 — Production Assurance

## Objective

Batch 7 focuses on making the migration result easier to assess and safer to review before a target-device deployment.

## Assurance changes

- Add a migration readiness state: `BLOCK`, `REVIEW`, or `PASS`.
- Provide dependency diagnostics with source path, reference, dependency type, severity, and reason.
- Provide unresolved dependency counts by type and severity.
- Provide orphan-candidate counts by inventory category.
- Treat orphan objects as candidates for review rather than automatic migration failures.
- Reduce repetitive credential/secret findings to one finding per source configuration object while deliberately avoiding secret values in reports.
- Make finding identifiers unique when multiple detection stages produce the same base identifier.
- Preserve the existing mandatory target-device validation requirement.

## Readiness semantics

- **BLOCK** — at least one migration blocker exists; do not deploy the generated candidate until the blocker is remediated.
- **REVIEW** — no hard blocker was detected by the current checks, but manual engineering review remains required.
- **PASS** — no blocker, manual action, or review item was detected by the current checks.

A `PASS` result does not replace target-device validation.

## Regression acceptance criteria

Before Batch 7 is merged into production:

1. `npm ci` completes successfully.
2. `npm run lint` completes successfully.
3. `npm run build` completes successfully.
4. A real FortiGate configuration is imported locally without sending the configuration to an external service.
5. Quoted FortiGate object names remain intact during dependency analysis.
6. Unresolved references include actionable source-path diagnostics.
7. Orphan candidates are clearly separated from unresolved references.
8. Finding IDs are unique within the generated report.
9. Credential/secret findings are not emitted once for every secret-bearing command in the same configuration object.
10. A missing interface mapping continues to produce a critical migration blocker for the current 100E → 120G profile.
11. The generated configuration remains a candidate and is not represented as production-safe without target-device validation.

## Current profile

The active production profile is FortiGate 100E / FortiOS 7.0.19 to FortiGate 120G / FortiOS 7.4.12. The interface mapping for this profile is intentionally incomplete until the physical and logical target interface design is confirmed.
