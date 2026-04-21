'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { IntakePipelineRule, CrmSettingsShape } from '@/lib/crm-settings'
import { ArrowLeft, Loader2, Plus, Trash2, Save } from 'lucide-react'

type UserRow = { id: string; email: string; name: string | null; role: string }

function emptyRule(): IntakePipelineRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    enabled: true,
    newContactOnly: false,
    ifSourceContains: '',
    taskDueHours: 24,
  }
}

export default function CrmSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])
  const [settings, setSettings] = useState<CrmSettingsShape>({
    pipelineRules: [],
    taskReminderHoursBeforeDue: 24,
  })
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const [sRes, uRes] = await Promise.all([
        fetch('/api/settings/crm', { cache: 'no-store' }),
        fetch('/api/users', { cache: 'no-store' }),
      ])
      if (sRes.ok) {
        const s = await sRes.json()
        setSettings({
          pipelineRules: Array.isArray(s.pipelineRules) ? s.pipelineRules : [],
          taskReminderHoursBeforeDue:
            typeof s.taskReminderHoursBeforeDue === 'number' ? s.taskReminderHoursBeforeDue : 24,
        })
      }
      if (uRes.ok) setUsers(await uRes.json())
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || res.statusText)
      setMessage('Saved.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function updateRule(index: number, patch: Partial<IntakePipelineRule>) {
    const rules = [...(settings.pipelineRules || [])]
    rules[index] = { ...rules[index], ...patch }
    setSettings({ ...settings, pipelineRules: rules })
  }

  function removeRule(index: number) {
    const rules = [...(settings.pipelineRules || [])]
    rules.splice(index, 1)
    setSettings({ ...settings, pipelineRules: rules })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">CRM automation</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Pipeline rules run after each JotForm ingest or QR intake. Task reminders use the cron job{' '}
          <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">/api/cron/task-reminders</code>.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <Card className="mb-6 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Task & appointment reminders</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending tasks with a due date within this many hours are eligible for one email/SMS reminder (if the
                  contact opted in).
                </p>
              </CardHeader>
              <CardContent>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hours before due (window)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  className="w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
                  value={settings.taskReminderHoursBeforeDue ?? 24}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taskReminderHoursBeforeDue: Math.max(1, parseInt(e.target.value, 10) || 24),
                    })
                  }
                />
              </CardContent>
            </Card>

            <Card className="mb-6 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pipeline rules (new intake)</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Match rules top to bottom. Each rule can set stage (status), category, owner, and create a task.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      pipelineRules: [...(settings.pipelineRules || []), emptyRule()],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add rule
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {(settings.pipelineRules || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No rules yet — add one or leave empty.</p>
                ) : null}
                {(settings.pipelineRules || []).map((rule, i) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white/50 dark:bg-gray-900/40"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rule {i + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRule(i)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={rule.enabled !== false}
                          onChange={(e) => updateRule(i, { enabled: e.target.checked })}
                        />
                        Enabled
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(rule.newContactOnly)}
                          onChange={(e) => updateRule(i, { newContactOnly: e.target.checked })}
                        />
                        New contact only
                      </label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Source contains</label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          placeholder="e.g. Airport (optional)"
                          value={rule.ifSourceContains || ''}
                          onChange={(e) => updateRule(i, { ifSourceContains: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">QR submission</label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          value={rule.ifHasQr === true ? 'yes' : rule.ifHasQr === false ? 'no' : 'any'}
                          onChange={(e) => {
                            const v = e.target.value
                            updateRule(i, {
                              ifHasQr: v === 'yes' ? true : v === 'no' ? false : undefined,
                            })
                          }}
                        >
                          <option value="any">Any</option>
                          <option value="yes">Must have QR</option>
                          <option value="no">No QR only</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Set status</label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          placeholder="LEAD, SCHEDULED, …"
                          value={rule.setStatus || ''}
                          onChange={(e) => updateRule(i, { setStatus: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Set category</label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          placeholder="CONSUMER, PROSPECT, …"
                          value={rule.setCategory || ''}
                          onChange={(e) => updateRule(i, { setCategory: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Owner (user)</label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          value={rule.setOwnerUserId || ''}
                          onChange={(e) => updateRule(i, { setOwnerUserId: e.target.value || null })}
                        >
                          <option value="">— No change —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {(u.name || u.email) + ` (${u.role})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Task title</label>
                        <input
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          placeholder="Follow up new lead"
                          value={rule.taskTitle || ''}
                          onChange={(e) => updateRule(i, { taskTitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Task due (hours)</label>
                        <input
                          type="number"
                          min={1}
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          value={rule.taskDueHours ?? 24}
                          onChange={(e) =>
                            updateRule(i, { taskDueHours: Math.max(1, parseInt(e.target.value, 10) || 24) })
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Task description</label>
                        <textarea
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm min-h-[60px]"
                          value={rule.taskDescription || ''}
                          onChange={(e) => updateRule(i, { taskDescription: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Assign task to</label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
                          value={rule.taskAssigneeUserId || ''}
                          onChange={(e) => updateRule(i, { taskAssigneeUserId: e.target.value || null })}
                        >
                          <option value="">— Unassigned —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {(u.name || u.email) + ` (${u.role})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center gap-4">
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save settings
              </Button>
              {message ? <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span> : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
