'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Webhook, Mail, MessageSquare, Play, Copy, CheckCircle2, ExternalLink, Code } from 'lucide-react'
import { useState } from 'react'

export default function IntegrationsPage() {
  const [copied, setCopied] = useState<string | null>(null)

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
