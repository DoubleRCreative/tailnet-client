<script setup lang="ts">
import type { SelfInfo, UserInfo } from '@/composables/useStatus'

defineProps<{
  self: SelfInfo | null | undefined
  user: UserInfo | null | undefined
  state: string
}>()
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <div
        class="w-2.5 h-2.5 rounded-full shrink-0"
        :class="state === 'Running' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'"
      />
      <span class="text-base font-semibold">{{ state }}</span>
    </div>
    <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <span class="text-muted-foreground">Network</span>
      <span class="font-mono break-all">{{ user?.DisplayName || '—' }}</span>
      <span class="text-muted-foreground">Hostname</span>
      <span class="font-mono break-all">{{ self?.HostName || '—' }}</span>
      <span class="text-muted-foreground">Node Name</span>
      <span class="font-mono break-all">{{ self?.DNSName || '—' }}</span>
      <span class="text-muted-foreground">Node ID</span>
      <span class="font-mono break-all">{{ self?.ID || '—' }}</span>
      <span class="text-muted-foreground">IPs</span>
      <span class="font-mono break-all">{{ self?.TailscaleIPs?.join(', ') || '—' }}</span>
    </div>
  </div>
</template>
