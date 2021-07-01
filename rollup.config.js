import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const isProduction = (process.env.NODE_ENV = 'production');

export default {
  input: './src/my-single-spa.js',
  output: {
    file: `./lib/my-single-spa${isProduction && '.min'}.js`,
    name: 'mySingleSpa',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**',
    }),
    commonjs(),
    isProduction &&
      terser({
        ecma: 6,
        module: true,
      }),
  ],
};
