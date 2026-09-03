# Batch 5 Build Check

The repository connector does not provide a local Node.js build runner in this session. Before merge, run:

```bash
npm ci
npm run lint
npm run build
```

The dependency graph was corrected to use `src/analysis/configInventory.ts`, and the UI imports the same model. The build check remains mandatory before production merge.
