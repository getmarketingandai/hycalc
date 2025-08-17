# Webflow single-file bundle (Rollup + Terser)

This PR adds a **single-file** bundle workflow for the calculator:

- `rollup.config.mjs`, `package.json`, `src/index.js`
- Bundles Chart.js via `chart.js/auto` and all app scripts
- Outputs `dist/mortgage-calc.bundle.min.js` (+ sourcemap)
- Webflow snippets:
  - `snippets/webflow_head.html` — CSS links for Page Head
  - `snippets/webflow-embed-no-scripts.min.html` — Embed (no scripts)
  - `snippets/webflow_footer_bundle_pinned.html` — Footer script (pinned)
  - `snippets/webflow_footer_bundle_dev.html` — Footer script (dev)

## How to use
1. `npm i && npm run build`
2. Commit **dist/** so jsDelivr can serve it:
   ```bash
   git add dist/mortgage-calc.bundle.min.js dist/mortgage-calc.bundle.min.js.map
   git commit -m "build: bundle vv1.0.0"
   ```
3. Tag and push:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. Webflow **Footer** (pinned):
   ```html
   <script src="https://cdn.jsdelivr.net/gh/getmarketingandai/hycalc@v1.0.0/dist/mortgage-calc.bundle.min.js" defer></script>
   ```

## Notes
- Keep using the **no-scripts** embed so all logic comes from the bundle.
- Dev flow: build, commit `dist/` to `main`, and use the `@main` footer snippet.
