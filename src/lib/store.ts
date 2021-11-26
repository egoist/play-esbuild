import { reactive } from "vue"

export const state = reactive({
  files: new Map([
    [
      "index.ts",
      {
        content: "import { sum } from './sum'\n\nexport default sum(1,2)",
      },
    ],
    [
      "esbuild.config.json",
      {
        content: JSON.stringify(
          { format: "cjs", cdnUrl: "https://cdn.skypack.dev" },
          null,
          2
        ),
      },
    ],
    [
      "sum.ts",
      {
        content: "export const sum = (a: number, b: number) => a + b",
      },
    ],
  ]),
})
