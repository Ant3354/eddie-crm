'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GitMerge, Mail, Phone, Users, AlertTriangle } from 'lucide-react'

type ContactMini = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  mobilePhone: string | null
}

interface Group {
  ids: string[]
  reason: string
  contacts?: ContactMini[]
}

export default function MergeContactsPage() {
  const [byEmail, setByEmail] = useState<Group[]>([])
  const [byPhone, setByPhone] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{
    group: Group
    targetId: string
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contacts/dedupe?preview=1')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setByEmail(data.byEmail || [])
      setByPhone(data.byPhone || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openMergeModal(group: Group) {
    const contacts = group.contacts || []
    const targetId =
      [...contacts].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      )[0]?.id || group.ids[0]
    setModal({ group, targetId })
  }

  async function confirmMerge() {
    if (!modal) return
    const { group, targetId } = modal
    const sourceIds = group.ids.filter((id) => id !== targetId)
    if (sourceIds.length === 0) {
      setError('Pick a different target — all IDs would be removed.')
      return
    }
    setMerging(group.reason)
    setError(null)
    try {
      const res = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, sourceIds }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Merge failed')
      setModal(null)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Merge failed')
    } finally {
      setMerging(null)
    }
  }

  function renderGroupCard(g: Group) {
    const contacts = g.contacts || []
    return (
      <div
        key={g.reason}
        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40"
      >
        <div className="text-sm font-semibold mb-1 break-all">{g.reason}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {g.ids.length} matching contacts — merges move policies, tasks, files, and sensitive data into the
          target.
        </div>
        {contacts.length > 0 ? (
          <ul className="text-xs space-y-1 mb-3 max-h-40 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded p-2 bg-gray-50 dark:bg-gray-950/50">
            {contacts.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {c.firstName} {c.lastName}
                </span>
                <span className="text-gray-500 truncate font-mono text-[10px]">{c.id}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <Button size="sm" onClick={() => openMergeModal(g)} disabled={merging === g.reason}>
          Preview merge…
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg">
            <GitMerge className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Merge duplicates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Preview each group, choose the contact row to keep, then confirm. All actions are audit-logged.
            </p>
          </div>
        </div>
        <div className="mb-6">
          <Link href="/contacts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to contacts
          </Link>
        </div>

        {error ? (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Scanning duplicates...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> By email
                </CardTitle>
              </CardHeader>
              <CardContent>
                {byEmail.length === 0 ? (
                  <div className="text-sm text-gray-500">No duplicates by email</div>
                ) : (
                  <div className="space-y-3">{byEmail.map((g) => renderGroupCard(g))}</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> By phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                {byPhone.length === 0 ? (
                  <div className="text-sm text-gray-500">No duplicates by phone</div>
                ) : (
                  <div className="space-y-3">{byPhone.map((g) => renderGroupCard(g))}</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-lg shadow-2xl border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Confirm merge
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-normal break-all">
                {modal.group.reason}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Keep all data under one contact. Choose the <strong>target</strong> row to preserve (others are
                merged in then deleted).
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Target contact
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  value={modal.targetId}
                  onChange={(e) => setModal({ ...modal, targetId: e.target.value })}
                >
                  {(modal.group.contacts || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                      {c.email ? ` · ${c.email}` : ''}
                      {c.mobilePhone ? ` · ${c.mobilePhone}` : ''} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={merging !== null}
                  onClick={() => void confirmMerge()}
                >
                  {merging ? 'Merging…' : 'Merge into target'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
