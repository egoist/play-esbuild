<script lang="ts" setup>
import { logger } from "../lib/esbuild"
</script>

<template>
  <div
    v-if="logger.lines.size > 0"
    class="max-h-48 overflow-auto bg-blue-600 text-gray-200 rounded-lg p-3"
  >
    <div v-for="line in logger.lines">{{ line }}</div>
  </div>
</template>
