'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImportContactsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleImport() {
    if (!file) {
      alert('Please select a file')
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setResult(data)

      if (data.success) {
        setTimeout(() => {
          router.push('/contacts')
        }, 2000)
      }
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Import Contacts</h1>
      <Card>
        <CardHeader>
          <CardTitle>CSV Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded"
            />
            <p className="text-sm text-gray-500 mt-2">
              CSV should have columns: First Name, Last Name, Email, Phone, Address, Category, Status, Email Opt-in, SMS Opt-in
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="font-semibold">
                {result.success ? '✅ Import Successful' : '❌ Import Failed'}
              </div>
              <div className="mt-2">
                <div>Imported: {result.imported} contacts</div>
                {result.errors > 0 && (
                  <div>Errors: {result.errors} rows</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

