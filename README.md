# HYCalc — Single-file bundle (Rollup + Terser)

Builds a **single, minified, tree-shaken** bundle for Webflow.

## Build locally
```bash
npm i
npm run build
# -> dist/mortgage-calc.bundle.min.js (+ .map)
```

## Commit dist (required for jsDelivr)
```bash
git add dist/mortgage-calc.bundle.min.js dist/mortgage-calc.bundle.min.js.map
git commit -m "build: bundle vv1.0.0"
```

## CDN in Webflow
- Pinned:
```html
<script src="https://cdn.jsdelivr.net/gh/getmarketingandai/hycalc@v1.0.0/dist/mortgage-calc.bundle.min.js" defer></script>
```
- Dev (@main) for quick iteration:
```html
<script src="https://cdn.jsdelivr.net/gh/getmarketingandai/hycalc@main/dist/mortgage-calc.bundle.min.js" defer></script>
```

## Notes
- Chart.js included via `chart.js/auto` and bundled.
- If any legacy scripts depend on implicit globals, this IIFE build preserves `window` context.
