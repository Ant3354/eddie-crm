'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Save } from 'lucide-react'

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState('')
  const [contactId, setContactId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isValid = name.trim().length > 0 && subject.trim().length > 0 && content.trim().length > 0

  async function save() {
    if (!isValid || processing) return
    setProcessing(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/templates', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, description, subject, content }) })
      if (res.ok) {
        setSuccess('Template saved')
        setTimeout(()=> router.push('/templates'), 300)
      } else {
        const data = await res.json().catch(()=>({}))
        setError((data as any).error || 'Failed to save template')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save template')
    } finally { setProcessing(false) }
  }

  async function generatePreview() {
    if (!contactId) { setPreview(content); return }
    try {
      setPreview(content)
    } catch { setPreview(content) }
  }

  useEffect(()=>{ generatePreview() }, [content, contactId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">New Template</h1>
            <p className="text-gray-600 dark:text-gray-400">Create a reusable email template with variables</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 text-sm">{success}</div>
        )}

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Name *</label>
              <input className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Description</label>
              <input className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={description} onChange={(e)=>setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Subject *</label>
              <input className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Content *</label>
              <textarea rows={10} className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Hi [FIRST_NAME], ..." />
              <p className="text-xs text-gray-500 mt-1">Variables: [FIRST_NAME], [LAST_NAME], [EMAIL], [PHONE], [REFERRAL_LINK], [PAYMENT_LINK], [PORTAL_LINK], [RENEWAL_DATE]</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={save} disabled={!isValid || processing}><Save className="w-4 h-4 mr-2" /> {processing ? 'Saving...' : 'Save'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
