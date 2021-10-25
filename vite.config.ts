import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import ejs from "ejs"

export default defineConfig((ctx) => {
  return {
    plugins: [
      vue(),
      {
        name: "ejs-html",
        transformIndexHtml: {
          enforce: "pre",
          transform(html) {
            return ejs.render(html, { prod: ctx.mode === "production" })
          },
        },
      },
    ],
  }
})
