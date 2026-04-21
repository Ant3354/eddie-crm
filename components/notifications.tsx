'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, AlertTriangle, Clock, X } from 'lucide-react'
import Link from 'next/link'
import { asArray } from '@/lib/as-array'

interface Notification {
  id: string
  type: 'alert' | 'warning' | 'urgent'
  title: string
  message: string
  link: string
  count: number
}

const NOTIF_ACK_KEY = 'eddie_notif_ack_sig'

function notifSignature(list: Notification[]): string {
  return list.map((n) => `${n.id}:${n.count ?? 1}`).join('|')
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const list = asArray<Notification>(data?.notifications)
        setNotifications(list)
        let ack = ''
        try {
          ack = sessionStorage.getItem(NOTIF_ACK_KEY) || ''
        } catch {
          /* private mode */
        }
        const sig = notifSignature(list)
        const visible = list.length > 0 && sig !== ack ? list.length : 0
        setUnreadCount(visible)
      } else {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
    const interval = setInterval(() => void loadNotifications(), 15000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  useEffect(() => {
    if (!showDropdown || notifications.length === 0) return
    const sig = notifSignature(notifications)
    try {
      sessionStorage.setItem(NOTIF_ACK_KEY, sig)
    } catch {
      /* ignore */
    }
    setUnreadCount(0)
  }, [showDropdown, notifications])

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <Clock className="w-4 h-4 text-amber-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800'
      case 'warning':
        return 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800'
      default:
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-2">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => {
                      try {
                        sessionStorage.setItem(NOTIF_ACK_KEY, notifSignature(notifications))
                      } catch {
                        /* ignore */
                      }
                      setUnreadCount(0)
                      setShowDropdown(false)
                    }}
                    className={`block p-3 mb-2 rounded-lg border-2 ${getColor(notif.type)} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{notif.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

