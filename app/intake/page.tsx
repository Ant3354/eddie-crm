'use client'

import { Suspense } from 'react'
import { IntakeForm } from './intake-form'

export default function IntakePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/40 py-10 px-4">
      <Suspense
        fallback={
          <div className="max-w-lg mx-auto text-center text-slate-600 text-sm py-12">Loading…</div>
        }
      >
        <IntakeForm />
      </Suspense>
    </div>
  )
}
