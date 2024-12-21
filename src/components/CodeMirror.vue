<script lang="ts" setup>
import { ref, onMounted, watchEffect } from "vue"
import CodeMirror from "codemirror"
import "codemirror/mode/javascript/javascript"
import "codemirror/mode/jsx/jsx"
import "codemirror/mode/css/css"

const textarea = ref<HTMLTextAreaElement | null>(null)

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  readOnly: {
    type: Boolean,
  },
})

const emit = defineEmits<{
  (event: "change", value: string): void
}>()

const editor = ref<CodeMirror.EditorFromTextArea | null>(null)

onMounted(() => {
  if (!textarea.value) return

  const cm = (editor.value = CodeMirror.fromTextArea(textarea.value, {
    lineNumbers: true,
    value: props.value,
    readOnly: props.readOnly,
  }))

  cm.on("change", () => {
    emit("change", cm.getValue())
  })

  watchEffect(() => {
    if (cm.getValue() !== props.value) {
      cm.setValue(props.value)
    }
  })

  watchEffect(() => {
    cm.setOption("mode", props.mode)
  })
})
</script>

<template>
  <textarea ref="textarea"></textarea>
</template>
