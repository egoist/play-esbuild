<script lang="ts" setup>
import type { OutputFile } from "esbuild-wasm"
import { computed, ref, onMounted, watchEffect } from "vue"
import { useEsbuild } from "../hooks/useEsbuild"
import { getMode } from "../lib/editor"
import { resolvePlugin, files, formatBuildErrors, logger } from "../lib/esbuild"
import CodeMirror from "./CodeMirror.vue"
import BuildLogs from "./BuildLogs.vue"
import { atou, debounce, utoa } from "../lib/utils"

const building = ref(false)
const buildError = ref<string | null>(null)

const outputFiles = ref<null | OutputFile[]>(null)

const activeFileName = ref<string>("index.ts")

const activeFile = computed(() => {
  return files.get(activeFileName.value)
})

const createNewFile = () => {
  const name = `file-${files.size}.ts`
  files.set(name, {
    content: ``,
  })
  activeFileName.value = name
}

const deleteFile = (name: string) => {
  const names = [...files.keys()]
  const index = names.indexOf(name)
  files.delete(name)
  const prevFileName = names[index - 1]
  activeFileName.value = prevFileName
}

const { esbuild, loading: esbuildLoading } = useEsbuild()

const bundle = async () => {
  try {
    if (esbuildLoading.value) {
      throw new Error(`esbuild has not been loaded`)
    }
    building.value = true
    buildError.value = null
    outputFiles.value = null

    const userConfig = JSON.parse(files.get("esbuild.config.json")!.content)
    const result = await esbuild.build({
      ...userConfig,
      entryPoints: ["/project/index.ts"],
      outdir: "/dist",
      format: userConfig.format || "cjs",
      write: false,
      bundle: true,
      plugins: [resolvePlugin()],
    })

    outputFiles.value = result.outputFiles
    console.log("bundle success")
  } catch (error) {
    // @ts-expect-error
    if (error.errors) {
      // @ts-expect-error
      buildError.value = await formatBuildErrors(error.errors)
    } else if (error instanceof Error) {
      buildError.value = error.message
    } else {
      console.error(error)
    }
  } finally {
    building.value = false
  }
}

const handleEditorChange = debounce((value: string) => {
  activeFile.value!.content = value
}, 200)

const mode = computed(() => {
  if (!activeFileName.value) return "markup"

  return getMode(activeFileName.value) || "markup"
})

const updateHash = () => {
  const hash = `#${utoa(JSON.stringify(Array.from(files)))}`
  if (hash !== location.hash) {
    history.pushState({}, "", hash)
  }
}

const hash = location.hash
onMounted(() => {
  if (hash) {
    const arr = JSON.parse(atou(hash.slice(1)))
    for (const item of arr) {
      files.set(item[0], item[1])
    }
  }
})

watchEffect(() => {
  updateHash()
})
</script>

<template>
  <div>
    <div class="flex flex-col h-screen">
      <header class="flex justify-between items-center border-b h-header pr-3">
        <div class="flex items-center h-full">
          <h1 class="font-bold text-xl">
            <a href="/" class="px-2">esbuild</a>
          </h1>
          <ul class="flex h-full">
            <li v-for="[name] in files" :key="name" class="h-full">
              <button
                class="
                  px-3
                  h-full
                  flex
                  items-center
                  select-none
                  space-x-2
                  group
                "
                :class="[activeFileName === name && `bg-gray-100`]"
                @click="activeFileName = name"
              >
                <span>{{ name }}</span>
                <span
                  v-if="name !== 'index.ts' && name !== 'esbuild.config.json'"
                  class="
                    w-5
                    h-5
                    flex
                    items-center
                    justify-center
                    rounded-md
                    invisible
                    bg-gray-200
                    hover:bg-red-600 hover:text-white
                    group-hover:visible
                  "
                  @click.stop="deleteFile(name)"
                  ><svg
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path></svg
                ></span>
              </button>
            </li>
            <li class="h-full">
              <button
                class="px-3 h-full flex items-center text-sm"
                @click="createNewFile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  aria-hidden="true"
                  role="img"
                  class="iconify iconify--mdi"
                  width="1.2em"
                  height="1.2em"
                  preserveAspectRatio="xMidYMid meet"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 9h5.5L13 3.5V9M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2m5 13v-3H9v3H6v2h3v3h2v-3h3v-2h-3z"
                    fill="currentColor"
                  ></path>
                </svg>
                <span class="ml-2">New File</span>
              </button>
            </li>
          </ul>
        </div>
        <div class="flex space-x-4">
          <a href="https://github.com/egoist/play-esbuild" target="_blank"
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              aria-hidden="true"
              role="img"
              class="iconify iconify--mdi"
              width="32"
              height="32"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
                fill="currentColor"
              ></path></svg
          ></a>
          <button
            class="
              bg-blue-500
              rounded-lg
              text-white
              h-8
              text-sm
              px-3
              pl-2
              flex
              items-center
              space-x-2
            "
            :class="[building && 'opacity-50']"
            @click="bundle"
            :disabled="building"
          >
            <span
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                aria-hidden="true"
                role="img"
                class="iconify iconify--ph"
                width="1.2em"
                height="1.2em"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 256 256"
              >
                <path
                  d="M239.969 128a15.9 15.9 0 0 1-7.656 13.656l-143.97 87.985A15.998 15.998 0 0 1 64 215.992V40.008a15.998 15.998 0 0 1 24.344-13.649l143.969 87.985A15.9 15.9 0 0 1 239.969 128z"
                  fill="currentColor"
                ></path></svg></span
            ><span>{{ building ? "Bundling" : "Bundle" }}</span>
          </button>
        </div>
      </header>

      <main class="flex h-main divide-x">
        <div class="w-1/2">
          <CodeMirror
            v-if="activeFile"
            :value="activeFile.content"
            :mode="mode"
            @change="handleEditorChange"
          ></CodeMirror>
        </div>

        <div class="w-1/2 h-full overflow-auto">
          <div class="p-3" v-if="esbuildLoading">
            <div class="p-3 bg-blue-500 rounded-lg text-white mb-4">
              Loading the WASM build of esbuild..
            </div>
          </div>
          <div class="p-3" v-if="buildError">
            <div
              class="p-3 bg-red-500 text-white rounded-lg mb-4 overflow-auto"
            >
              <pre>{{ buildError }}</pre>
            </div>
          </div>
          <div v-if="logger.lines.size > 0" class="p-3">
            <BuildLogs />
          </div>
          <div v-if="outputFiles">
            <div v-for="file in outputFiles" :key="file.path">
              <CodeMirror
                mode="javascript"
                class="w-full"
                :value="file.text"
                readOnly
              ></CodeMirror>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
