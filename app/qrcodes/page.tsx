'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Download, Sparkles, Copy, CheckCircle2, Globe, MapPin, History, Eye, Calendar } from 'lucide-react'

interface QRCodeHistory {
  id: string
  source: string
  jotFormUrl: string
  qrCodeUrl: string
  scanCount: number
  createdAt: string
}

export default function QRCodesPage() {
  const [jotFormUrl, setJotFormUrl] = useState('')
  const [source, setSource] = useState('')
  const [qrCode, setQrCode] = useState<{ qrCodeUrl: string; qrCodeId: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrHistory, setQrHistory] = useState<QRCodeHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedQR, setSelectedQR] = useState<QRCodeHistory | null>(null)

  useEffect(() => {
    loadQRHistory()
  }, [])

  async function loadQRHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/qrcodes')
      const data = await res.json()
      setQrHistory(data)
      // If there's a newly generated QR code, select it
      if (qrCode && data.length > 0) {
        const found = data.find((q: QRCodeHistory) => q.id === qrCode.qrCodeId)
        if (found) setSelectedQR(found)
      }
    } catch (error) {
      console.error('Failed to load QR history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleGenerate() {
    if (!jotFormUrl || !source) {
      alert('Please provide both JotForm URL and source')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/qrcodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jotFormUrl, source }),
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
        </div>

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
                const displayQR = selectedQR || (qrCode ? { 
                  id: qrCode.qrCodeId, 
                  qrCodeUrl: qrCode.qrCodeUrl,
                  source: source,
                  scanCount: 0,
                  createdAt: new Date().toISOString()
                } : null)
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
                <p>Enter your JotForm URL and select the source location</p>
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
