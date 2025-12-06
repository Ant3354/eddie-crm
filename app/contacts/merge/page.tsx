'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GitMerge, Mail, Phone, Users } from 'lucide-react'

interface Group { ids: string[], reason: string }

export default function MergeContactsPage() {
  const [byEmail, setByEmail] = useState<Group[]>([])
  const [byPhone, setByPhone] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState<string | null>(null)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts/dedupe')
      const data = await res.json()
      setByEmail(data.byEmail || [])
      setByPhone(data.byPhone || [])
    } finally { setLoading(false) }
  }

  async function merge(group: Group) {
    const targetId = prompt(`Enter the TARGET contact id to keep for reason: ${group.reason}`)?.trim()
    if (!targetId) return
    const sourceIds = group.ids.filter(id => id !== targetId)
    if (sourceIds.length === 0) return
    setMerging(group.reason)
    try {
      const res = await fetch('/api/contacts/merge', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ targetId, sourceIds }) })
      if (res.ok) load()
    } finally { setMerging(null) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg">
            <GitMerge className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Merge Duplicates</h1>
            <p className="text-gray-600 dark:text-gray-400">Find duplicates by email or phone and merge safely</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Scanning duplicates...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> By Email</CardTitle>
              </CardHeader>
              <CardContent>
                {byEmail.length === 0 ? (
                  <div className="text-sm text-gray-500">No duplicates by email</div>
                ) : (
                  <div className="space-y-3">
                    {byEmail.map((g) => (
                      <div key={g.reason} className="p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-semibold mb-1">{g.reason}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{g.ids.length} matching contacts</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => merge(g)} disabled={merging === g.reason}>Merge</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="w-4 h-4" /> By Phone</CardTitle>
              </CardHeader>
              <CardContent>
                {byPhone.length === 0 ? (
                  <div className="text-sm text-gray-500">No duplicates by phone</div>
                ) : (
                  <div className="space-y-3">
                    {byPhone.map((g) => (
                      <div key={g.reason} className="p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-semibold mb-1">{g.reason}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{g.ids.length} matching contacts</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => merge(g)} disabled={merging === g.reason}>Merge</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
