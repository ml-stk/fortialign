# FortiAlign V2 Batch 5 — Production Hardening

## Scope

Batch 5 consolidates dependency analysis around the production configuration inventory model and adds assurance reporting for unresolved references, orphaned objects, and disabled objects that are still referenced.

## Reference policy

Dependency extraction is intentionally allow-listed by FortiGate configuration category and command key. Generic command-token scanning is not used because it produces false positives from literals, IP addresses, and unrelated CLI values.

## Assurance findings

- **Unresolved reference:** a known reference field points to an object name absent from the source inventory.
- **Orphan:** an object in an object-oriented category has no inbound dependency from the analysed configuration.
- **Disabled referenced:** an object explicitly disabled in its configuration is still referenced by another object.

## Production safety

FortiAlign produces a migration candidate and assurance findings; it does not claim that a configuration is safe to load without target-device validation. A successful analysis is not a substitute for FortiGate CLI/config validation, maintenance-window testing, backup/rollback preparation, or post-migration verification.
