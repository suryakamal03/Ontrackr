'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import { GitCommit, GitPullRequest, GitMerge, AlertCircle, ExternalLink, GitBranch, CheckCircle } from 'lucide-react'
import { githubActivityService } from '@/backend/integrations/githubActivityService'
import { GitHubActivity } from '@/types'
import { getRelativeTime, getExactTimestamp } from '@/lib/utils'

interface ProjectGitHubProps {
  projectId: string
}

export default function ProjectGitHub({ projectId }: ProjectGitHubProps) {
  const [activities, setActivities] = useState<GitHubActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[ProjectGitHub] Subscribing to activities for project:', projectId)
    setLoading(true)
    setError(null)
    
    try {
      const unsubscribe = githubActivityService.subscribeToActivities(
        projectId,
        (updatedActivities) => {
          console.log('[ProjectGitHub] Received activities:', updatedActivities.length)
          setActivities(updatedActivities)
          setLoading(false)
        },
        (err) => {
          console.error('[ProjectGitHub] Subscription error:', err)
          setError(err.message)
          setLoading(false)
        }
      )

      return () => {
        console.log('[ProjectGitHub] Unsubscribing from activities')
        unsubscribe()
      }
    } catch (err: any) {
      console.error('[ProjectGitHub] Setup error:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [projectId])

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'commit':
        return { icon: GitCommit, color: 'purple' }
      case 'pull_request_opened':
        return { icon: GitPullRequest, color: 'blue' }
      case 'pull_request_merged':
        return { icon: GitMerge, color: 'green' }
      case 'issue_opened':
        return { icon: AlertCircle, color: 'red' }
      case 'issue_closed':
        return { icon: CheckCircle, color: 'green' }
      default:
        return { icon: GitCommit, color: 'gray' }
    }
  }

  const getActivityLabel = (activityType: string) => {
    switch (activityType) {
      case 'commit':
        return 'Committed'
      case 'pull_request_opened':
        return 'Opened PR'
      case 'pull_request_merged':
        return 'Merged PR'
      case 'issue_opened':
        return 'Opened issue'
      case 'issue_closed':
        return 'Closed issue'
      default:
        return 'Activity'
    }
  }

  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  const handleActivityClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">GitHub Activity</h2>
        <div className="text-center py-8 text-gray-500">Loading activities...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">GitHub Activity</h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-red-500 text-sm mb-1">Error loading activities</p>
          <p className="text-gray-400 text-xs">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">GitHub Activity</h2>
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No GitHub activity yet</p>
          <p className="text-gray-400 text-xs mb-2">
            Activity will appear here when team members push commits, open PRs, or create issues
          </p>
          <p className="text-gray-400 text-xs font-mono bg-gray-50 px-3 py-2 rounded inline-block">
            Project ID: {projectId}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon: Icon, color } = getActivityIcon(activity.activityType)
            return (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity.githubUrl)}
                className="flex gap-3 pb-4 border-b border-gray-200 last:border-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-3 rounded-lg transition-colors group"
                title={getExactTimestamp(activity.createdAt)}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">{activity.title}</p>
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">{getActivityLabel(activity.activityType)}</span>
                    <span>•</span>
                    <span className="font-mono text-gray-600">{activity.githubUsername}</span>
                    {activity.branch && (
                      <>
                        <span>•</span>
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{activity.branch}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-gray-500">{getRelativeTime(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

