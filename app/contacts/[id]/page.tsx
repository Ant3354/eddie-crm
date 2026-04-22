'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityTimeline } from '@/components/activity-timeline'
import { 
  User, Mail, Phone, MapPin, Globe, Tag, Edit, ArrowLeft, Upload, Send, 
  FileText, CreditCard, CheckSquare2, TrendingUp, Copy, CheckCircle2, 
  AlertTriangle, Calendar, Building2, DollarSign, Shield, Sparkles, Printer, MessageSquare, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { asArray } from '@/lib/as-array'
import { useOfflineMode } from '@/lib/offline-mode'
import { getContactDisplayIdentity } from '@/lib/contact-identity-display'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  mobilePhone?: string
  address?: string
  languagePreference?: string
  category: string
  status: string
  emailOptIn: boolean
  smsOptIn: boolean
  paymentIssueAlert: boolean
  enrolledDate?: string
  renewalDate?: string
  lastJotformSubmissionAt?: string
  gender?: string | null
  preferredContactTime?: string | null
  leadNotes?: string | null
  jotformIntakeSummary?: string | null
  qrSourceLabel?: string | null
  tags: Array<{ name: string }>
  policies: Array<any>
  tasks: Array<any>
  files: Array<any>
  sensitiveData?: { present?: boolean } | null
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const offlineUi = useOfflineMode()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [referralStats, setReferralStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [sessionRole, setSessionRole] = useState<string | null>(null)
  const [sensitiveRevealed, setSensitiveRevealed] = useState<{
    dob: string | null
    ssn: string | null
  } | null>(null)
  const [sensitiveDraft, setSensitiveDraft] = useState({ dob: '', ssn: '' })
  const [sensitiveLoading, setSensitiveLoading] = useState(false)

  const canWrite = sessionRole == null || sessionRole.toUpperCase() !== 'READ_ONLY'
  const canSensitive =
    sessionRole != null &&
    ['ADMIN', 'MANAGER', 'AGENT'].includes(sessionRole.toUpperCase())

  const loadContact = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${params.id}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data || typeof (data as Contact).id !== 'string') {
        setContact(null)
        return
      }
      const normalized: Contact = {
        ...(data as Contact),
        tags: asArray((data as Contact).tags),
        policies: asArray((data as Contact).policies),
        tasks: asArray((data as Contact).tasks),
        files: asArray((data as Contact).files),
        sensitiveData: (data as Contact).sensitiveData ?? null,
      }
      setContact(normalized)
      const idv = getContactDisplayIdentity(normalized)
      setFormData({
        firstName: idv.firstName,
        lastName: idv.lastName,
        email: normalized.email || '',
        mobilePhone: idv.phone,
        address: idv.address,
        languagePreference: normalized.languagePreference || 'English',
        category: normalized.category,
        status: normalized.status,
        emailOptIn: normalized.emailOptIn,
        smsOptIn: normalized.smsOptIn,
        paymentIssueAlert: normalized.paymentIssueAlert,
      })
    } catch (error) {
      console.error('Failed to load contact:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    void loadContact()
    loadReferralStats()
    loadActivities()
  }, [params.id, loadContact])

  useEffect(() => {
    void fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((u: { role?: string } | null) => {
        if (u?.role) setSessionRole(u.role)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      void loadContact()
    }, 30000)
    return () => clearInterval(t)
  }, [loadContact])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadContact()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [loadContact])

  async function loadActivities() {
    try {
      const res = await fetch(`/api/contacts/${params.id}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivities(asArray(data))
      }
    } catch (error) {
      console.error('Failed to load activities:', error)
    }
  }

  async function loadReferralStats() {
    try {
      const res = await fetch(`/api/contacts/${params.id}/referral-stats`)
      if (res.ok) {
        const data = await res.json()
        setReferralStats(data)
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error)
    }
  }

  async function handleDelete() {
    if (!contact) return
    const idv = getContactDisplayIdentity(contact)
    if (!confirm(`Delete ${idv.firstName} ${idv.lastName}? This cannot be undone.`)) return
    const res = await fetch(`/api/contacts/${params.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert((err as { error?: string }).error || 'Delete failed')
      return
    }
    router.push('/contacts')
  }

  async function handleSave() {
    try {
      const body: Record<string, unknown> = { ...formData }
      if (sensitiveRevealed) {
        if (sensitiveDraft.dob.trim()) body.dob = sensitiveDraft.dob.trim()
        if (sensitiveDraft.ssn.trim()) body.ssn = sensitiveDraft.ssn.trim()
      }
      const res = await fetch(`/api/contacts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        await loadContact()
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to update contact:', error)
      alert('Failed to update contact')
    }
  }

  async function revealSensitive() {
    setSensitiveLoading(true)
    try {
      const res = await fetch(`/api/contacts/${params.id}/sensitive`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Could not reveal sensitive fields')
        return
      }
      setSensitiveRevealed({ dob: data.dob ?? null, ssn: data.ssn ?? null })
      setSensitiveDraft({ dob: data.dob || '', ssn: data.ssn || '' })
    } finally {
      setSensitiveLoading(false)
    }
  }

  async function handleContactDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/contacts/${params.id}/upload-pdf`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        const conf = data.parsedData?.confidence
        const confHint =
          conf && typeof conf === 'object'
            ? '\nParser confidence: ' +
              Object.entries(conf)
                .map(([k, v]) => `${k}=${Number(v).toFixed(2)}`)
                .slice(0, 8)
                .join(', ')
            : ''
        alert(
          'Document uploaded and parsed. Blank fields were updated where we found matches.' + confHint
        )
        await loadContact()
      } else {
        alert('Upload failed: ' + data.error)
      }
    } catch (error) {
      console.error('Document upload error:', error)
      alert('Failed to upload document')
    } finally {
      e.target.value = ''
    }
  }

  async function handleSendPortalEmail() {
    try {
      const res = await fetch('/api/portal-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: params.id }),
      })
      if (res.ok) {
        alert('Portal email sent!')
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      console.error('Failed to send portal email:', error)
      alert('Failed to send email')
    }
  }

  const copyReferralLink = () => {
    if (referralStats?.referralUrl) {
      navigator.clipboard.writeText(referralStats.referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function buildPortalPlainText(c: Contact) {
    const id = getContactDisplayIdentity(c)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const pol = c.policies?.[0]
    const portalLine =
      pol?.memberPortalLink || `${origin}/portal?contact=${c.id}`
    const appt = `${origin}/appointments?contact=${c.id}`
    return [
      `Hi ${id.firstName},`,
      ``,
      `Member portal: ${portalLine}`,
      pol?.pharmacyLink ? `Pharmacy / lookup: ${pol.pharmacyLink}` : null,
      pol?.riderBenefitsLink ? `Rider benefits: ${pol.riderBenefitsLink}` : null,
      `Schedule: ${appt}`,
      ``,
      `— Sent from Eddie CRM (manual)`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  function openPortalMailto(c: Contact) {
    if (!c.email) return
    const subject = encodeURIComponent('Your member portal links')
    const body = encodeURIComponent(buildPortalPlainText(c).slice(0, 1900))
    window.location.href = `mailto:${c.email}?subject=${subject}&body=${body}`
  }

  function openPortalSms(c: Contact) {
    const id = getContactDisplayIdentity(c)
    const raw = (id.phone || '').replace(/\D/g, '')
    if (!raw) return
    const normalized = raw.length === 10 ? `+1${raw}` : raw.startsWith('1') && raw.length === 11 ? `+${raw}` : `+${raw.replace(/^\+/, '')}`
    const body = encodeURIComponent(buildPortalPlainText(c).slice(0, 300))
    window.location.href = `sms:${normalized}?body=${body}`
  }

  async function copyPortalPlainText(c: Contact) {
    try {
      await navigator.clipboard.writeText(buildPortalPlainText(c))
      alert('Portal message copied to clipboard.')
    } catch {
      alert('Could not copy — select text manually.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading contact...</p>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Contact not found</p>
            <Link href="/contacts">
              <Button className="mt-4">Back to Contacts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const display = getContactDisplayIdentity(contact)

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
          <Link href="/contacts" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Contacts
          </Link>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
                  {[display.firstName, display.lastName].map((s) => String(s || '').trim()).filter(Boolean).join(' ') || 'Unnamed contact'}
                </h1>
                {contact.qrSourceLabel ? (
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    QR scan / office location: {contact.qrSourceLabel}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(contact.category)}`}>
                    {contact.category.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contact.status)}`}>
                    {contact.status.replace(/_/g, ' ')}
                  </span>
                  {contact.paymentIssueAlert && (
                    <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      RED ALERT: PAYMENT
                    </span>
                  )}
                </div>
                {contact.lastJotformSubmissionAt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Last JotForm submission:{' '}
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {new Date(contact.lastJotformSubmissionAt).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <>
                  {canWrite ? (
                    <Button onClick={() => setEditing(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : null}
                  {canWrite ? (
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-400"
                      onClick={() => void handleDelete()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="border-gray-300 dark:border-gray-700">
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Payment Alert Banner */}
          {contact.paymentIssueAlert && (
            <Card className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-2 border-red-400 dark:border-red-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 animate-pulse" />
                  <div>
                    <p className="font-bold text-red-800 dark:text-red-400">RED ALERT: Payment Issue</p>
                    <p className="text-sm text-red-700 dark:text-red-500">Action required - Failed payment sequence is active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6 border-blue-200/80 dark:border-blue-900 bg-white/90 dark:bg-gray-900/60 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Next best action
              </CardTitle>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-normal">
                One primary path based on open tasks and contact channel.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2">
              {(() => {
                const pending = (contact.tasks || []).filter(
                  (t: { status?: string }) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
                )
                const phoneRaw = display.phone || contact.mobilePhone || ''
                const tel = phoneRaw.replace(/[^\d+]/g, '')
                return (
                  <>
                    {pending.length > 0 ? (
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                        <Link href="/tasks">Review tasks ({pending.length})</Link>
                      </Button>
                    ) : null}
                    {tel ? (
                      <Button variant="secondary" asChild>
                        <a href={`tel:${tel}`}>Call</a>
                      </Button>
                    ) : null}
                    {canWrite && contact.email && !offlineUi ? (
                      <Button variant="secondary" type="button" onClick={() => void handleSendPortalEmail()}>
                        <Send className="w-4 h-4 mr-2" />
                        Send portal email
                      </Button>
                    ) : null}
                    {canWrite ? (
                      <Button variant="outline" asChild>
                        <a href="#quick-document-upload">Upload document</a>
                      </Button>
                    ) : null}
                  </>
                )
              })()}
            </CardContent>
          </Card>

          {contact.sensitiveData?.present ? (
            <Card className="mb-6 border-amber-200 dark:border-amber-900 bg-amber-50/90 dark:bg-amber-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  Sensitive data (DOB / SSN)
                </CardTitle>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 font-normal">
                  Values are encrypted at rest. Revealing plaintext is audited (who / when / which contact).
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {!sensitiveRevealed ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {canSensitive ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={sensitiveLoading}
                        onClick={() => void revealSensitive()}
                      >
                        {sensitiveLoading ? 'Loading…' : 'Reveal DOB & SSN (audited)'}
                      </Button>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Your role cannot decrypt sensitive fields.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Hide values when finished — refresh the page or click below.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">DOB</label>
                        <input
                          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          value={sensitiveDraft.dob}
                          onChange={(e) => setSensitiveDraft((d) => ({ ...d, dob: e.target.value }))}
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">SSN</label>
                        <input
                          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          value={sensitiveDraft.ssn}
                          onChange={(e) => setSensitiveDraft((d) => ({ ...d, ssn: e.target.value }))}
                          disabled={!editing}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSensitiveRevealed(null)
                        setSensitiveDraft({ dob: '', ssn: '' })
                      }}
                    >
                      Hide from screen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 dark:bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.languagePreference}
                      onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
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
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="LEAD">Lead</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="ENROLLED">Enrolled</option>
                      <option value="ACTIVE_CLIENT">Active Client</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emailOptIn}
                        onChange={(e) => setFormData({ ...formData, emailOptIn: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Opt-in</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.smsOptIn}
                        onChange={(e) => setFormData({ ...formData, smsOptIn: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Opt-in</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.paymentIssueAlert}
                        onChange={(e) => setFormData({ ...formData, paymentIssueAlert: e.target.checked })}
                        className="w-5 h-5 rounded border-red-300 dark:border-red-700 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Payment Issue Alert</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    {contact.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Email</p>
                          <a href={`mailto:${contact.email}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {contact.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {display.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Phone</p>
                          <a href={`tel:${display.phone.replace(/\s/g, '')}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {display.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {display.address && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{display.address}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Language</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.languagePreference}</p>
                      </div>
                    </div>
                    {contact.enrolledDate && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Enrolled</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(contact.enrolledDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {contact.renewalDate && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Renewal Date</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(contact.renewalDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* JotForm / dental intake answers */}
          {(contact.jotformIntakeSummary ||
            contact.leadNotes ||
            contact.gender ||
            contact.preferredContactTime ||
            contact.qrSourceLabel) && (
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-indigo-200/50 dark:border-indigo-800/50 shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Intake &amp; form responses
                </CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
                  Every question we could read from JotForm or the local QR intake is listed below (labeled). QR-linked
                  leads also show the CRM location label for that code.
                </p>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3 text-sm">
                {contact.gender ? (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Gender</p>
                    <p className="font-medium text-gray-900 dark:text-white">{contact.gender}</p>
                  </div>
                ) : null}
                {contact.preferredContactTime ? (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Best time to reach</p>
                    <p className="font-medium text-gray-900 dark:text-white">{contact.preferredContactTime}</p>
                  </div>
                ) : null}
                {contact.leadNotes ? (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Summary notes</p>
                    <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{contact.leadNotes}</p>
                  </div>
                ) : null}
                {contact.jotformIntakeSummary ? (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">All captured answers</p>
                    <pre className="text-xs font-sans whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-80 overflow-y-auto text-gray-800 dark:text-gray-200">
                      {contact.jotformIntakeSummary}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-green-200/50 dark:border-green-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/5 dark:bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              {canWrite ? (
                <div id="quick-document-upload">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Attach document (parse)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleContactDocumentUpload}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PDF, DOCX, or TXT — saved to this contact and used to fill empty fields. To
                    pre-fill before a record exists, use{' '}
                    <Link href="/contacts/new" className="text-blue-600 dark:text-blue-400 underline">
                      New contact
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Read-only: document upload is disabled.
                </p>
              )}
              {offlineUi ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Offline mode: use your email/SMS apps. Nothing is sent through the server.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-600 text-green-800 dark:text-green-300"
                    disabled={!contact.email}
                    onClick={() => openPortalMailto(contact)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Open mail draft (portal links)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-600 text-green-800 dark:text-green-300"
                    disabled={!display.phone}
                    onClick={() => openPortalSms(contact)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open SMS with portal summary
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-400"
                    onClick={() => copyPortalPlainText(contact)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy portal message
                  </Button>
                  <Button type="button" variant="outline" className="w-full border-gray-400" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print this page
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleSendPortalEmail}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  disabled={!contact.email}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Portal Email
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Policies */}
          {contact.policies.length > 0 && (
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-amber-200/50 dark:border-amber-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                {contact.policies.map((policy) => (
                  <div key={policy.id} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {policy.carrier && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            Carrier
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">{policy.carrier}</p>
                        </div>
                      )}
                      {policy.planType && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan Type</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{policy.planType}</p>
                        </div>
                      )}
                      {policy.monthlyPremium && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Monthly Premium
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">${policy.monthlyPremium.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Status</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          policy.paymentStatus === 'FAILED' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : policy.paymentStatus === 'AT_RISK'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {policy.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          {contact.tasks.length > 0 && (
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200/50 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Tasks ({contact.tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3">
                {contact.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{task.description}</div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      {task.dueDate && (
                        <>
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {contact.tasks.length > 5 && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    +{contact.tasks.length - 5} more tasks
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Referral Statistics */}
          {contact.category === 'CONSUMER' && referralStats && (
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Referral Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Referral Link</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs font-mono border border-gray-300 dark:border-gray-700 break-all">
                      {referralStats.referralUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyReferralLink}
                      className="border-gray-300 dark:border-gray-700"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{referralStats.clickCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Clicks</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{referralStats.conversionCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Conversions</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{referralStats.conversionRate}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <div className="md:col-span-2 lg:col-span-3">
            <ActivityTimeline activities={activities} />
          </div>
        </div>
      </div>
    </div>
  )
}
