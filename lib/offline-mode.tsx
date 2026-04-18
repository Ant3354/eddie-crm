'use client'

import { useCallback, useEffect, useState } from 'react'

const LS_KEY = 'eddie-offline-mode-override'

export const OFFLINE_MODE_EVENT = 'eddie-offline-mode-changed'

export function readOfflineModeFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'
}

/** Effective offline / LAN-only workflow (env default + optional browser override). */
export function getOfflineMode(): boolean {
  if (typeof window === 'undefined') return readOfflineModeFromEnv()
  const o = localStorage.getItem(LS_KEY)
  if (o === '1') return true
  if (o === '0') return false
  return readOfflineModeFromEnv()
}

export function setOfflineModeOverride(value: boolean | null): void {
  if (typeof window === 'undefined') return
  if (value === null) localStorage.removeItem(LS_KEY)
  else localStorage.setItem(LS_KEY, value ? '1' : '0')
  window.dispatchEvent(new Event(OFFLINE_MODE_EVENT))
}

export function useOfflineMode(): boolean {
  const [v, setV] = useState(false)
  const sync = useCallback(() => setV(getOfflineMode()), [])
  useEffect(() => {
    sync()
    window.addEventListener(OFFLINE_MODE_EVENT, sync)
    return () => window.removeEventListener(OFFLINE_MODE_EVENT, sync)
  }, [sync])
  return v
}
