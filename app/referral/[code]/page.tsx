'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReferralPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleReferral()
  }, [params.code])

  async function handleReferral() {
    try {
      // Track the click
      const clickRes = await fetch(`/api/referral/${params.code}/click`, {
        method: 'POST',
      })

      if (!clickRes.ok) {
        throw new Error('Invalid referral code')
      }

      // Get JotForm URL from environment or config
      // Note: In client components, we need to get this from an API or use a default
      const jotFormUrl = process.env.NEXT_PUBLIC_JOTFORM_URL || 'https://form.jotform.com/YOUR_FORM_ID'
      
      // If no URL configured, show error
      if (!jotFormUrl || jotFormUrl.includes('YOUR_FORM_ID')) {
        setError('JotForm URL not configured. Please set NEXT_PUBLIC_JOTFORM_URL in .env')
        setLoading(false)
        return
      }
      
      // Redirect to JotForm with referral tracking
      const url = new URL(jotFormUrl)
      url.searchParams.set('referral_code', params.code as string)
      url.searchParams.set('utm_source', 'referral')
      url.searchParams.set('utm_medium', 'referral_link')
      url.searchParams.set('utm_campaign', 'referral')

      window.location.href = url.toString()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Redirecting to form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

