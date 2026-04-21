'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  QrCode,
  Download,
  Sparkles,
  Copy,
  CheckCircle2,
  Globe,
  MapPin,
  History,
  Eye,
  Calendar,
  Printer,
} from 'lucide-react'
import { asArray } from '@/lib/as-array'
import { openPrintableQrSheet } from '@/lib/print-qr-sheet'

interface QRCodeHistory {
  id: string
  source: string
  jotFormUrl: string
  qrCodeUrl: string
  scanCount: number
  submissionCount?: number
  createdAt: string
}

interface PublicConfig {
  crmBaseUrl: string
  jotFormWebhookHint?: string
}

function qrImageAbsoluteUrl(qrCodeUrl: string, origin: string): string {
  const o = origin.replace(/\/$/, '')
  if (
    qrCodeUrl.startsWith('data:') ||
    qrCodeUrl.startsWith('http://') ||
    qrCodeUrl.startsWith('https://')
  ) {
    return qrCodeUrl
  }
  return `${o}${qrCodeUrl.startsWith('/') ? '' : '/'}${qrCodeUrl}`
}

export default function QRCodesPage() {
  const [origin, setOrigin] = useState('')
  const [jotFormUrl, setJotFormUrl] = useState(
    () =>
      process.env.NEXT_PUBLIC_JOTFORM_URL?.trim() ||
      'https://form.jotform.com/253266939811163'
  )
  const [source, setSource] = useState('')
  const [qrCode, setQrCode] = useState<{ qrCodeUrl: string; qrCodeId: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedServerUrl, setCopiedServerUrl] = useState(false)
  const [qrHistory, setQrHistory] = useState<QRCodeHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedQR, setSelectedQR] = useState<QRCodeHistory | null>(null)
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)

  useEffect(() => {
    void loadQRHistory()
  }, [])

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
  }, [])

  useEffect(() => {
    fetch('/api/public/config')
      .then((r) => r.json())
      .then(setPublicConfig)
      .catch(() => setPublicConfig(null))
  }, [])

  async function loadQRHistory(): Promise<QRCodeHistory[]> {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/qrcodes')
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText)
        console.error('GET /api/qrcodes failed:', res.status, errText)
        setQrHistory([])
        return []
      }
      const raw = await res.json()
      if (raw && typeof raw === 'object' && 'error' in raw) {
        console.error('GET /api/qrcodes error payload:', raw)
        setQrHistory([])
        return []
      }
      const data = asArray<QRCodeHistory>(raw)
      setQrHistory(data)
      return data
    } catch (error) {
      console.error('Failed to load QR history:', error)
      setQrHistory([])
      return []
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleGenerate() {
    if (!source) {
      alert('Please select a source location')
      return
    }
    if (!jotFormUrl?.trim()) {
      alert('Please enter your JotForm form URL.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/qrcodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jotFormUrl,
          source,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setQrCode({ qrCodeUrl: data.qrCodeUrl, qrCodeId: data.qrCodeId })
        const list = await loadQRHistory()
        const newRow = list.find((q) => q.id === data.qrCodeId)
        if (newRow) setSelectedQR(newRow)
      } else {
        alert('Failed to generate QR code: ' + (data.error || res.statusText))
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

  /** Destination URL encoded in the QR (from DB after generate). */
  function resolveScanTargetUrl(q: { id: string; source: string; jotFormUrl?: string }) {
    const u = (q.jotFormUrl || '').trim()
    if (u.startsWith('http')) return u
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/10 dark:bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              QR Code Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Each QR first opens this CRM (<strong>scan counted</strong>), then sends the visitor to your JotForm. New
            contacts appear after your JotForm webhook posts to this app.{' '}
            <strong>Regenerate</strong> older QR images so they use the tracker URL.
          </p>
        </div>

        {publicConfig ? (
          <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 border-emerald-200/60 dark:border-emerald-800/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Production setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">App base URL</span> (also set as{' '}
                <code className="text-xs">NEXT_PUBLIC_APP_URL</code> in Vercel):
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 break-all rounded-md bg-slate-100 dark:bg-slate-900 px-3 py-2 text-xs">
                  {publicConfig.crmBaseUrl}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={() => copyServerUrl(publicConfig.crmBaseUrl)}>
                  {copiedServerUrl ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {publicConfig.jotFormWebhookHint ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">{publicConfig.jotFormWebhookHint}</p>
              ) : null}
              <p className="text-xs text-amber-800 dark:text-amber-200/90 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2">
                QR generation needs <code className="text-xs">DATABASE_URL</code> on the server (your production
                database). Without it, the API cannot save QR records.
              </p>
              <div className="rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/25 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">JotForm → CRM</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Webhook URL must be{' '}
                    <code className="text-[11px] break-all">
                      {publicConfig.crmBaseUrl}/api/webhooks/jotform
                    </code>{' '}
                    (POST, JSON).
                  </li>
                  <li>
                    Add a <strong>hidden</strong> (or short text) field named exactly{' '}
                    <code className="text-xs">qr_code_id</code> so JotForm captures it from the form URL query string.
                    That ties each submission to this QR for <strong>submission</strong> counts.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <Globe className="w-4 h-4 inline mr-1" />
                  JotForm URL *
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                onClick={() => void handleGenerate()}
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
                        submissionCount: 0,
                        createdAt: new Date().toISOString(),
                        jotFormUrl: jotFormUrl || '',
                      }
                    : null)
                if (!displayQR) return null
                const scanUrl = resolveScanTargetUrl(displayQR) || displayQR.jotFormUrl
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
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Source</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{displayQR.source}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Scans</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">{displayQR.scanCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Submits</p>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                              {displayQR.submissionCount ?? 0}
                            </p>
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
                          const o = typeof window !== 'undefined' ? window.location.origin : ''
                          openPrintableQrSheet({
                            title: `Referral QR — ${displayQR.source}`,
                            source: displayQR.source,
                            qrImageAbsoluteUrl: qrImageAbsoluteUrl(displayQR.qrCodeUrl, o),
                            intakeUrl: scanUrl,
                            qrId: displayQR.id,
                          })
                        }}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print QR sheet
                      </Button>
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Scanning hits this CRM first (scan +1), then redirects to JotForm with tracking parameters.
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
                              {qr.scanCount} scans · {qr.submissionCount ?? 0} submits
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
                            const o = typeof window !== 'undefined' ? window.location.origin : ''
                            openPrintableQrSheet({
                              title: `Referral QR — ${qr.source}`,
                              source: qr.source,
                              qrImageAbsoluteUrl: qrImageAbsoluteUrl(qr.qrCodeUrl, o),
                              intakeUrl: resolveScanTargetUrl(qr) || qr.jotFormUrl,
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

        <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">1. Generate</div>
                <p>Enter your live JotForm URL, pick a source location, and create a QR that includes tracking IDs.</p>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">2. Track</div>
                <p>Scans increment on your QR record when the intake flow reports them.</p>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">3. Analyze</div>
                <p>Use dashboard referral stats to compare sources.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
