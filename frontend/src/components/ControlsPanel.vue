<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

defineProps<{
  loginServer: string | null
  authkey: string
  shields: boolean
  ssh: boolean
  exitNode: boolean
  lanAccess: boolean
  exitNodePending?: boolean
  lanAccessPending?: boolean
  hostnameDraft?: string
  hostnameSaving?: boolean
  showHostnameSave?: boolean
}>()

const emit = defineEmits<{
  'update:authkey': [value: string]
  'update:shields': [value: boolean]
  'update:ssh': [value: boolean]
  'update:exitNode': [value: boolean]
  'update:lanAccess': [value: boolean]
  'update:hostnameDraft': [value: string]
  saveHostname: []
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
    <div class="space-y-2">
      <Label for="hostname">Hostname</Label>
      <div class="flex items-center gap-2">
        <Input
          id="hostname"
          placeholder="my-device"
          :model-value="hostnameDraft"
          @update:model-value="emit('update:hostnameDraft', $event as string)"
        />
        <Button
          v-if="showHostnameSave"
          size="sm"
          :disabled="hostnameSaving"
          @click="emit('saveHostname')"
        >
          {{ hostnameSaving ? 'Saving…' : 'Save' }}
        </Button>
      </div>
    </div>
    <div class="space-y-4 pt-2">
      <div class="flex items-center justify-between">
        <Label for="shields">Shields Up</Label>
        <Switch id="shields" :model-value="shields" @update:model-value="emit('update:shields', $event as boolean)" />
      </div>
      <div class="flex items-center justify-between">
        <Label for="ssh">Allow SSH via Tailnet</Label>
        <Switch id="ssh" :model-value="ssh" @update:model-value="emit('update:ssh', $event as boolean)" />
      </div>
      <div class="flex items-center justify-between">
        <div>
          <Label for="exitNode">Advertise as Exit Node</Label>
          <div v-if="exitNodePending" class="text-xs text-amber-500">awaiting admin approval</div>
        </div>
        <Switch id="exitNode" :model-value="exitNode" @update:model-value="emit('update:exitNode', $event as boolean)" />
      </div>
      <div class="flex items-center justify-between">
        <div>
          <Label for="lanAccess">Advertise Local LAN (192.168.0.0/16)</Label>
          <div v-if="lanAccessPending" class="text-xs text-amber-500">awaiting admin approval</div>
        </div>
        <Switch id="lanAccess" :model-value="lanAccess" @update:model-value="emit('update:lanAccess', $event as boolean)" />
      </div>
    </div>
  </div>
</template>
