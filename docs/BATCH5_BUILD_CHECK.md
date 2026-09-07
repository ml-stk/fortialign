# FortiAlign V2 — Batch 5 Build Check

## Required validation

Run in GitHub Codespaces from `feat/fortialign-v2-batch5`:

```bash
npm install
npm run lint
npm run build
```

`npm ci` is not usable until a committed `package-lock.json` exists.

## Known Codespaces recovery

If Vite reports a missing `@tailwindcss/oxide` native binding after installation, remove the local install and lockfile and regenerate dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
npm run lint
npm run build
```

Once the build is clean, commit the generated `package-lock.json` so subsequent CI/CD runs can use `npm ci` reproducibly.
