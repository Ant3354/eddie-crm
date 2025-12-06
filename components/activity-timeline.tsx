'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  metadata?: any
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return '📧'
      case 'SMS':
        return '📱'
      case 'TASK':
        return '✅'
      case 'CAMPAIGN':
        return '📢'
      case 'AUDIT':
        return '📝'
      default:
        return '•'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'bg-blue-100 text-blue-800'
      case 'SMS':
        return 'bg-green-100 text-green-800'
      case 'TASK':
        return 'bg-purple-100 text-purple-800'
      case 'CAMPAIGN':
        return 'bg-orange-100 text-orange-800'
      case 'AUDIT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No activity recorded yet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{activity.title}</div>
                    {activity.description && (
                      <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getActivityColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

