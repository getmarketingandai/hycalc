/*! HYCalc v1.0.0 — Single-file bundle entry (Rollup) */
import Chart from 'chart.js/auto';

// --- defaults.js ---
import './defaults.js';
// --- dom-batch.js ---
import './dom-batch.js';
// --- shared.js ---
import './shared.js';
// --- basic-form.js ---
import './basic-form.js';
// --- advanced-form.js ---
import './advanced-form.js';
// --- form.js ---
import './form.js';
// --- evaluate.js ---
import './evaluate.js';
// --- financial-model.js ---
import './financial-model.js';
// --- sources-uses-chart.js ---
import './sources-uses-chart.js';
// --- bar-chart.js ---
import './bar-chart.js';
// --- annual-cashflow-chart.js ---
import './annual-cashflow-chart.js';
// --- annual-debt-payment-chart.js ---
import './annual-debt-payment-chart.js';
// --- debt-balance-chart.js ---
import './debt-balance-chart.js';
// --- spreadsheet.js ---
import './spreadsheet.js';
// --- spreadsheet-optimizer.js ---
import './spreadsheet-optimizer.js';
// --- equity-summary.js ---
import './equity-summary.js';
// --- mobile-enhancements.js ---
import './mobile-enhancements.js';
// --- animation-optimizer.js ---
import './animation-optimizer.js';

// After all scripts run, broadcast initial state for initial render
try {
  if (typeof window.formDictionary === 'object' && window.formDictionary) {
    document.dispatchEvent(new CustomEvent('formDictionaryChanged', { detail: window.formDictionary }));
  }
} catch(e) { console.error('Init broadcast error:', e); }
