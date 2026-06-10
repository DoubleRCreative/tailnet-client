<script setup lang="ts">
import type { LogEntry } from '@/composables/useLog'
import { Button } from '@/components/ui/button'

defineProps<{
  entries: LogEntry[]
  hidden: boolean
}>()

const emit = defineEmits<{
  clear: []
  toggleHidden: []
}>()
</script>

<template>
  <div class="mt-5 rounded-lg border bg-card text-card-foreground" :class="hidden ? 'pb-2' : ''">
    <div class="flex items-center gap-2 px-5 pt-4 pb-2">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📋 Logs</span>
      <div class="ml-auto flex gap-1.5">
        <Button variant="ghost" size="sm" @click="emit('clear')">Clear</Button>
        <Button variant="ghost" size="sm" @click="emit('toggleHidden')">{{ hidden ? 'Show' : 'Hide' }}</Button>
      </div>
    </div>
    <div v-if="!hidden" class="px-5 pb-5">
      <pre class="bg-muted/50 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all text-muted-foreground max-h-[300px] overflow-y-auto">
        <template v-for="(entry, i) in entries" :key="i">
          <span v-if="!entry.html">{{ entry.content }}</span>
          <span v-else v-html="entry.content"></span>
        </template>
      </pre>
    </div>
  </div>
</template>
