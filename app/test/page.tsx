'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TestResult {
  status: string
  message?: string
  error?: string
  [key: string]: any
}

export default function TestPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const [testType, setTestType] = useState<'basic' | 'requirements'>('basic')

  async function runTests() {
    setTesting(true)
    setResults(null)
    try {
      const endpoint = testType === 'requirements' ? '/api/test-all-requirements' : '/api/test'
      const res = await fetch(endpoint)
      const data = await res.json()
      setResults(data)
    } catch (error: any) {
      setResults({
        error: error.message,
        tests: {},
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Tests</h1>
        <div className="flex gap-3">
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value as 'basic' | 'requirements')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
            disabled={testing}
          >
            <option value="basic">Basic Tests</option>
            <option value="requirements">All Requirements Tests</option>
          </select>
          <Button onClick={runTests} disabled={testing}>
            {testing ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </div>
      </div>

      {results && (
        <div className="space-y-4">
          {results.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{results.summary.total}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results.summary.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(results.tests || {}).map(([key, value]: [string, any]) => (
                  <div
                    key={key}
                    className={`p-3 rounded border-l-4 ${
                      value.status === 'PASS'
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        {value.message && <div className="text-sm text-gray-600 mt-1">{value.message}</div>}
                        {value.error && <div className="text-sm text-red-600 mt-1">{value.error}</div>}
                        {value.testMode && (
                          <div className="text-xs text-yellow-600 mt-1">⚠️ Test mode (credentials not configured)</div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          value.status === 'PASS'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {value.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {results.errors && results.errors.length > 0 && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="text-red-600">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {results.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-600">{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!results && !testing && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Click "Run All Tests" to test all system features
          </CardContent>
        </Card>
      )}
    </div>
  )
}

