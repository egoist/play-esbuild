import { Plugin, Loader, formatMessages, PartialMessage } from "esbuild-wasm"
import { reactive } from "vue"
import { resolve, legacy } from "resolve.exports"
import parsePackageName from "parse-package-name"
import { extname, join, urlJoin } from "./path"
import { state } from "./store"
import { builtinModules } from "./builtin-modules"
class Logger {
  lines: Set<string>

  constructor() {
    this.lines = reactive(new Set())
  }

  log(message: string) {
    this.lines.add(message)
  }

  clear() {
    this.lines.clear()
  }
}

export const logger = new Logger()

export const PROJECT_ROOT = "/project/"

const URL_RE = /^https?:\/\//

// https://esbuild.github.io/api/#resolve-extensions
const RESOLVE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".css", ".json"]

const CDN_URL = "https://cdn.jsdelivr.net/npm"

export function resolvePlugin(): Plugin {
  return {
    name: "resolve",
    setup(build) {
      // External modules
      const external = [
        ...(build.initialOptions.external || []),
        ...builtinModules,
      ]

      const isExternal = (id: string) => {
        function match(it: string): boolean {
          if (it === id) return true // import 'foo' & external: ['foo']
          if (id.startsWith(`${it}/`)) return true // import 'foo/bar.js' & external: ['foo']
          return false
        }
        return external.find(match)
      }

      build.onStart(() => {
        logger.clear()
      })

      build.onEnd(() => {
        logger.clear()
      })

      // Intercept import paths starting with "http:" and "https:" so
      // esbuild doesn't attempt to map them to a file system location.
      // Tag them with the "http-url" namespace to associate them with
      // this plugin.
      build.onResolve({ filter: URL_RE }, (args) => ({
        path: args.path,
        namespace: "http-url",
      }))

      // We also want to intercept all import paths inside downloaded
      // files and resolve them against the original URL. All of these
      // files will be in the "http-url" namespace. Make sure to keep
      // the newly resolved URL in the "http-url" namespace so imports
      // inside it will also be resolved as URLs recursively.
      build.onResolve({ filter: /.*/, namespace: "http-url" }, (args) => {
        if (isExternal(args.path)) return { external: true, path: args.path }

        if (!args.path.startsWith(".")) {
          return {
            path: `${CDN_URL}/${args.path}`,
            namespace: "http-url",
          }
        }
        return {
          path: urlJoin(args.pluginData.url, "../", args.path),
          namespace: "http-url",
        }
      })

      build.onResolve({ filter: /.*/ }, async (args) => {
        if (args.path.startsWith(PROJECT_ROOT)) {
          return {
            path: args.path,
          }
        }

        // Relative path
        if (args.path[0] === ".") {
          const absPath = join(args.importer, "..", args.path)
          for (const ext of RESOLVE_EXTENSIONS) {
            const file = state.files.get(
              absPath.replace(PROJECT_ROOT, "") + ext
            )
            if (file) {
              return {
                path: absPath + ext,
              }
            }
          }
          if (state.files.has(absPath.replace(PROJECT_ROOT, ""))) {
            return {
              path: absPath,
            }
          }
          throw new Error(`file not found`)
        }

        if (isExternal(args.path)) return { external: true, path: args.path }

        const parsed = parsePackageName(args.path)
        let subpath = parsed.path
        if (!subpath) {
          const pkg = await fetch(
            `${CDN_URL}/${parsed.name}/package.json`
          ).then((res) => res.json())
          const p =
            resolve(pkg, ".", {
              require:
                args.kind === "require-call" || args.kind === "require-resolve",
            }) || legacy(pkg)
          if (typeof p === "string") {
            subpath = p.replace(/^\.?\/?/, "/")
          }
        }

        if (subpath && subpath[0] !== "/") {
          subpath = `/${subpath}`
        }

        return {
          path: `${CDN_URL}/${parsed.name}${subpath}`,
          namespace: "http-url",
        }
      })

      // Local files
      build.onLoad({ filter: /.*/ }, (args) => {
        if (args.path.startsWith(PROJECT_ROOT)) {
          const name = args.path.replace(PROJECT_ROOT, "")
          const file = state.files.get(name)
          if (file) {
            return {
              contents: file.content,
              loader: inferLoader(args.path),
            }
          }
        }
      })

      build.onLoad({ filter: /.*/, namespace: "http-url" }, async (args) => {
        logger.log(`Fetching ${args.path}`)
        const res = await fetch(args.path)
        if (!res.ok) throw new Error(`failed to load ${res.url}: ${res.status}`)
        const loader = inferLoader(res.url)
        return {
          contents: new Uint8Array(await res.arrayBuffer()),
          loader: loader as Loader,
          pluginData: {
            url: res.url,
          },
        }
      })
    },
  }
}

function inferLoader(p: string): Loader {
  const ext = extname(p)
  if (RESOLVE_EXTENSIONS.includes(ext)) {
    return ext.slice(1) as Loader
  }
  if (ext === ".mjs" || ext === ".cjs") {
    return "js"
  }
  return "text"
}

export function formatBuildErrors(errors: PartialMessage[]) {
  return formatMessages(errors, { kind: "error" }).then((res) =>
    res.join("\n\n")
  )
}
