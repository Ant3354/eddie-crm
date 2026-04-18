'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare2, Plus, Clock, AlertCircle, CheckCircle2, XCircle, User, Calendar, Flag } from 'lucide-react'
import { asArray } from '@/lib/as-array'

interface Task {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  dueDate?: string
  contact?: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', priority: '' })
  const [stats, setStats] = useState({ total: 0, pending: 0, urgent: 0, overdue: 0 })
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    contactId: '',
  })
  const [contacts, setContacts] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTasks()
    loadContacts()
  }, [filter])

  async function loadContacts() {
    try {
      const res = await fetch('/api/contacts')
      const raw = await res.json()
      const data = asArray<{ id: string; firstName: string; lastName: string }>(raw)
      setContacts(data.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName })))
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
  }

  async function handleCreateTask() {
    if (!newTask.title.trim()) {
      alert('Please enter a task title')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || undefined,
          priority: newTask.priority,
          dueDate: newTask.dueDate || undefined,
          contactId: newTask.contactId || undefined,
        }),
      })

      if (res.ok) {
        setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', contactId: '' })
        setShowNewTask(false)
        loadTasks()
      } else {
        const error = await res.json()
        alert('Failed to create task: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  async function loadTasks() {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      const raw = await res.json()
      const data = asArray<Task>(raw)
      let filtered = data

      if (filter.status) {
        filtered = filtered.filter((t) => t.status === filter.status)
      }
      if (filter.priority) {
        filtered = filtered.filter((t) => t.priority === filter.priority)
      }

      setTasks(filtered)

      const now = new Date()
      setStats({
        total: data.length,
        pending: data.filter((t) => t.status === 'PENDING').length,
        urgent: data.filter((t) => t.priority === 'URGENT').length,
        overdue: data.filter(
          (t) => t.status === 'PENDING' && t.dueDate && new Date(t.dueDate) < now
        ).length,
      })
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const priorityColors: { [key: string]: { bg: string; text: string; icon: any } } = {
    LOW: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-400',
      icon: Flag,
    },
    MEDIUM: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-400',
      icon: Flag,
    },
    HIGH: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-400',
      icon: AlertCircle,
    },
    URGENT: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-400',
      icon: AlertCircle,
    },
  }

  const statusIcons: { [key: string]: any } = {
    PENDING: Clock,
    IN_PROGRESS: Clock,
    COMPLETED: CheckCircle2,
    CANCELLED: XCircle,
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && filter.status !== 'COMPLETED'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-xl shadow-lg">
              <CheckSquare2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                Tasks
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your workflow and follow-ups</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CheckSquare2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-yellow-200/50 dark:border-yellow-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-red-200/50 dark:border-red-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Urgent</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.urgent}</p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-orange-200/50 dark:border-orange-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.overdue}</p>
                  </div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowNewTask(!showNewTask)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all text-lg px-6 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                {showNewTask ? 'Cancel' : 'New Task'}
              </Button>
            </div>
          </div>

          {/* New Task Form */}
          {showNewTask && (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-amber-300/50 dark:border-amber-700/50 shadow-xl mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Create New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    rows={3}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Enter task description"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Priority</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Due Date</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact (Optional)</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      value={newTask.contactId}
                      onChange={(e) => setNewTask({ ...newTask, contactId: e.target.value })}
                    >
                      <option value="">No Contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewTask(false)
                      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', contactId: '' })
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={saving || !newTask.title.trim()}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    {saving ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Priority</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    value={filter.priority}
                    onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => {
              const PriorityIcon = priorityColors[task.priority]?.icon || Flag
              const StatusIcon = statusIcons[task.status] || Clock
              const overdue = isOverdue(task.dueDate)
              const dueSoon = task.dueDate ? (new Date(task.dueDate).getTime() - Date.now()) < 24*60*60*1000 && (new Date(task.dueDate) > new Date()) : false
              
              return (
                <Card
                  key={task.id}
                  className={`group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                    overdue
                      ? 'border-red-400 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                      : dueSoon
                      ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-gray-200/50 dark:border-gray-700/50'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 dark:bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{task.title}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                              priorityColors[task.priority]?.bg || 'bg-gray-100 dark:bg-gray-700'
                            } ${
                              priorityColors[task.priority]?.text || 'text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            <PriorityIcon className="w-3 h-3" />
                            {task.priority}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {task.status.replace(/_/g, ' ')}
                          </span>
                          {overdue && (
                            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              OVERDUE
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4">
                          {task.contact && (
                            <Link
                              href={`/contacts/${task.contact.id}`}
                              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <User className="w-4 h-4" />
                              {task.contact.firstName} {task.contact.lastName}
                            </Link>
                          )}
                          {task.dueDate && (
                            <div className={`flex items-center gap-2 text-sm ${overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            <select
                              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                              defaultValue={task.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value
                                await fetch(`/api/tasks/${task.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: newStatus }) })
                                // refresh list
                                loadTasks()
                              }}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {tasks.length === 0 && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <CheckSquare2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No tasks found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {filter.status || filter.priority ? 'Try adjusting your filters' : 'All tasks are complete!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
