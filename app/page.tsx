import Link from 'next/link'
import { Users, Megaphone, BarChart3, QrCode, CheckSquare, Settings, TestTube, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              EDDIE CRM
            </h1>
          </div>
          <p className="text-2xl text-gray-700 dark:text-gray-300 font-medium mb-4">
            Comprehensive Contact & Campaign Management
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Streamline your customer relationships with powerful automation, analytics, and engagement tools
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              <span className="relative z-10 flex items-center gap-2">
                Open dashboard
                <span className="text-xl">→</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <Link
            href="/contacts"
            className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-blue-200/50 dark:border-blue-800/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 dark:bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Contacts</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Manage contacts, policies, and client profiles with advanced segmentation
              </p>
            </div>
          </Link>

          <Link
            href="/campaigns"
            className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-purple-200/50 dark:border-purple-800/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Campaigns</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Create and manage automated marketing campaigns with multi-step sequences
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-indigo-200/50 dark:border-indigo-800/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                View KPIs, reports, and analytics with real-time insights
              </p>
            </div>
          </Link>

          <Link
            href="/qrcodes"
            className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-green-200/50 dark:border-green-800/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">QR Codes</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Generate and track QR codes for referrals with UTM tracking
              </p>
            </div>
          </Link>

          <Link
            href="/tasks"
            className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-amber-200/50 dark:border-amber-800/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 dark:bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Tasks</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Manage tasks and follow-ups with priority levels and due dates
              </p>
            </div>
          </Link>

          <Link
            href="/integrations"
            className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-rose-200/50 dark:border-rose-800/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 dark:bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Integrations</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Configure JotForm, email, and SMS settings for seamless workflows
              </p>
            </div>
          </Link>

          <Link
            href="/test"
            className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-blue-400/50 dark:border-blue-600/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 dark:bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">System Tests</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Test all features and verify everything works perfectly
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

