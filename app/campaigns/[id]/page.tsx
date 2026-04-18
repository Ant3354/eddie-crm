'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Megaphone, ArrowLeft, Edit, Play, Pause, Users, Calendar, 
  Mail, MessageSquare, CheckSquare2, TrendingUp, Activity, 
  Sparkles, Tag, Globe, Clock, Save, X
} from 'lucide-react'
import { asArray } from '@/lib/as-array'

interface Campaign {
  id: string
  name: string
  description?: string
  category: string
  type: string
  isActive: boolean
  steps: Array<{
    id: string
    stepOrder: number
    triggerDays: number | null
    channel: string
    subject: string | null
    content: string
  }>
  contacts: Array<{
    id: string
    contactId: string
    status: string
    currentStep: number
    contact: {
      id: string
      firstName: string
      lastName: string
      email?: string
      mobilePhone?: string
      status: string
      category: string
    }
  }>
  _count: {
    contacts: number
  }
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    loadCampaign()
  }, [params.id])

  async function loadCampaign() {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        const normalized: Campaign = {
          ...data,
          steps: asArray(data?.steps),
          contacts: asArray(data?.contacts),
          _count: data?._count ?? { contacts: 0 },
        }
        setCampaign(normalized)
        setFormData({
          name: normalized.name,
          description: normalized.description || '',
          category: normalized.category,
          type: normalized.type,
          isActive: normalized.isActive,
        })
      } else {
        console.error('Failed to load campaign')
      }
    } catch (error) {
      console.error('Failed to load campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        await loadCampaign()
        setEditing(false)
      } else {
        alert('Failed to update campaign')
      }
    } catch (error) {
      console.error('Failed to update campaign:', error)
      alert('Failed to update campaign')
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      CONSUMER: 'from-blue-500 to-cyan-500',
      DENTAL_OFFICE_PARTNER: 'from-teal-500 to-emerald-500',
      HEALTH_OFFICE_PARTNER: 'from-indigo-500 to-purple-500',
      OTHER_BUSINESS_PARTNER: 'from-amber-500 to-orange-500',
      PROSPECT: 'from-pink-500 to-rose-500',
    }
    return colors[category] || 'from-gray-500 to-gray-600'
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="w-5 h-5" />
      case 'SMS':
        return <MessageSquare className="w-5 h-5" />
      case 'TASK':
        return <CheckSquare2 className="w-5 h-5" />
      default:
        return <Sparkles className="w-5 h-5" />
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

  const getTypeIcon = (type: string) => {
    if (type === 'REFERRAL_DRIP') return <TrendingUp className="w-5 h-5" />
    if (type === 'RENEWAL') return <Calendar className="w-5 h-5" />
    if (type === 'FAILED_PAYMENT') return <Activity className="w-5 h-5" />
    return <Megaphone className="w-5 h-5" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Megaphone className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Campaign not found</p>
            <Link href="/campaigns">
              <Button className="mt-4">Back to Campaigns</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/campaigns" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${getCategoryColor(campaign.category)} shadow-lg text-white`}>
                {getTypeIcon(campaign.type)}
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                  {campaign.name}
                </h1>
                {campaign.description && (
                  <p className="text-gray-600 dark:text-gray-400">{campaign.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    campaign.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1'
                  }`}>
                    {campaign.isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {campaign.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {campaign.category.replace(/_/g, ' ')}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {campaign.type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <Button onClick={() => setEditing(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="border-gray-300 dark:border-gray-700">
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Campaign Info */}
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getCategoryColor(campaign.category)}`}></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Campaign Information
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Category</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{campaign.category.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Type</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{campaign.type.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Contacts
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{campaign._count?.contacts || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Steps
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{campaign.steps?.length || 0}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Campaign Steps */}
          <Card className="md:col-span-2 group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Campaign Steps ({campaign.steps?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {campaign.steps && campaign.steps.length > 0 ? (
                  campaign.steps.map((step, index) => (
                    <Card
                      key={step.id}
                      className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getChannelColor(step.channel)}`}></div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${getChannelColor(step.channel)} text-white`}>
                              {getChannelIcon(step.channel)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">Step {index + 1}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {step.triggerDays !== null && step.triggerDays < 0
                                  ? `${Math.abs(step.triggerDays)} days before renewal`
                                  : step.triggerDays === 0
                                  ? 'Immediately'
                                  : `${step.triggerDays} days after enrollment`}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                            {step.channel}
                          </span>
                        </div>
                        {step.subject && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{step.subject}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Content</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{step.content}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No steps configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Contacts */}
          <Card className="lg:col-span-3 group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Campaign Contacts ({campaign.contacts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {campaign.contacts && campaign.contacts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaign.contacts.map((campaignContact) => (
                    <Link
                      key={campaignContact.id}
                      href={`/contacts/${campaignContact.contactId}`}
                      className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {campaignContact.contact.firstName} {campaignContact.contact.lastName}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          campaignContact.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : campaignContact.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {campaignContact.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        {campaignContact.contact.email && (
                          <p>Email: {campaignContact.contact.email}</p>
                        )}
                        <p>Step: {campaignContact.currentStep + 1} / {campaign.steps?.length || 0}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No contacts in this campaign</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

