'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Users, ArrowLeft } from 'lucide-react'
import { asArray } from '@/lib/as-array'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  mobilePhone?: string
  status: 'LEAD' | 'SCHEDULED' | 'ENROLLED' | 'ACTIVE_CLIENT'
}

const STATUSES: Array<Contact['status']> = ['LEAD','SCHEDULED','ENROLLED','ACTIVE_CLIENT']

export default function PipelinePage() {
  const [columns, setColumns] = useState<Record<string, Contact[]>>({ LEAD: [], SCHEDULED: [], ENROLLED: [], ACTIVE_CLIENT: [] })
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<Contact | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts')
      const raw = await res.json()
      const data = asArray<Contact>(raw)
      const grouped: Record<string, Contact[]> = { LEAD: [], SCHEDULED: [], ENROLLED: [], ACTIVE_CLIENT: [] }
      for (const c of data) {
        if (!grouped[c.status]) grouped[c.status] = []
        grouped[c.status].push(c)
      }
      setColumns(grouped)
    } finally { setLoading(false) }
  }

  function onDragStart(contact: Contact) { setDragging(contact) }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  async function onDrop(status: Contact['status']) {
    if (!dragging || dragging.status === status) return
    const contact = dragging
    setDragging(null)
    // optimistic UI
    setColumns(prev => {
      const next = { ...prev }
      next[contact.status] = next[contact.status].filter(c => c.id !== contact.id)
      next[status] = [{ ...contact, status }, ...next[status]]
      return next
    })
    try {
      await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
    } catch {
      // reload on error
      load()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl shadow-lg">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Pipeline</h1>
              <p className="text-gray-600 dark:text-gray-400">Drag contacts across stages</p>
            </div>
          </div>
          <Link href="/contacts">
            <Button variant="outline" className="border-gray-300 dark:border-gray-700"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pipeline...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map(status => (
              <Card key={status} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{status.replace(/_/g,' ')}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Users className="w-3 h-3" />{columns[status]?.length || 0}</div>
                </CardHeader>
                <CardContent>
                  <div
                    className="min-h-[300px] space-y-2 p-1 rounded-lg"
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(status)}
                  >
                    {columns[status]?.map(contact => (
                      <div
                        key={contact.id}
                        draggable
                        onDragStart={() => onDragStart(contact)}
                        className="p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">{contact.firstName} {contact.lastName}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{contact.email || contact.mobilePhone || '—'}</div>
                        <Link href={`/contacts/${contact.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View</Link>
                      </div>
                    ))}
                    {(!columns[status] || columns[status].length === 0) && (
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400 py-6">Drop contacts here</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
