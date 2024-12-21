import { reactive } from "vue"

export const state = reactive({
  files: new Map([
    [
      "index.ts",
      {
        content: `
import { pipe, string, email } from 'valibot'

const schema = pipe(string(), email())

console.log(schema.parse('hi@exmaple.com'))
        `.trim(),
      },
    ],
    [
      "esbuild.config.json",
      {
        content: JSON.stringify(
          { format: "esm", cdnUrl: "https://esm.sh" },
          null,
          2
        ),
      },
    ],
  ]),
})
