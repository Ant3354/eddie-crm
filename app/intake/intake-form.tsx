'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { downloadIntakePdf, buildIntakeMailtoBody } from '@/lib/intake-pdf'
import { INTAKE_ROUTING_EMAIL, INTAKE_ROUTING_NAME } from '@/lib/intake-routing'
import { FileDown, Mail } from 'lucide-react'

function readQrFromWindow(): string {
  if (typeof window === 'undefined') return ''
  try {
    return new URLSearchParams(window.location.search).get('qr_code_id') || ''
  } catch {
    return ''
  }
}

function readUtmFromWindow(): string {
  if (typeof window === 'undefined') return ''
  try {
    return new URLSearchParams(window.location.search).get('utm_source') || ''
  } catch {
    return ''
  }
}

function subscribeUrlSearch(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('popstate', cb)
  return () => window.removeEventListener('popstate', cb)
}

export function IntakeForm() {
  const searchParams = useSearchParams()
  const windowQr = useSyncExternalStore(subscribeUrlSearch, readQrFromWindow, () => '')
  const windowUtm = useSyncExternalStore(subscribeUrlSearch, readUtmFromWindow, () => '')
  const qrCodeId = windowQr || searchParams.get('qr_code_id') || ''
  const utmSource = windowUtm || searchParams.get('utm_source') || ''

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [address, setAddress] = useState('')
  const [languagePreference, setLanguagePreference] = useState('English')
  const [interestType, setInterestType] = useState('Prospect')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [dentalOfficeReferring, setDentalOfficeReferring] = useState('')
  const [notes, setNotes] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [submittedContactId, setSubmittedContactId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!utmSource) return
    setDentalOfficeReferring((prev) => prev || utmSource)
  }, [utmSource])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!qrCodeId) {
      setError('This link is missing a valid code. Ask the office to generate a new QR code.')
      return
    }
    if (!email.trim() && !mobilePhone.trim()) {
      setError('Please enter at least an email or a phone number.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeId,
          firstName,
          lastName,
          email,
          mobilePhone,
          address,
          languagePreference,
          interestType,
          appointmentTime,
          dentalOfficeReferring,
          notes,
          gender,
          dateOfBirth,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      if (data.contactId && typeof data.contactId === 'string') {
        setSubmittedContactId(data.contactId)
      }
      setDone(true)
    } catch {
      setError('Could not reach the server. Use the same Wi‑Fi as the office computer, or try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!qrCodeId) {
    return (
      <Card className="max-w-lg mx-auto border-amber-200 bg-amber-50/90">
        <CardHeader>
          <CardTitle className="text-amber-900">Link not valid</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-900/90 text-sm">
          Open this page by scanning the QR code from the CRM, or ask staff for a current QR link.
        </CardContent>
      </Card>
    )
  }

  if (done) {
    const snapshot = {
      firstName,
      lastName,
      email,
      mobilePhone,
      address,
      languagePreference,
      interestType,
      appointmentTime,
      dentalOfficeReferring,
      notes,
      gender,
      dateOfBirth,
      qrCodeId,
      contactId: submittedContactId || undefined,
    }

    const openRoutingMailto = () => {
      const subject = encodeURIComponent(`Intake — ${firstName} ${lastName}`.trim())
      const body = encodeURIComponent(buildIntakeMailtoBody(snapshot).slice(0, 1900))
      window.location.href = `mailto:${INTAKE_ROUTING_EMAIL}?subject=${subject}&body=${body}`
    }

    return (
      <Card className="max-w-lg mx-auto border-green-200 bg-green-50/90 shadow-lg">
        <CardHeader>
          <CardTitle className="text-green-900">Thank you</CardTitle>
        </CardHeader>
        <CardContent className="text-green-900/90 space-y-4 text-sm">
          <p>Your information was saved in the office CRM. This local setup does not send email automatically.</p>
          <p>
            <strong className="text-green-950">Send a copy to {INTAKE_ROUTING_NAME}</strong> ({INTAKE_ROUTING_EMAIL}
            ): download the PDF summary, then attach it in your email app. You can also open a pre-filled message below
            (you must still attach the PDF yourself).
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full bg-green-800 hover:bg-green-900 text-white"
              onClick={() => downloadIntakePdf(snapshot)}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF summary
            </Button>
            <Button type="button" variant="outline" className="w-full border-green-700 text-green-950" onClick={openRoutingMailto}>
              <Mail className="w-4 h-4 mr-2" />
              Open email draft to {INTAKE_ROUTING_NAME}
            </Button>
          </div>
          <p className="text-xs text-green-900/80">
            Tip: on a phone, use &ldquo;Download&rdquo; then share the file to Gmail / Mail, add {INTAKE_ROUTING_EMAIL} as the
            recipient, and send.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto shadow-lg border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Dental intake</CardTitle>
        <p className="text-sm text-slate-600 font-normal">
          Complete the form below. Your phone must be on the same Wi‑Fi as the office if you are using a
          local (offline) link.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">First name *</label>
              <input
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Last name *</label>
              <input
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-slate-600 bg-slate-100 dark:bg-slate-800/80 rounded-md px-3 py-2 border border-slate-200 dark:border-slate-700">
            Provide <strong>at least one</strong> of email or mobile phone so we can save you in the CRM and show your
            number on the contacts list.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Mobile phone</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={mobilePhone}
                onChange={(e) => setMobilePhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Address or ZIP</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Gender (optional)</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">—</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Date of birth (optional)</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="MM/DD/YYYY or YYYY-MM-DD"
                autoComplete="bday"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Language</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={languagePreference}
              onChange={(e) => setLanguagePreference(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">I am a</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={interestType}
              onChange={(e) => setInterestType(e.target.value)}
            >
              <option value="Prospect">Prospect</option>
              <option value="Consumer">Consumer</option>
              <option value="Dental Office">Dental Office</option>
              <option value="Health Office">Health Office</option>
              <option value="Business Partner">Business Partner</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Best time to reach you</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. weekday mornings"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Referring dental office (optional)</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={dentalOfficeReferring}
              onChange={(e) => setDentalOfficeReferring(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting…' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
