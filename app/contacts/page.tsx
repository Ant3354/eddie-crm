'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Search, Filter, Download, Upload, Plus, Mail, Phone, AlertTriangle, Tag, Calendar, TrendingUp, Save as SaveIcon, Trash2 } from 'lucide-react'
import { asArray } from '@/lib/as-array'
import { getContactDisplayIdentity } from '@/lib/contact-identity-display'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  mobilePhone?: string
  address?: string
  category: string
  status: string
  paymentIssueAlert: boolean
  tags: Array<{ name: string }>
  enrolledDate?: string
  lastJotformSubmissionAt?: string
  updatedAt?: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ category: '', status: '', paymentAlert: '', search: '' })
  const [stats, setStats] = useState({ total: 0, alerts: 0, enrolled: 0 })
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const selectedIds = Object.entries(selected).filter(([,v])=>v).map(([id])=>id)

  const loadContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.category) params.set('category', filter.category)
      if (filter.status) params.set('status', filter.status)
      if (filter.paymentAlert === 'true') params.set('paymentAlert', 'true')
      if (filter.search) params.set('search', filter.search)

      const res = await fetch(`/api/contacts?${params}`, { cache: 'no-store' })
      const raw = await res.json()
      const data = asArray<Contact>(raw)
      setContacts(data)

      // Calculate stats
      setStats({
        total: data.length,
        alerts: data.filter((c) => c.paymentIssueAlert).length,
        enrolled: data.filter((c) => c.status === 'ENROLLED' || c.status === 'ACTIVE_CLIENT').length,
      })
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadContacts()
    }, 300)
    return () => clearTimeout(timeout)
  }, [loadContacts])

  useEffect(() => {
    const t = setInterval(() => {
      void loadContacts()
    }, 10000)
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadContacts()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [loadContacts])

  async function bulkAddTag() {
    const name = prompt('Enter tag to add to selected contacts:')?.trim()
    if (!name || selectedIds.length===0) return
    await fetch('/api/contacts/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'addTag', contactIds: selectedIds, tag: name }) })
    await loadContacts()
    setSelected({})
  }

  async function bulkDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`Permanently delete ${selectedIds.length} contact(s)? This cannot be undone.`)) return
    const res = await fetch('/api/contacts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', contactIds: selectedIds }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert((err as { error?: string }).error || 'Delete failed')
      return
    }
    setSelected({})
    await loadContacts()
  }

  function toggleAll(v: boolean) {
    const next: Record<string, boolean> = {}
    for (const c of contacts) next[c.id] = v
    setSelected(next)
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      LEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      SCHEDULED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ENROLLED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      ACTIVE_CLIENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      CONSUMER: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      DENTAL_OFFICE_PARTNER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      HEALTH_OFFICE_PARTNER: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      OTHER_BUSINESS_PARTNER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      PROSPECT: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    }
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Contacts
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your customer relationships</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-red-200/50 dark:border-red-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Alerts</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.alerts}</p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.enrolled}</p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Link href="/contacts/new">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                New Contact
              </Button>
            </Link>
            <Link href="/contacts/import">
              <Button variant="outline" className="border-gray-300 dark:border-gray-700">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-gray-300 dark:border-gray-700"
              onClick={async () => {
                const params = new URLSearchParams()
                if (filter.category) params.set('category', filter.category)
                if (filter.status) params.set('status', filter.status)
                const url = `/api/contacts/export?${params}`
                window.open(url, '_blank')
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  <option value="CONSUMER">Consumer</option>
                  <option value="DENTAL_OFFICE_PARTNER">Dental Office Partner</option>
                  <option value="HEALTH_OFFICE_PARTNER">Health Office Partner</option>
                  <option value="OTHER_BUSINESS_PARTNER">Other Business Partner</option>
                  <option value="PROSPECT">Prospect</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="LEAD">Lead</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ENROLLED">Enrolled</option>
                  <option value="ACTIVE_CLIENT">Active Client</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Payment Alert</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={filter.paymentAlert}
                  onChange={(e) => setFilter({ ...filter, paymentAlert: e.target.value })}
                >
                  <option value="">All Contacts</option>
                  <option value="true">Payment Issues Only</option>
                </select>
              </div>
            </div>

            {/* Saved Views */}
            <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <SaveIcon className="w-4 h-4" /> Saved Views
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-700 text-xs"
                    onClick={() => {
                      const name = prompt('Name this view:')?.trim()
                      if (!name) return
                      try {
                        const key = 'eddiecrm_contacts_views'
                        const views = JSON.parse(localStorage.getItem(key) || '[]') as any[]
                        const exists = views.some(v => v.name.toLowerCase() === name.toLowerCase())
                        const view = { name, filter }
                        const next = exists ? views.map(v => v.name.toLowerCase() === name.toLowerCase() ? view : v) : [...views, view]
                        localStorage.setItem(key, JSON.stringify(next))
                        alert('View saved!')
                      } catch {}
                    }}
                  >
                    <SaveIcon className="w-3 h-3 mr-1" /> Save Current
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  try {
                    const key = 'eddiecrm_contacts_views'
                    const views = JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem(key) || '[]') : '[]') as any[]
                    return views.map((v) => (
                      <span key={v.name} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        <button
                          className="hover:underline"
                          onClick={() => setFilter(v.filter)}
                        >
                          {v.name}
                        </button>
                        <button
                          title="Delete view"
                          onClick={() => {
                            const next = views.filter((x: any) => x.name !== v.name)
                            localStorage.setItem(key, JSON.stringify(next))
                            // Force re-render by slight filter change
                            setFilter({ ...filter })
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-gray-500" />
                        </button>
                      </span>
                    ))
                  } catch { return null }
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-300">{selectedIds.length} selected</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-blue-300 dark:border-blue-800" onClick={bulkAddTag}>Add Tag</Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-400"
                onClick={() => void bulkDelete()}
              >
                <Trash2 className="w-4 h-4 mr-1 inline" />
                Delete
              </Button>
              <Button variant="outline" className="border-blue-300 dark:border-blue-800" onClick={() => {
                const csv = 'id\n' + selectedIds.join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'selected-contacts.csv'
                a.click()
              }}>Export IDs</Button>
              <Button variant="outline" className="border-blue-300 dark:border-blue-800" onClick={()=>setSelected({})}>Clear</Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" onChange={(e)=>toggleAll(e.target.checked)} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Select all</span>
          </div>
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading contacts...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contacts.map((contact) => {
              const display = getContactDisplayIdentity(contact)
              return (
              <Card
                key={contact.id}
                className={`group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  contact.paymentIssueAlert
                    ? 'border-red-400 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                    : 'border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 dark:bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5"
                          checked={!!selected[contact.id]}
                          onChange={(e)=>setSelected(prev=>({ ...prev, [contact.id]: e.target.checked }))}
                        />
                        <Link href={`/contacts/${contact.id}`}>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {display.firstName} {display.lastName}
                          </h3>
                        </Link>
                        {contact.paymentIssueAlert && (
                          <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            RED ALERT
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            {contact.email}
                          </div>
                        )}
                        {display.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4" />
                            {display.phone}
                          </div>
                        )}
                        {contact.enrolledDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            Enrolled: {new Date(contact.enrolledDate).toLocaleDateString()}
                          </div>
                        )}
                        {contact.lastJotformSubmissionAt && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            JotForm: {new Date(contact.lastJotformSubmissionAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(contact.category)}`}>
                          {contact.category.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contact.status)}`}>
                          {contact.status.replace(/_/g, ' ')}
                        </span>
                        {contact.tags.map((tag) => (
                          <span
                            key={tag.name}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link href={`/contacts/${contact.id}`}>
                      <Button variant="outline" className="border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              )
            })}
            {contacts.length === 0 && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No contacts found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    {filter.search || filter.category || filter.status || filter.paymentAlert
                      ? 'Try adjusting your filters'
                      : 'Get started by creating your first contact'}
                  </p>
                  <Link href="/contacts/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Contact
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
