'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Webhook,
  Mail,
  MessageSquare,
  Play,
  Copy,
  CheckCircle2,
  ExternalLink,
  Code,
  WifiOff,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { readOfflineModeFromEnv, setOfflineModeOverride, useOfflineMode, OFFLINE_MODE_EVENT } from '@/lib/offline-mode'

export default function IntegrationsPage() {
  const offlineEffective = useOfflineMode()
  const [envOfflineDefault, setEnvOfflineDefault] = useState(false)
  const [overrideMode, setOverrideMode] = useState<'env' | 'on' | 'off'>('env')

  useEffect(() => {
    const read = () => {
      setEnvOfflineDefault(readOfflineModeFromEnv())
      if (typeof window === 'undefined') return
      const o = localStorage.getItem('eddie-offline-mode-override')
      setOverrideMode(o === '1' ? 'on' : o === '0' ? 'off' : 'env')
    }
    read()
    window.addEventListener(OFFLINE_MODE_EVENT, read)
    return () => window.removeEventListener(OFFLINE_MODE_EVENT, read)
  }, [])

  const [copied, setCopied] = useState<string | null>(null)
  const [jotformApiLoading, setJotformApiLoading] = useState(false)
  const [jotformApiJson, setJotformApiJson] = useState<string | null>(null)
  const [jotformSyncLoading, setJotformSyncLoading] = useState(false)
  const [jotformSyncJson, setJotformSyncJson] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/jotform` : '/api/webhooks/jotform'
  const processUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/campaigns/process` : '/api/campaigns/process'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-400/10 dark:bg-rose-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-700 rounded-xl shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">
                Integrations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Configure external services and API endpoints</p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-2 border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-gray-900/80 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <WifiOff className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Offline / LAN-only workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>
              When this is <strong>on</strong>, the CRM favors <strong>mailto</strong>, <strong>SMS links</strong>,{' '}
              <strong>copy</strong>, and <strong>print</strong> instead of relying on server SMTP or Twilio. Use it when
              the app runs only on your local network without outbound email.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Environment default: <strong>{envOfflineDefault ? 'ON' : 'OFF'}</strong> (<code className="text-xs">NEXT_PUBLIC_OFFLINE_MODE=true</code>
              ). Effective now: <strong>{offlineEffective ? 'ON' : 'OFF'}</strong>.
            </p>
            <fieldset className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <legend className="text-xs font-semibold px-1 text-gray-900 dark:text-white">Per-browser override</legend>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="offlineOverride"
                  checked={overrideMode === 'env'}
                  onChange={() => {
                    setOfflineModeOverride(null)
                  }}
                />
                <span>Follow environment (.env)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="offlineOverride"
                  checked={overrideMode === 'on'}
                  onChange={() => {
                    setOfflineModeOverride(true)
                  }}
                />
                <span>Always use offline UI (mailto / print / hide server send)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="offlineOverride"
                  checked={overrideMode === 'off'}
                  onChange={() => {
                    setOfflineModeOverride(false)
                  }}
                />
                <span>Always use online UI (show server email/SMS actions)</span>
              </label>
            </fieldset>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* JotForm Integration */}
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200/50 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 dark:bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Webhook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>JotForm Integration</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your JotForm to automatically create contacts from form submissions
              </p>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Webhook URL</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-mono border border-gray-300 dark:border-gray-700 break-all">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl, 'jotform')}
                    className="border-gray-300 dark:border-gray-700"
                  >
                    {copied === 'jotform' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Setup:</strong> Copy this URL and paste it into your JotForm webhook settings. All form submissions will automatically create contacts in your CRM.
                </p>
              </div>
              <div className="border-t border-blue-200/60 dark:border-blue-800/60 pt-4 space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>API key (read forms & submissions):</strong> add{' '}
                  <code className="rounded bg-gray-100 dark:bg-gray-900 px-1">JOTFORM_API_KEY</code> to{' '}
                  <code className="rounded bg-gray-100 dark:bg-gray-900 px-1">.env.local</code> (dev) or Vercel env
                  (production). Optionally set <code className="rounded bg-gray-100 dark:bg-gray-900 px-1">JOTFORM_FORM_ID</code>{' '}
                  for which form to sample submissions from (defaults to your first form).
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={jotformApiLoading}
                  onClick={async () => {
                    setJotformApiLoading(true)
                    setJotformApiJson(null)
                    try {
                      const res = await fetch('/api/integrations/jotform')
                      const data = await res.json()
                      setJotformApiJson(JSON.stringify(data, null, 2))
                    } catch (e) {
                      setJotformApiJson(
                        JSON.stringify(
                          { ok: false, message: e instanceof Error ? e.message : 'Request failed' },
                          null,
                          2
                        )
                      )
                    } finally {
                      setJotformApiLoading(false)
                    }
                  }}
                  className="gap-2"
                >
                  {jotformApiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testing…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Test JotForm API
                    </>
                  )}
                </Button>
                {jotformApiJson ? (
                  <pre className="max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-3 text-[11px] leading-relaxed">
                    {jotformApiJson}
                  </pre>
                ) : null}
                <div className="border-t border-blue-200/60 dark:border-blue-800/60 pt-4 space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Inbox sync now:</strong> pulls new submissions from all discovered JotForm forms (same as
                    scheduled sync). Paste your <code className="rounded bg-gray-100 dark:bg-gray-900 px-1">CRON_SECRET</code>{' '}
                    (Vercel → same value as the cron job uses).
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={jotformSyncLoading}
                    onClick={async () => {
                      const secret = typeof window !== 'undefined' ? window.prompt('CRON_SECRET')?.trim() : ''
                      if (!secret) return
                      setJotformSyncLoading(true)
                      setJotformSyncJson(null)
                      try {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/cron/jotform-sync`
                        const res = await fetch(url, {
                          headers: { Authorization: `Bearer ${secret}` },
                        })
                        const data = await res.json().catch(() => ({ error: 'Invalid JSON' }))
                        setJotformSyncJson(JSON.stringify({ ok: res.ok, status: res.status, ...data }, null, 2))
                      } catch (e) {
                        setJotformSyncJson(
                          JSON.stringify(
                            { ok: false, message: e instanceof Error ? e.message : 'Request failed' },
                            null,
                            2
                          )
                        )
                      } finally {
                        setJotformSyncLoading(false)
                      }
                    }}
                    className="gap-2"
                  >
                    {jotformSyncLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run inbox sync now
                      </>
                    )}
                  </Button>
                  {jotformSyncJson ? (
                    <pre className="max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-3 text-[11px] leading-relaxed">
                      {jotformSyncJson}
                    </pre>
                  ) : null}
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">
                    Vercel Hobby only allows cron once per day. For near–real-time imports, add the GitHub Action in{' '}
                    <code className="text-[10px]">.github/workflows/jotform-inbox-sync.yml</code> with repo secrets{' '}
                    <code className="text-[10px]">CRON_SECRET</code> and <code className="text-[10px]">VERCEL_PRODUCTION_URL</code>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email (SMTP) */}
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-green-200/50 dark:border-green-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/5 dark:bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Email (SMTP)</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure SMTP settings for sending emails
              </p>
            </CardHeader>
            <CardContent className="relative z-10">
              {offlineEffective ? (
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Offline UI:</strong> server SMTP send is de-emphasized. Use contact pages to{' '}
                    <strong>copy</strong> text, <strong>mailto</strong> drafts, or <strong>print</strong> instead.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SMTP variables remain in <code className="text-xs">.env</code> if you later deploy online; turn off
                    offline mode above to surface the full server integration panel.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Environment Variables (.env)</p>
                    <div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        SMTP_HOST
                      </div>
                      <div className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        SMTP_PORT
                      </div>
                      <div className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        SMTP_USER
                      </div>
                      <div className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        SMTP_PASS
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-800 dark:text-green-300">
                      <strong>Note:</strong> Without SMTP credentials, emails will be logged to the database in test mode.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS (Twilio) */}
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 dark:bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>SMS (Twilio)</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure Twilio for sending SMS messages
              </p>
            </CardHeader>
            <CardContent className="relative z-10">
              {offlineEffective ? (
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Offline UI:</strong> server SMS send is de-emphasized. Use <strong>sms:</strong> links from the
                    contact page (mobile) or copy the message text.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Twilio variables stay in <code className="text-xs">.env</code> for a future online deployment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Environment Variables (.env)</p>
                    <div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        TWILIO_ACCOUNT_SID
                      </div>
                      <div className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        TWILIO_AUTH_TOKEN
                      </div>
                      <div className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        TWILIO_PHONE_NUMBER
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-800 dark:text-purple-300">
                      <strong>Note:</strong> Without Twilio credentials, SMS will be logged to the database in test mode.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Processing */}
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-amber-200/50 dark:border-amber-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 dark:bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Play className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle>Campaign Processing</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automate campaign execution with scheduled processing
              </p>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Processing Endpoint</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-mono border border-gray-300 dark:border-gray-700">
                    {processUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(processUrl, 'process')}
                    className="border-gray-300 dark:border-gray-700"
                  >
                    {copied === 'process' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-2">
                  <strong>Setup Cron Job:</strong> Set up a cron service to call this endpoint periodically (recommended: every hour).
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <a
                    href="https://vercel.com/docs/cron-jobs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Vercel Cron <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-amber-600 dark:text-amber-500">•</span>
                  <a
                    href="https://www.easycron.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    EasyCron <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
