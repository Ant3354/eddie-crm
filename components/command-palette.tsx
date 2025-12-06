'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Command, UserPlus, Megaphone, TestTube, QrCode, LayoutDashboard, Users, Settings } from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon?: any
  action: () => void
  keywords?: string[]
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const items: CommandItem[] = useMemo(() => ([
    { id: 'go-dashboard', label: 'Go to Dashboard', hint: 'Navigate', icon: LayoutDashboard, action: () => router.push('/dashboard'), keywords: ['home','kpi'] },
    { id: 'go-contacts', label: 'Go to Contacts', hint: 'Navigate', icon: Users, action: () => router.push('/contacts'), keywords: ['people','clients'] },
    { id: 'go-campaigns', label: 'Go to Campaigns', hint: 'Navigate', icon: Megaphone, action: () => router.push('/campaigns') },
    { id: 'go-qrcodes', label: 'Go to QR Codes', hint: 'Navigate', icon: QrCode, action: () => router.push('/qrcodes') },
    { id: 'go-integrations', label: 'Go to Integrations', hint: 'Navigate', icon: Settings, action: () => router.push('/integrations') },
    { id: 'new-contact', label: 'New Contact', hint: 'Action', icon: UserPlus, action: () => router.push('/contacts/new'), keywords: ['create','add'] },
    { id: 'new-campaign', label: 'New Campaign', hint: 'Action', icon: Megaphone, action: () => router.push('/campaigns/new') },
    { id: 'run-tests', label: 'Run System Tests', hint: 'Action', icon: TestTube, action: () => router.push('/test') },
  ]), [router])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(i => i.label.toLowerCase().includes(q) || i.keywords?.some(k => k.includes(q)))
  }, [items, query])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
        title="Command Palette (Ctrl+K)"
      >
        <Command className="w-4 h-4" />
        <span className="hidden md:inline">Command</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Ctrl+K</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)}></div>
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[90vw] max-w-xl">
        <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
              placeholder="Type a command or search (e.g., Contacts, New Contact)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {filtered.map((item) => {
              const Icon = item.icon || Command
              return (
                <button
                  key={item.id}
                  onClick={() => { setOpen(false); item.action() }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
                >
                  <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    {item.hint && <div className="text-xs text-gray-500 dark:text-gray-400">{item.hint}</div>}
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No results</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
