<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

defineProps<{
  loginServer: string | null
  authkey: string
  shields: boolean
  exitNode: boolean
  lanAccess: boolean
}>()

const emit = defineEmits<{
  'update:authkey': [value: string]
  'update:shields': [value: boolean]
  'update:exitNode': [value: boolean]
  'update:lanAccess': [value: boolean]
}>()
</script>

<template>
  <div class="space-y-4">
    <div v-if="loginServer" class="space-y-2">
      <Label>Server URL</Label>
      <Input :model-value="loginServer" readonly />
    </div>
    <div class="space-y-2">
      <Label>Auth Key</Label>
      <Input
        type="password"
        placeholder="tskey-auth-…"
        :model-value="authkey"
        @update:model-value="emit('update:authkey', $event as string)"
      />
    </div>
    <div class="space-y-4 pt-2">
      <div class="flex items-center justify-between">
        <Label for="shields">Shields Up</Label>
        <Switch id="shields" :model-value="shields" @update:model-value="emit('update:shields', $event as boolean)" />
      </div>
      <div class="flex items-center justify-between">
        <Label for="exitNode">Advertise as Exit Node</Label>
        <Switch id="exitNode" :model-value="exitNode" @update:model-value="emit('update:exitNode', $event as boolean)" />
      </div>
      <div class="flex items-center justify-between">
        <Label for="lanAccess">Advertise Local LAN (192.168.0.0/16)</Label>
        <Switch id="lanAccess" :model-value="lanAccess" @update:model-value="emit('update:lanAccess', $event as boolean)" />
      </div>
    </div>
  </div>
</template>
