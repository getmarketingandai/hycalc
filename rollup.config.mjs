// rollup.config.mjs
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/mortgage-calc.bundle.min.js',
    format: 'iife',
    name: 'HYCalcBundle',
    sourcemap: true,
    inlineDynamicImports: true
  },
  context: 'window',
  intro: 'var window = globalThis; var document = window.document;',
  plugins: [
    resolve(),
    commonjs(),
    terser({
      format: { comments: /^!/ },
      compress: { passes: 2, pure_getters: true, hoist_funs: true },
      mangle: true
    })
  ]
};
