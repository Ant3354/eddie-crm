'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Globe,
  Tag,
  CheckCircle,
  ArrowLeft,
  FileUp,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { confidenceTier } from '@/lib/confidence-tier'

type FormSuggestion = {
  firstName: string
  lastName: string
  email: string
  mobilePhone: string
  address: string
}

type ParsedPreview = {
  dob?: string
  ssn?: string
  planType?: string
  carrier?: string
  policyNumber?: string
  monthlyPremium?: number
  beneficiaries?: string[]
}

export default function NewContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    address: '',
    languagePreference: 'English',
    category: 'PROSPECT',
    status: 'LEAD',
    emailOptIn: false,
    smsOptIn: false,
  })
  const [loading, setLoading] = useState(false)
  const [extractLoading, setExtractLoading] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [parsedPreview, setParsedPreview] = useState<ParsedPreview | null>(null)
  const [confidenceMap, setConfidenceMap] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleDocumentAutofill(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setExtractLoading(true)
    setExtractError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/contacts/extract-document', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Could not read that document')
      }
      const f = data.formSuggestion as FormSuggestion
      setFormData((prev) => ({
        ...prev,
        firstName: f.firstName ? f.firstName : prev.firstName,
        lastName: f.lastName ? f.lastName : prev.lastName,
        email: f.email ? f.email : prev.email,
        mobilePhone: f.mobilePhone ? f.mobilePhone : prev.mobilePhone,
        address: f.address ? f.address : prev.address,
      }))
      const p = data.parsedData as ParsedPreview & { confidence?: Record<string, number> }
      setConfidenceMap(
        p.confidence && typeof p.confidence === 'object' ? { ...p.confidence } : {}
      )
      setParsedPreview({
        dob: p.dob,
        ssn: p.ssn ? '***-**-****' : undefined,
        planType: p.planType,
        carrier: p.carrier,
        policyNumber: p.policyNumber,
        monthlyPremium: p.monthlyPremium,
        beneficiaries: p.beneficiaries,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Extract failed'
      setExtractError(message)
      setParsedPreview(null)
    } finally {
      setExtractLoading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const contact = await res.json()
        router.push(`/contacts/${contact.id}`)
      } else {
        alert('Failed to create contact')
      }
    } catch (error) {
      console.error('Failed to create contact:', error)
      alert('Failed to create contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-5xl">
        <div className="mb-8">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contacts
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                New Contact
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Upload a PDF, Word, or text file to pre-fill the form, or enter details manually
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4 order-first lg:order-none">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-indigo-300/60 dark:border-indigo-700/60 shadow-xl ring-1 ring-indigo-100 dark:ring-indigo-900/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Fill from document
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                  PDF, DOCX, or TXT. Legacy .doc is not supported—save as DOCX or PDF first. You can edit every
                  field after autofill.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleDocumentAutofill}
                  disabled={extractLoading}
                  className="sr-only"
                  id="new-contact-doc-input"
                />
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <Button
                    type="button"
                    variant="secondary"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 border-0"
                    disabled={extractLoading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose file…
                  </Button>
                  <label
                    htmlFor="new-contact-doc-input"
                    className="text-sm text-indigo-700 dark:text-indigo-300 cursor-pointer underline decoration-dotted self-center"
                  >
                    Or tap here to pick a file
                  </label>
                </div>
                {extractLoading ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="inline-block h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Reading document…
                  </p>
                ) : null}
                {extractError ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{extractError}</p>
                ) : null}
                {Object.keys(confidenceMap).length > 0 ? (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Parser confidence (edit form as needed)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(confidenceMap).map(([key, score]) => {
                        const t = confidenceTier(score)
                        const cls =
                          t === 'high'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                            : t === 'medium'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        return (
                          <span key={key} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
                            {key}: {t} ({score.toFixed(2)})
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {parsedPreview &&
            (parsedPreview.dob ||
              parsedPreview.ssn ||
              parsedPreview.planType ||
              parsedPreview.carrier) ? (
              <Card className="bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-900 dark:text-emerald-100">
                    <Sparkles className="w-4 h-4" />
                    Also detected in file
                  </CardTitle>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-200/80 font-normal">
                    DOB, SSN, and plan details are saved when you attach the same file on the
                    contact page after creating this profile.
                  </p>
                </CardHeader>
                <CardContent className="text-sm text-emerald-900 dark:text-emerald-100 space-y-1">
                  {parsedPreview.dob ? <p>DOB: {parsedPreview.dob}</p> : null}
                  {parsedPreview.ssn ? <p>SSN: {parsedPreview.ssn}</p> : null}
                  {parsedPreview.carrier ? <p>Carrier: {parsedPreview.carrier}</p> : null}
                  {parsedPreview.planType ? <p>Plan: {parsedPreview.planType}</p> : null}
                  {parsedPreview.policyNumber ? (
                    <p>Policy #: {parsedPreview.policyNumber}</p>
                  ) : null}
                  {typeof parsedPreview.monthlyPremium === 'number' ? (
                    <p>Premium: ${parsedPreview.monthlyPremium}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card className="lg:col-span-7 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Contact information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City, State ZIP"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.languagePreference}
                      onChange={(e) =>
                        setFormData({ ...formData, languagePreference: e.target.value })
                      }
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Category
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="LEAD">Lead</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="ENROLLED">Enrolled</option>
                      <option value="ACTIVE_CLIENT">Active Client</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emailOptIn}
                        onChange={(e) =>
                          setFormData({ ...formData, emailOptIn: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Opt-in
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.smsOptIn}
                        onChange={(e) =>
                          setFormData({ ...formData, smsOptIn: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        SMS Opt-in
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Contact
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-gray-300 dark:border-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
