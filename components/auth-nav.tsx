'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Me = { id: string; email: string; role: string }

export function AuthNav() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!res.ok) {
        setMe(null)
        return
      }
      setMe(await res.json())
    } catch {
      setMe(null)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setMe(null)
    router.refresh()
    router.push('/login')
  }

  if (me === undefined) {
    return <span className="text-xs text-gray-500 dark:text-gray-400 px-2">…</span>
  }

  if (!me) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-xs h-8">
          Sign in
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[140px] truncate hidden sm:inline">
        {me.email} · {me.role}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-gray-300 dark:border-gray-600 text-xs h-8"
        onClick={() => void logout()}
      >
        Sign out
      </Button>
    </div>
  )
}
