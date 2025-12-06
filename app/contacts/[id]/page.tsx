'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityTimeline } from '@/components/activity-timeline'
import { 
  User, Mail, Phone, MapPin, Globe, Tag, Edit, ArrowLeft, Upload, Send, 
  FileText, CreditCard, CheckSquare2, TrendingUp, Copy, CheckCircle2, 
  AlertTriangle, Calendar, Building2, DollarSign, Shield, Sparkles
} from 'lucide-react'
import Link from 'next/link'

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
  tags: Array<{ name: string }>
  policies: Array<any>
  tasks: Array<any>
  files: Array<any>
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [referralStats, setReferralStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadContact()
    loadReferralStats()
    loadActivities()
  }, [params.id])

  async function loadActivities() {
    try {
      const res = await fetch(`/api/contacts/${params.id}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
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

  async function loadContact() {
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${params.id}`)
      const data = await res.json()
      setContact(data)
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || '',
        mobilePhone: data.mobilePhone || '',
        address: data.address || '',
        languagePreference: data.languagePreference || 'English',
        category: data.category,
        status: data.status,
        emailOptIn: data.emailOptIn,
        smsOptIn: data.smsOptIn,
        paymentIssueAlert: data.paymentIssueAlert,
      })
    } catch (error) {
      console.error('Failed to load contact:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/contacts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  async function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
        alert('PDF uploaded and parsed successfully!')
        await loadContact()
      } else {
        alert('Failed to upload PDF: ' + data.error)
      }
    } catch (error) {
      console.error('PDF upload error:', error)
      alert('Failed to upload PDF')
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
                  {contact.firstName} {contact.lastName}
                </h1>
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
              </div>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <>
                  <Button onClick={() => setEditing(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
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
                    {contact.mobilePhone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Phone</p>
                          <a href={`tel:${contact.mobilePhone}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {contact.mobilePhone}
                          </a>
                        </div>
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.address}</p>
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
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFUpload}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                />
              </div>
              <Button
                onClick={handleSendPortalEmail}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                disabled={!contact.email}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Portal Email
              </Button>
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
