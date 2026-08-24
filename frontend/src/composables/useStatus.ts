import { ref, onMounted, onUnmounted } from 'vue'
import { useApi } from './useApi'

export interface SelfInfo {
  HostName: string
  DNSName: string
  ID: string
  TailscaleIPs: string[]
  UserID: number
  AllowedIPs: string[]
  ShieldsUp?: boolean
}

export interface PeerInfo {
  HostName: string
  DNSName: string
  TailscaleIPs: string[]
  UserID: number
  Online: boolean
}

export interface UserInfo {
  DisplayName: string
}

export interface TailscaleStatus {
  BackendState: string
  MagicDNSSuffix: string
  Self?: SelfInfo
  User?: Record<string, UserInfo>
  Peer?: Record<string, PeerInfo>
}

export interface PrefsInfo {
  advertiseRoutes: string[]
  shieldsUp?: boolean
}

export function useStatus() {
  const { api } = useApi()
  const status = ref<TailscaleStatus | null>(null)
  const version = ref('')
  const config = ref<{ loginServer: string | null }>({ loginServer: null })
  const prefs = ref<PrefsInfo | null>(null)
  const error = ref(false)
  let interval: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      status.value = await api<TailscaleStatus>('GET', '/api/status')
      error.value = false
    } catch {
      error.value = true
    }
    try {
      prefs.value = await api<PrefsInfo>('GET', '/api/prefs')
    } catch {}
  }

  async function fetchVersion() {
    try {
      const data = await api<{ version: string }>('GET', '/api/version')
      version.value = data.version?.split('\n')[0] || ''
    } catch {}
  }

  async function fetchConfig() {
    try {
      config.value = await api<{ loginServer: string | null }>('GET', '/api/config')
    } catch {}
  }

  onMounted(async () => {
    await Promise.all([refresh(), fetchVersion(), fetchConfig()])
    interval = setInterval(refresh, 15000)
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  return { status, version, config, prefs, error, refresh }
}
