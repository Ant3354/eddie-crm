'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(Array.isArray(data) ? data : [])
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as any).error || 'Failed to load templates')
        setTemplates([])
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load templates')
      setTemplates([])
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Templates</h1>
          </div>
          <Link href="/templates/new">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"><Plus className="w-4 h-4 mr-2" /> New Template</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading templates...</p>
          </div>
        ) : error ? (
          <div className="mb-6 p-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm">{error}</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => (
              <Card key={t.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t.description || 'No description'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">Updated {new Date(t.updatedAt).toLocaleString()}</div>
                  <Link href={`/templates/${t.id}`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {templates.length===0 && !error && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-8 text-center text-gray-500">No templates yet</CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
