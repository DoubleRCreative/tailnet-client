<script setup lang="ts">
import type { PeerInfo } from '@/composables/useStatus'

defineProps<{
  peers: PeerInfo[]
}>()
</script>

<template>
  <div v-if="peers.length === 0" class="text-muted-foreground text-sm text-center py-5">
    No peers found
  </div>
  <div v-else class="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
    <div
      v-for="(peer, i) in peers"
      :key="i"
      class="flex items-center gap-2.5 bg-muted/50 rounded-lg px-3 py-2.5"
    >
      <div
        class="w-2 h-2 rounded-full shrink-0"
        :class="peer.Online ? 'bg-green-500' : 'bg-muted-foreground'"
      />
      <div class="min-w-0 flex-1">
        <div class="text-sm font-medium truncate">{{ peer.HostName || peer.DNSName || 'unknown' }}</div>
        <div class="text-xs text-muted-foreground font-mono">{{ (peer.TailscaleIPs || []).join(', ') }}</div>
      </div>
    </div>
  </div>
</template>
