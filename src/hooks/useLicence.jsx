import { useState, useEffect, createContext, useContext } from 'react'
import { invoke } from '@tauri-apps/api/core'

const LicenceContext = createContext()

export function LicenceProvider({ children }) {
  const licence = useLicenceSource()
  return (
    <LicenceContext.Provider value={licence}>
      {children}
    </LicenceContext.Provider>
  )
}

export function useLicence() {
  const context = useContext(LicenceContext)
  return context || {}
}

function useLicenceSource() {
  const [status, setStatus] = useState({
    tier: 'community',
    activated: false,
    deep_dive_bundled: false,
    plugins_enabled: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshStatus()
  }, [])

  const refreshStatus = async () => {
    try {
      setLoading(true)
      const res = await invoke('get_licence_status')
      setStatus(res)
    } catch (e) {
      console.error('[licence] Failed to get status:', e)
    } finally {
      setLoading(false)
    }
  }

  const activatePlugin = async (pluginId, key) => {
    try {
      setLoading(true)
      await invoke('activate_plugin_licence', { pluginId, key })
      await refreshStatus()
      return true
    } catch (e) {
      throw e
    } finally {
      setLoading(false)
    }
  }

  return {
    status,
    loading,
    activatePlugin,
    refreshStatus
  }
}
