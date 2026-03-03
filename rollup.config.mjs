
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import preserveDirectives from 'rollup-preserve-directives';

const config = [
  {
    input: "src/index.ts",

    external: (id) => {
      if (id.includes("react-gauge-component")) return false;
      return false; // bundle everything except peer deps
    },
    moduleContext(id) {
      if (id.includes("react-gauge-component")) {
        return "window";
      }
    },

    output: [
      {
        dir: "dist",
        format: "cjs",
        entryFileNames: "index.cjs",
        sourcemap: true
      },
      {
        dir: "dist",
        format: "esm",
        entryFileNames: "index.js",
        sourcemap: true
      }
    ],
    onwarn(warning, warn) {
      // Ignore circular dependencies in d3-interpolate
      if (
        warning.code === "CIRCULAR_DEPENDENCY" &&
        /d3-interpolate/.test(warning.importer)
      ) {
        return;
      }
    },
    plugins: [
      peerDepsExternal({
        exclude: ["react-gauge-component"]
      }),

      resolve({
        preferBuiltins: true
      }),
      commonjs({
        include: [
          /node_modules/,
          "node_modules/react-gauge-component/**" 
        ]
      }),
      typescript({
        tsconfig: "./tsconfig.build.json",
        outDir: "dist",
        declarationDir: "dist"
      }),
      postcss(),
      preserveDirectives()
    ]
  },
  {
    input: "dist/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.css$/, '@reduxjs/toolkit']
  }
];

export default config;