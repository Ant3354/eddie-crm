'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Plus, Play, Pause, Users, Calendar, TrendingUp, Activity, Sparkles } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description?: string
  category: string
  type: string
  isActive: boolean
  steps: Array<any>
  _count: {
    contacts: number
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, totalContacts: 0 })

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      setCampaigns(data)
      
      setStats({
        total: data.length,
        active: data.filter((c: Campaign) => c.isActive).length,
        totalContacts: data.reduce((sum: number, c: Campaign) => sum + (c._count?.contacts || 0), 0),
      })
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
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

  const getTypeIcon = (type: string) => {
    if (type === 'REFERRAL_DRIP') return <TrendingUp className="w-5 h-5" />
    if (type === 'RENEWAL') return <Calendar className="w-5 h-5" />
    if (type === 'FAILED_PAYMENT') return <Activity className="w-5 h-5" />
    return <Megaphone className="w-5 h-5" />
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
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-xl shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Campaigns
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Automated marketing and engagement campaigns</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalContacts}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <Link href="/campaigns/new">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaigns...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getCategoryColor(campaign.category)}`}></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 dark:bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {campaign.name}
                      </CardTitle>
                      {campaign.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{campaign.description}</p>
                      )}
                    </div>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(campaign.category)} text-white`}>
                      {getTypeIcon(campaign.type)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        campaign.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1'
                      }`}
                    >
                      {campaign.isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {campaign.category.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {campaign.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contacts</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign._count?.contacts || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Steps</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        {campaign.steps?.length || 0}
                      </p>
                    </div>
                  </div>
                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button variant="outline" className="w-full border-gray-300 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {campaigns.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Megaphone className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No campaigns found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Create your first automated campaign</p>
                  <Link href="/campaigns/new">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
