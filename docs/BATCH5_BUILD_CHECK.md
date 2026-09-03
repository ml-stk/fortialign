# Batch 5 Build Check

Run before merge:

```bash
npm ci
npm run lint
npm run build
```

The repository connector does not expose a local Node.js build runner in this session, so these commands remain a required external verification step.
