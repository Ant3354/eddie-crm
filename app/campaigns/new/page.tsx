'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Megaphone, Plus, X, Mail, MessageSquare, CheckSquare2, Calendar, ArrowLeft, Sparkles, Save } from 'lucide-react'
import Link from 'next/link'

interface CampaignStep {
  stepOrder: number
  triggerDays: number | null
  channel: string
  subject: string
  content: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CONSUMER',
    type: 'CUSTOM',
    isActive: true,
  })
  const [steps, setSteps] = useState<CampaignStep[]>([
    {
      stepOrder: 0,
      triggerDays: 0,
      channel: 'EMAIL',
      subject: '',
      content: '',
    },
  ])
  const [loading, setLoading] = useState(false)

  function addStep() {
    setSteps([
      ...steps,
      {
        stepOrder: steps.length,
        triggerDays: 0,
        channel: 'EMAIL',
        subject: '',
        content: '',
      },
    ])
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, stepOrder: i })))
  }

  function updateStep(index: number, field: keyof CampaignStep, value: any) {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: steps.map((step, index) => ({
            stepOrder: index,
            triggerDays: step.triggerDays === null ? null : parseInt(String(step.triggerDays)),
            channel: step.channel,
            subject: step.subject || null,
            content: step.content,
          })),
        }),
      })

      if (res.ok) {
        router.push(`/campaigns`)
      } else {
        const error = await res.json()
        alert('Failed to create campaign: ' + (error.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to create campaign:', error)
      alert('Failed to create campaign: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="w-4 h-4" />
      case 'SMS':
        return <MessageSquare className="w-4 h-4" />
      case 'TASK':
        return <CheckSquare2 className="w-4 h-4" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return 'from-blue-500 to-cyan-500'
      case 'SMS':
        return 'from-purple-500 to-pink-500'
      case 'TASK':
        return 'from-amber-500 to-orange-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/campaigns" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-xl shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                New Campaign
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Create an automated marketing campaign</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Campaign Info */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Campaign Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Campaign Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email Sequence"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this campaign does..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Category</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="CUSTOM">Custom</option>
                    <option value="REFERRAL_DRIP">Referral Drip</option>
                    <option value="RENEWAL">Renewal</option>
                    <option value="NURTURE">Nurture</option>
                    <option value="PORTAL_REDIRECT">Portal Redirect</option>
                    <option value="FAILED_PAYMENT">Failed Payment</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active (start processing immediately)</label>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Steps */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Campaign Steps ({steps.length})
                </CardTitle>
                <Button
                  type="button"
                  onClick={addStep}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, index) => (
                <Card
                  key={index}
                  className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getChannelColor(step.channel)}`}></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${getChannelColor(step.channel)} text-white`}>
                          {getChannelIcon(step.channel)}
                        </div>
                        <CardTitle className="text-lg">Step {index + 1}</CardTitle>
                      </div>
                      {steps.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Channel</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          value={step.channel}
                          onChange={(e) => updateStep(index, 'channel', e.target.value)}
                        >
                          <option value="EMAIL">Email</option>
                          <option value="SMS">SMS</option>
                          <option value="TASK">Task</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Trigger Days
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          value={step.triggerDays ?? ''}
                          onChange={(e) => updateStep(index, 'triggerDays', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="0 (negative = before renewal)"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Days after enrollment (use negative for days before renewal)
                        </p>
                      </div>
                    </div>
                    {step.channel !== 'TASK' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subject</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          value={step.subject}
                          onChange={(e) => updateStep(index, 'subject', e.target.value)}
                          placeholder="Email/SMS subject line"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        {step.channel === 'TASK' ? 'Task Description' : 'Content'}
                      </label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                        rows={4}
                        value={step.content}
                        onChange={(e) => updateStep(index, 'content', e.target.value)}
                        placeholder={step.channel === 'TASK' ? 'Task description...' : 'Email/SMS content (supports template variables like [FIRST_NAME], [REFERRAL_LINK])...'}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Available variables: [FIRST_NAME], [LAST_NAME], [EMAIL], [REFERRAL_LINK], [PAYMENT_LINK], [PORTAL_LINK], [RENEWAL_DATE]
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Campaign
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
      </div>
    </div>
  )
}
