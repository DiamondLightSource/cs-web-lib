import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

import postcss from "rollup-plugin-postcss";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

const config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/cjs/index.js",
        format: "cjs",
        sourcemap: true
      },
      {
        file: "dist/esm/index.js",
        format: "esm",
        sourcemap: true
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ preferBuiltins: true }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        compilerOptions: { outDir: "dist" }
      }),
      postcss(),
      dts()
    ]
  },
  {
    input: "dist/esm/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],

    external: [/\.css$/]
  }
];

export default config;
