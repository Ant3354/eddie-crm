# Encryption keys and rotation (EDDIE CRM)

## Field-level encryption (DOB / SSN)

- Application fields `SensitiveData.dob` and `SensitiveData.ssn` are stored using AES-256-GCM in `lib/encryption.ts`.
- **Primary secret:** `ENCRYPTION_KEY` (minimum 32 characters). The key material is derived with scrypt; rotating requires a data migration (re-encrypt all rows with the new key).

## Session signing (operator identity for audit)

- **JWT cookie:** `eddie_session`, signed with `EDDIE_SESSION_SECRET` (or falls back to `CRON_SECRET` if at least 16 characters in non-production).
- **Rotation:** set a new `EDDIE_SESSION_SECRET`, deploy, then invalidate old sessions by clearing cookies (users sign in again). No DB migration.

## Key rotation runbook (ENCRYPTION_KEY)

1. **Prepare maintenance window** — exports and backups complete.
2. **Add new key** as `ENCRYPTION_KEY_NEXT` (same length rules) in env; deploy code that reads both keys for decrypt-only on old ciphertext (not implemented in this repo by default — extend `decrypt()` to try `ENCRYPTION_KEY_NEXT` then legacy if you add dual-read).
3. **Re-encrypt job** — batch script: load each `SensitiveData` row, `decrypt` with old, `encrypt` with new, update row.
4. **Swap** — set `ENCRYPTION_KEY` to the new value, remove `ENCRYPTION_KEY_NEXT`, remove dual-read logic.
5. **Verify** — spot-check contacts with sensitive data; confirm audit `SENSITIVE_VIEWED` still works.

Until a dual-key decrypt path exists, treat **ENCRYPTION_KEY** rotation as a **planned migration** with downtime or read-only mode.

## Audit log

- `AuditLog` rows are append-only in normal operation (no delete API). Use DB backups and restricted DB access for immutability guarantees.

## Data retention (uploads)

- Configure `uploadRetentionDays` under CRM settings (JSON). Cron `GET /api/cron/file-retention` with `Authorization: Bearer $CRON_SECRET` removes `File` rows (and on-disk paths) older than the policy.

## Observability

- Structured logs: `lib/observability.ts` (`logStructured`, `captureException`).
- Optional Sentry: install `@sentry/nextjs`, set `SENTRY_DSN`, and follow Sentry’s Next.js setup (not bundled by default).
