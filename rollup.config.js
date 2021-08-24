import esbuild from 'rollup-plugin-esbuild'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.es.js',
    format: 'esm',
  },
  plugins: [esbuild()],
}
