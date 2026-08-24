<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useStatus } from '@/composables/useStatus'
import { useApi } from '@/composables/useApi'
import { useLog } from '@/composables/useLog'
import { Sun, Moon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import StatusPanel from '@/components/StatusPanel.vue'
import ControlsPanel from '@/components/ControlsPanel.vue'
import PeersPanel from '@/components/PeersPanel.vue'
import LogPanel from '@/components/LogPanel.vue'

const { status, version, config, refresh } = useStatus()
const { api } = useApi()
const { entries, hidden, log, logHtml, clear, toggleHidden } = useLog()

const shields = ref(false)
const exitNode = ref(false)
const lanAccess = ref(false)
const authkey = ref('')
const showingControls = ref(false)
const loginDisabled = ref(false)
const isDark = ref(true)

const self = computed(() => status.value?.Self ?? null)
const selfUser = computed(() => {
  const id = status.value?.Self?.UserID
  return (id && status.value?.User) ? status.value.User[String(id)] ?? null : null
})
const peers = computed(() => {
  const all = Object.values(status.value?.Peer ?? {})
  const selfId = status.value?.Self?.UserID
  return selfId ? all.filter(p => String(p.UserID) === String(selfId)) : all
})
const isRunning = computed(() => status.value?.BackendState === 'Running')
const isAuthed = computed(() => isRunning.value || status.value?.BackendState === 'Stopped')
const loginServer = computed(() => config.value?.loginServer ?? null)

watchEffect(() => {
  const ips = status.value?.Self?.AllowedIPs
  if (ips) {
    exitNode.value = ips.includes('0.0.0.0/0') || ips.includes('::/0')
    lanAccess.value = ips.includes('192.168.0.0/16')
  }
})

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light') {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
})

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function togglePanel() {
  showingControls.value = !showingControls.value
}

async function doUp() {
  log('Connecting…')
  const body: Record<string, unknown> = {}
  if (authkey.value) body.authkey = authkey.value
  body.shields = shields.value
  body.exitNode = exitNode.value
  body.lanAccess = lanAccess.value
  const data = await api<{ stdout?: string; stderr?: string; error?: string }>('POST', '/api/up', body)
  log(data.stdout || data.stderr || data.error || JSON.stringify(data))
  setTimeout(refresh, 1500)
}

async function doDown() {
  log('Disconnecting…')
  const data = await api<{ stdout?: string; stderr?: string; error?: string }>('POST', '/api/down')
  log(data.stdout || data.stderr || data.error || 'Done')
  setTimeout(refresh, 1000)
}

async function doLogin() {
  loginDisabled.value = true
  log('Contacting login server…')

  let urlOpened = false
  const URL_RE = /https?:\/\/[^\s&]+/

  try {
    const response = await fetch('/api/login', { method: 'POST' })
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        log('[process exited]')
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const text = JSON.parse(line.slice(6))
            if (!urlOpened) {
              const match = String(text).match(URL_RE)
              if (match) {
                window.open(match[0], '_blank')
                urlOpened = true
              }
            }
            const escaped = String(text)
              .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            const linked = escaped.replace(
              /(https?:\/\/[^\s&]+)/g,
              '<a href="$1" target="_blank" rel="noopener" style="color:#3b82f6">$1</a>'
            )
            logHtml(linked)
          } catch {}
        }
      }
    }
  } catch (e: any) {
    log('Error: ' + e.message)
  }

  loginDisabled.value = false
  setTimeout(refresh, 1500)
}

async function doLogout() {
  if (!confirm('Log out of Tailscale?')) return
  log('Logging out…')
  const data = await api<{ stdout?: string; stderr?: string; error?: string }>('POST', '/api/logout')
  log(data.stdout || data.stderr || data.error || 'Done')
  setTimeout(refresh, 1000)
}
</script>

<template>
  <div class="min-h-screen p-6 flex flex-col items-center">
    <div class="w-full max-w-5xl">
      <!-- Header -->
      <header class="flex items-center gap-3 mb-7">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-lg shrink-0">
            🔒
          </div>
          <div>
            <h1 class="text-xl font-semibold">Tailnet Client</h1>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-normal mt-0.5">
              {{ version || 'Loading…' }}
            </Badge>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <Button
            v-if="!isAuthed"
            variant="default"
            size="sm"
            :disabled="loginDisabled"
            @click="doLogin"
          >
            ⇒ Login
          </Button>
          <Button
            v-if="isAuthed"
            :variant="isRunning ? 'destructive' : 'default'"
            size="sm"
            @click="isRunning ? doDown() : doUp()"
          >
            {{ isRunning ? '■ Disconnect' : '▶ Connect' }}
          </Button>
          <Button v-if="isAuthed" variant="ghost" size="sm" class="text-muted-foreground" @click="doLogout">⇥ Logout</Button>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleDark" :title="isDark ? 'Light mode' : 'Dark mode'">
            <Sun v-if="!isDark" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
        </div>
      </header>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Combined Status / Controls Card -->
        <Card>
          <CardHeader class="pb-0 flex-row items-center justify-between">
            <CardTitle class="text-xs uppercase tracking-wider text-muted-foreground">
              ● {{ showingControls ? 'Controls' : 'Status' }}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              :class="showingControls ? 'text-primary' : ''"
              @click="togglePanel"
              title="Toggle controls"
            >
              ⚙
            </Button>
          </CardHeader>
          <CardContent class="pt-4">
            <StatusPanel v-if="!showingControls" :self="self" :user="selfUser" :state="status?.BackendState ?? 'Unknown'" />
            <ControlsPanel
              v-else
              :login-server="loginServer"
              :authkey="authkey"
              :shields="shields"
              :exit-node="exitNode"
              :lan-access="lanAccess"
              @update:authkey="authkey = $event"
              @update:shields="shields = $event"
              @update:exit-node="exitNode = $event"
              @update:lan-access="lanAccess = $event"
            />
          </CardContent>
        </Card>

        <!-- Peers Card -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-xs uppercase tracking-wider text-muted-foreground">
              ◈ Peers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PeersPanel :peers="peers" :magic-dns-suffix="status?.MagicDNSSuffix ?? ''" />
          </CardContent>
        </Card>
      </div>

      <!-- Log Panel -->
      <LogPanel
        :entries="entries"
        :hidden="hidden"
        @clear="clear"
        @toggle-hidden="toggleHidden"
      />
    </div>
  </div>
</template>
