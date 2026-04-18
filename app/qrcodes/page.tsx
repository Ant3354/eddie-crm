'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Download, Sparkles, Copy, CheckCircle2, Globe, MapPin, History, Eye, Calendar, Printer, MessageSquare } from 'lucide-react'
import { asArray } from '@/lib/as-array'
import { useOfflineMode } from '@/lib/offline-mode'
import { openPrintableQrSheet } from '@/lib/print-qr-sheet'

interface QRCodeHistory {
  id: string
  source: string
  jotFormUrl: string
  qrCodeUrl: string
  scanCount: number
  createdAt: string
}

interface PublicConfig {
  intakeBaseUrl: string
  qrEncodeBaseUrl: string
  qrEncodeReachability: 'loopback' | 'private-lan' | 'possibly-public' | 'invalid'
  usesDedicatedQrBase: boolean
  offlineIntakePath: string
  jotFormRequiresInternet: boolean
  offlineModeDescription: string
  offlineModeDefault?: boolean
}

export default function QRCodesPage() {
  const offlineUi = useOfflineMode()
  const [jotFormUrl, setJotFormUrl] = useState('')
  const [source, setSource] = useState('')
  const [useLocalIntake, setUseLocalIntake] = useState(false)
  const [qrCode, setQrCode] = useState<{ qrCodeUrl: string; qrCodeId: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedServerUrl, setCopiedServerUrl] = useState(false)
  const [qrHistory, setQrHistory] = useState<QRCodeHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedQR, setSelectedQR] = useState<QRCodeHistory | null>(null)
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  /** Fully offline: QR encodes plain text (any QR app can show it — no website, no Wi‑Fi to your PC). */
  const [textQrBody, setTextQrBody] = useState('')
  const [textQrDataUrl, setTextQrDataUrl] = useState<string | null>(null)
  const [textQrLoading, setTextQrLoading] = useState(false)
  const [textQrError, setTextQrError] = useState('')

  useEffect(() => {
    loadQRHistory()
  }, [])

  useEffect(() => {
    fetch('/api/public/config')
      .then((r) => r.json())
      .then(setPublicConfig)
      .catch(() => setPublicConfig(null))
  }, [])

  async function loadQRHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/qrcodes')
      const raw = await res.json()
      const data = asArray<QRCodeHistory>(raw)
      setQrHistory(data)
      // If there's a newly generated QR code, select it
      if (qrCode && data.length > 0) {
        const found = data.find((q) => q.id === qrCode.qrCodeId)
        if (found) setSelectedQR(found)
      }
    } catch (error) {
      console.error('Failed to load QR history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleGenerate() {
    if (!source) {
      alert('Please select a source location')
      return
    }
    if (!useLocalIntake && !jotFormUrl) {
      alert('Please provide a JotForm URL, or enable “Local intake (no JotForm)”')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/qrcodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jotFormUrl, source, useLocalIntake }),
      })
      const data = await res.json()
      if (res.ok) {
        setQrCode(data)
        // Reload history to show new QR code
        await loadQRHistory()
        // Select the newly generated QR code
        const newQR = qrHistory.find((q) => q.id === data.qrCodeId) || qrHistory[0]
        if (newQR) setSelectedQR(newQR)
      } else {
        alert('Failed to generate QR code: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      alert('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyServerUrl = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedServerUrl(true)
    setTimeout(() => setCopiedServerUrl(false), 2000)
  }

  const TEXT_QR_MAX = 480

  async function handleGenerateTextQr() {
    const t = textQrBody.trim()
    if (t.length < 3) {
      setTextQrError('Enter a short message (offer, phone, “see front desk for intake”), at least a few words.')
      return
    }
    if (t.length > TEXT_QR_MAX) {
      setTextQrError(`Keep the message under ${TEXT_QR_MAX} characters so phones can scan it reliably.`)
      return
    }
    setTextQrLoading(true)
    setTextQrError('')
    try {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(t, { width: 320, margin: 2, errorCorrectionLevel: 'M' })
      setTextQrDataUrl(url)
    } catch (e: unknown) {
      setTextQrError(e instanceof Error ? e.message : 'Could not build QR')
    } finally {
      setTextQrLoading(false)
    }
  }

  function resolveScanTargetUrl(q: { id: string; source: string; jotFormUrl?: string }) {
    const u = (q.jotFormUrl || '').trim()
    if (u.startsWith('http')) return u
    const base = (
      publicConfig?.qrEncodeBaseUrl ||
      publicConfig?.intakeBaseUrl ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    ).replace(/\/$/, '')
    return `${base}/intake?qr_code_id=${encodeURIComponent(q.id)}&utm_source=${encodeURIComponent(q.source)}&utm_medium=qr&utm_campaign=referral`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/10 dark:bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              QR Code Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Generate trackable QR codes for referrals and lead generation</p>
          {offlineUi ? (
            <p className="mt-3 text-sm font-medium text-emerald-800 dark:text-emerald-300 max-w-2xl mx-auto">
              Offline / LAN workflow is on — use print sheets and local intake; server email and SMS sends are hidden elsewhere.
            </p>
          ) : null}
        </div>

        {publicConfig ? (
          <>
            {(publicConfig.qrEncodeReachability === 'loopback' || publicConfig.qrEncodeReachability === 'private-lan') && (
              <Card className="mb-6 border-2 border-amber-400/80 bg-amber-50/95 dark:bg-amber-950/40 dark:border-amber-700 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-amber-950 dark:text-amber-100">
                    Phones on another network won&apos;t open this QR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-amber-950/90 dark:text-amber-100/90">
                  {publicConfig.qrEncodeReachability === 'loopback' ? (
                    <p>
                      The link inside the QR is <strong>localhost / 127.0.0.1</strong>. That only works on this computer —
                      other people&apos;s phones will show a blank page or &quot;can&apos;t connect&quot;.
                    </p>
                  ) : (
                    <p>
                      The QR uses a <strong>private LAN address</strong>. That only works when the phone is on the{' '}
                      <strong>same Wi‑Fi</strong> as this PC and can reach this machine. On cellular or guest Wi‑Fi, the
                      page will not load.
                    </p>
                  )}
                  <p className="font-semibold text-amber-950 dark:text-amber-50">
                    For guests on any network: set{' '}
                    <code className="rounded bg-amber-100/90 dark:bg-black/30 px-1 text-xs">NEXT_PUBLIC_INTAKE_QR_BASE_URL</code>{' '}
                    to a public <strong>https://</strong> address that reaches this app (ngrok, Cloudflare Tunnel, Tailscale
                    Funnel, or a hosted reverse proxy), then restart and generate a new QR.
                  </p>
                  <p className="text-xs opacity-90">
                    After submit, the intake page already offers <strong>Download PDF</strong> and a mailto draft so the
                    person can manually email Francisco — that works once the form actually loads in their browser.
                  </p>
                </CardContent>
              </Card>
            )}
            <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 border-emerald-200/60 dark:border-emerald-800/50 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">QR link base (what gets encoded)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">Local intake</span> QR codes embed this
                  base URL + <code className="text-xs">/intake?qr_code_id=…</code>. New codes use{' '}
                  <code className="text-xs">NEXT_PUBLIC_INTAKE_QR_BASE_URL</code> if set, otherwise{' '}
                  <code className="text-xs">NEXT_PUBLIC_APP_URL</code>.
                </p>
                <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 space-y-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Encoded in QR (scanned URL)</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="flex-1 min-w-0 break-all rounded-md bg-slate-100 dark:bg-slate-900 px-3 py-2 text-xs">
                      {publicConfig.qrEncodeBaseUrl}
                      {publicConfig.offlineIntakePath}?qr_code_id=…
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyServerUrl(publicConfig.qrEncodeBaseUrl)}
                    >
                      {copiedServerUrl ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Reachability:{' '}
                    <strong>
                      {publicConfig.qrEncodeReachability === 'possibly-public'
                        ? 'public hostname (good for any network if HTTPS resolves to this app)'
                        : publicConfig.qrEncodeReachability === 'private-lan'
                          ? 'private LAN (same Wi‑Fi only)'
                          : publicConfig.qrEncodeReachability === 'loopback'
                            ? 'loopback (this PC only)'
                            : 'unknown'}
                    </strong>
                    {publicConfig.usesDedicatedQrBase ? (
                      <span className="block mt-1">
                        Using dedicated <code className="text-xs">NEXT_PUBLIC_INTAKE_QR_BASE_URL</code>.
                      </span>
                    ) : null}
                  </p>
                </div>
                {publicConfig.intakeBaseUrl !== publicConfig.qrEncodeBaseUrl ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <code className="text-xs">NEXT_PUBLIC_APP_URL</code> (links inside the CRM UI):{' '}
                    <code className="text-xs break-all">{publicConfig.intakeBaseUrl}</code>
                  </p>
                ) : null}
                <p className="text-xs text-gray-500 dark:text-gray-400">{publicConfig.offlineModeDescription}</p>
                {typeof publicConfig.offlineModeDefault === 'boolean' ? (
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Environment default offline UI:{' '}
                    <strong>{publicConfig.offlineModeDefault ? 'yes (NEXT_PUBLIC_OFFLINE_MODE)' : 'no'}</strong>. You can
                    still override this on the Integrations page in this browser.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}

        <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 border-2 border-slate-200 dark:border-slate-600 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Completely offline? Use a text QR (simplest for strangers)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>
              A normal QR that opens your <strong>local intake webpage</strong> only works if the phone can reach your
              computer (same Wi‑Fi, or a tunnel). If the client wants <strong>no internet and no tunnel</strong>, that
              webpage cannot load on a random passer‑by&apos;s phone — that&apos;s a physical limit, not something we can
              patch around.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>
                <strong>Text QR (below):</strong> encodes a short message. Any phone can scan it offline; the camera app
                shows your offer + phone number. No CRM link — use paper intake at the booth, then type leads into the
                CRM later.
              </li>
              <li>
                <strong>Same room only:</strong> turn on Windows &quot;Mobile hotspot&quot;, put{' '}
                <code className="text-xs">NEXT_PUBLIC_APP_URL</code> to that hotspot address, then use &quot;Local
                intake&quot; QRs so phones on <em>that</em> Wi‑Fi can open the form.
              </li>
              <li>
                <strong>Print:</strong> use &quot;Print QR sheet&quot; on a tracked QR so staff have a paper backup at
                events.
              </li>
              <li>
                <strong>Full dental form with no Wi‑Fi:</strong> a QR code cannot store the whole form (size limit). Use
                the standalone page below — same fields as the online intake (including{' '}
                <strong>source location</strong>: Airport, Dental Office, Health Office, Event, Website, Other), with
                &quot;email Francisco&quot; at the bottom. Staff can AirDrop the file, put it on a USB drive, or add a link
                in email; guests save it to the phone and fill it offline.
              </li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/offline-intake-paper.html"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'border-teal-600 text-teal-800 dark:text-teal-300 inline-flex'
                )}
              >
                Open offline dental form (save / print / email Francisco)
              </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tip: In the browser, use <strong>Save page as</strong> so the file works with no connection. The form is
              static HTML only — data is not sent to the CRM until someone types it in or receives your email.
            </p>
            <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/50 p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Message inside the QR (plain text)
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                placeholder="Example: Dental savings plan — ask for Eddie. Call (555) 123-4567. Visit our table for a paper intake form."
                value={textQrBody}
                onChange={(e) => {
                  setTextQrBody(e.target.value)
                  setTextQrDataUrl(null)
                  setTextQrError('')
                }}
                maxLength={TEXT_QR_MAX}
              />
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <span className="text-xs text-gray-500">
                  {textQrBody.length}/{TEXT_QR_MAX} — shorter scans more easily
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={textQrLoading}
                  onClick={() => void handleGenerateTextQr()}
                  className="shrink-0"
                >
                  {textQrLoading ? 'Building…' : 'Create text QR'}
                </Button>
              </div>
              {textQrError ? <p className="text-xs text-red-600 dark:text-red-400">{textQrError}</p> : null}
              {textQrDataUrl ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                  <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700">
                    <img src={textQrDataUrl} alt="Text-only marketing QR" className="w-48 h-48" />
                  </div>
                  <div className="flex-1 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <p>
                      Scanning shows this text in the QR reader — <strong>not</strong> your intake form. For full forms
                      into the CRM without internet, use paper or same‑Wi‑Fi intake above.
                    </p>
                    <Button
                      type="button"
                      className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = textQrDataUrl
                        a.download = 'offline-marketing-qr.png'
                        a.click()
                      }}
                    >
                      <Download className="w-4 h-4 mr-2 inline" />
                      Download PNG
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Generator Form */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/60 dark:bg-gray-900/40">
                <legend className="text-sm font-semibold text-gray-900 dark:text-white px-1">Form type</legend>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="qrMode"
                    className="mt-1"
                    checked={!useLocalIntake}
                    onChange={() => setUseLocalIntake(false)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">JotForm (online)</span>
                    <span className="block text-gray-600 dark:text-gray-400 mt-0.5">
                      QR opens your JotForm link. The person&apos;s phone needs the internet, and JotForm must reach your
                      webhook URL for data to land in the CRM.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="qrMode"
                    className="mt-1"
                    checked={useLocalIntake}
                    onChange={() => setUseLocalIntake(true)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">Offline / LAN — built-in dental intake</span>
                    <span className="block text-gray-600 dark:text-gray-400 mt-0.5">
                      QR opens this CRM&apos;s intake form. Same Wi‑Fi: use your PC&apos;s LAN IP in env. Guests on
                      cellular or other Wi‑Fi need a public HTTPS URL in{' '}
                      <code className="text-xs">NEXT_PUBLIC_INTAKE_QR_BASE_URL</code> (tunnel). After submit they can
                      download a PDF and email it manually.
                    </span>
                  </span>
                </label>
              </fieldset>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <Globe className="w-4 h-4 inline mr-1" />
                  JotForm URL {useLocalIntake ? '(optional)' : '*'}
                </label>
                <input
                  type="url"
                  required={!useLocalIntake}
                  disabled={useLocalIntake}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="https://form.jotform.com/..."
                  value={jotFormUrl}
                  onChange={(e) => setJotFormUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Source Location *
                </label>
                <select
                  id="qr-source-select"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="">Select source...</option>
                  <option value="Airport">Airport</option>
                  <option value="Dental Office">Dental Office</option>
                  <option value="Health Office">Health Office</option>
                  <option value="Event">Event</option>
                  <option value="Website">Website</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                {selectedQR ? 'Selected QR Code' : 'Generated QR Code'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(selectedQR || qrCode) ? (() => {
                const displayQR =
                  selectedQR ||
                  (qrCode
                    ? {
                        id: qrCode.qrCodeId,
                        qrCodeUrl: qrCode.qrCodeUrl,
                        source,
                        scanCount: 0,
                        createdAt: new Date().toISOString(),
                        jotFormUrl: useLocalIntake
                          ? `${(
                              publicConfig?.qrEncodeBaseUrl ||
                              publicConfig?.intakeBaseUrl ||
                              (typeof window !== 'undefined' ? window.location.origin : '')
                            ).replace(/\/$/, '')}/intake?qr_code_id=${encodeURIComponent(qrCode.qrCodeId)}&utm_source=${encodeURIComponent(source)}&utm_medium=qr&utm_campaign=referral`
                          : jotFormUrl || '',
                      }
                    : null)
                if (!displayQR) return null
                return (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-xl border-2 border-green-200 dark:border-green-800">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                          <img
                            src={displayQR.qrCodeUrl}
                            alt="QR Code"
                            className="w-64 h-64"
                          />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">QR Code ID</p>
                          <div className="flex items-center justify-center gap-2">
                            <code className="px-3 py-2 bg-white dark:bg-gray-900 rounded-lg text-sm font-mono border border-gray-300 dark:border-gray-700">
                              {displayQR.id}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(displayQR.id)}
                              className="border-gray-300 dark:border-gray-700"
                            >
                              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Source</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{displayQR.source}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Scans</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">{displayQR.scanCount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = displayQR.qrCodeUrl
                          link.download = `qr-code-${displayQR.id}.png`
                          link.click()
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-green-600 text-green-800 dark:text-green-300"
                        onClick={() => {
                          const origin = window.location.origin
                          openPrintableQrSheet({
                            title: `Referral QR — ${displayQR.source}`,
                            source: displayQR.source,
                            qrImageAbsoluteUrl: `${origin}${displayQR.qrCodeUrl}`,
                            intakeUrl: resolveScanTargetUrl(displayQR),
                            qrId: displayQR.id,
                          })
                        }}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print QR sheet (LAN / event)
                      </Button>
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Scan this QR code to track referrals and conversions
                      </p>
                    </div>
                  </div>
                )
              })() : (
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Generate a QR code to get started</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Or select one from history below</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QR Code History */}
        <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              QR Code History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading history...</p>
              </div>
            ) : qrHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No QR codes generated yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Generate your first QR code above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {qrHistory.map((qr) => (
                  <div
                    key={qr.id}
                    onClick={() => setSelectedQR(qr)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQR?.id === qr.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <QrCode className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{qr.source}</p>
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                              {qr.scanCount} scans
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{qr.jotFormUrl}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(qr.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedQR(qr)
                          }}
                          className="border-gray-300 dark:border-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            const link = document.createElement('a')
                            link.href = qr.qrCodeUrl
                            link.download = `qr-code-${qr.id}.png`
                            link.click()
                          }}
                          className="border-gray-300 dark:border-gray-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Print-friendly sheet"
                          onClick={(e) => {
                            e.stopPropagation()
                            const origin = window.location.origin
                            openPrintableQrSheet({
                              title: `Referral QR — ${qr.source}`,
                              source: qr.source,
                              qrImageAbsoluteUrl: `${origin}${qr.qrCodeUrl}`,
                              intakeUrl: resolveScanTargetUrl(qr),
                              qrId: qr.id,
                            })
                          }}
                          className="border-gray-300 dark:border-gray-700"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">1. Generate</div>
                <p>
                  JotForm for online; local intake for same‑Wi‑Fi / LAN; or a <strong>text QR</strong> above for
                  marketing with zero internet to your PC
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">2. Track</div>
                <p>QR codes automatically track clicks and conversions</p>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">3. Analyze</div>
                <p>View referral stats and performance in the dashboard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
