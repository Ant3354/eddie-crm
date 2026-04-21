'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, AlertTriangle, Megaphone, CheckSquare2, MousePointerClick, QrCode, TrendingUp, Activity } from 'lucide-react'

type ChartRow = Record<string, unknown>

interface ChartDataState {
  contactsByCategory: ChartRow[]
  contactsByStatus: ChartRow[]
  referralTrend: ChartRow[]
  campaignPerformance: ChartRow[]
}

const emptyCharts: ChartDataState = {
  contactsByCategory: [],
  contactsByStatus: [],
  referralTrend: [],
  campaignPerformance: [],
}

export default function DashboardPage() {
  /** Recharts + ResponsiveContainer can break SSR/hydration; render charts only in the browser. */
  const [chartsReady, setChartsReady] = useState(false)

  const [stats, setStats] = useState({
    totalContacts: 0,
    paymentAlerts: 0,
    activeCampaigns: 0,
    pendingTasks: 0,
    referralClicks: 0,
    referralConversions: 0,
    qrScans: 0,
    qrSubmissions: 0,
  })
  const [chartData, setChartData] = useState<ChartDataState>(emptyCharts)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    setChartsReady(true)
  }, [])

  async function loadStats() {
    try {
      const [contactsRes, campaignsRes, tasksRes, referralRes, qrRes, analyticsRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/campaigns'),
        fetch('/api/tasks'),
        fetch('/api/referrals/stats'),
        fetch('/api/qrcodes/stats'),
        fetch('/api/analytics'),
      ])

      const parseArr = async (res: Response) => {
        if (!res.ok) return []
        try {
          const data = await res.json()
          return Array.isArray(data) ? data : []
        } catch {
          return []
        }
      }

      const contacts = await parseArr(contactsRes)
      const campaigns = await parseArr(campaignsRes)
      const tasks = await parseArr(tasksRes)

      let referralStats: { totalClicks?: number; totalConversions?: number } = {}
      if (referralRes.ok) {
        try {
          referralStats = await referralRes.json()
        } catch {
          referralStats = {}
        }
      }

      let qrStats: { totalScans?: number; totalSubmissions?: number } = {}
      if (qrRes.ok) {
        try {
          qrStats = await qrRes.json()
        } catch {
          qrStats = {}
        }
      }

      let analytics: ChartDataState = { ...emptyCharts }
      if (analyticsRes.ok) {
        try {
          const raw = await analyticsRes.json()
          analytics = {
            contactsByCategory: Array.isArray(raw.contactsByCategory) ? raw.contactsByCategory : [],
            contactsByStatus: Array.isArray(raw.contactsByStatus) ? raw.contactsByStatus : [],
            referralTrend: Array.isArray(raw.referralTrend) ? raw.referralTrend : [],
            campaignPerformance: Array.isArray(raw.campaignPerformance) ? raw.campaignPerformance : [],
          }
        } catch {
          /* keep defaults */
        }
      }

      setStats({
        totalContacts: contacts.length,
        paymentAlerts: contacts.filter((c: any) => c.paymentIssueAlert).length,
        activeCampaigns: campaigns.filter((c: any) => c.isActive).length,
        pendingTasks: tasks.filter((t: any) => t.status === 'PENDING').length,
        referralClicks: referralStats.totalClicks ?? 0,
        referralConversions: referralStats.totalConversions ?? 0,
        qrScans: qrStats.totalScans ?? 0,
        qrSubmissions: qrStats.totalSubmissions ?? 0,
      })

      setChartData(analytics)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Real-time overview of your CRM performance</p>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-10">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 dark:bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Contacts</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">{stats.totalContacts}</div>
            <Link href="/contacts" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-2 transition-all hover:gap-3">
              View all <TrendingUp className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-red-950/30 dark:via-pink-950/30 dark:to-rose-950/30 border-2 border-red-300/50 dark:border-red-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/20 dark:bg-red-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Payment Alerts</CardTitle>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent mb-3">{stats.paymentAlerts}</div>
            <Link
              href="/contacts?paymentAlert=true"
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold inline-flex items-center gap-2 transition-all hover:gap-3"
            >
              View alerts <TrendingUp className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-sky-950/30 border-2 border-blue-300/50 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 dark:bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Active Campaigns</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-3">{stats.activeCampaigns}</div>
            <Link href="/campaigns" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-2 transition-all hover:gap-3">
              View campaigns <TrendingUp className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border-2 border-amber-300/50 dark:border-amber-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 dark:bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Tasks</CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <CheckSquare2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-3">{stats.pendingTasks}</div>
            <Link href="/tasks" className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold inline-flex items-center gap-2 transition-all hover:gap-3">
              View tasks <TrendingUp className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-violet-950/30 border-2 border-purple-300/50 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 dark:bg-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Referral Clicks</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">{stats.referralClicks}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2 bg-white/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg inline-block">
              {stats.referralConversions} conversions ({stats.referralClicks > 0 ? ((stats.referralConversions / stats.referralClicks) * 100).toFixed(1) : 0}%)
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-2 border-green-300/50 dark:border-green-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 dark:bg-green-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">QR tracking</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <QrCode className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-1">{stats.qrScans}</div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Scans (QR opened via CRM tracker)</div>
            <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-1">{stats.qrSubmissions}</div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Submissions (JotForm linked with qr_code_id)</div>
            <Link href="/qrcodes" className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold inline-flex items-center gap-2 transition-all hover:gap-3">
              View QR codes <TrendingUp className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts: client-only after mount (Recharts + SSR) */}
      {!chartsReady ? (
        <div className="mt-8 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Loading charts…
        </div>
      ) : null}
      {chartsReady ? (
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 relative z-10">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Contacts by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.contactsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.contactsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 as number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.contactsByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="text-4xl mb-2">📊</div>
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 relative z-10">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              Contacts by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.contactsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.contactsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--foreground)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--foreground)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="var(--primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="text-4xl mb-2">📊</div>
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 relative z-10">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              Referral Clicks Trend
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-8">Last 30 Days</p>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.referralTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.referralTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--foreground)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--foreground)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--primary)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="text-4xl mb-2">📈</div>
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 dark:from-green-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 relative z-10">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Megaphone className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.campaignPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    stroke="var(--foreground)"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis 
                    stroke="var(--foreground)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="contacts" 
                    fill="var(--primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="text-4xl mb-2">📊</div>
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      ) : null}
      </div>
    </div>
  )
}

