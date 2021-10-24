import * as esbuild from "esbuild-wasm"
import { onMounted, ref } from "vue"

export function useEsbuild(onLoaded?: () => void) {
  const loading = ref(true)
  const error = ref<Error | null>(null)

  onMounted(() => {
    esbuild
      .initialize({
        wasmURL: `/esbuild.wasm`,
      })
      .then(() => {
        loading.value = false
        onLoaded && onLoaded()
      })
      .catch((_error) => {
        error.value = _error
      })
      .finally(() => {
        loading.value = false
      })
  })

  return { loading, error, esbuild }
}
