import { ref } from 'vue'

export interface LogEntry {
  content: string
  html: boolean
}

export function useLog() {
  const entries = ref<LogEntry[]>([])
  const hidden = ref(false)

  function log(msg: string) {
    entries.value.push({ content: msg + '\n', html: false })
  }

  function logHtml(html: string) {
    entries.value.push({ content: html, html: true })
  }

  function clear() {
    entries.value = []
  }

  function toggleHidden() {
    hidden.value = !hidden.value
  }

  return { entries, hidden, log, logHtml, clear, toggleHidden }
}
