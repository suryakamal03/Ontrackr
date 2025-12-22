'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { CheckSquare, GitBranch, AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import { useAuth } from '@/backend/auth/authContext'
import { userTaskService, UserTask } from '@/backend/tasks/userTaskService'
import { userGitHubService, UserGitHubActivity, GitHubIssue } from '@/backend/integrations/userGitHubService'
import { getRelativeTime } from '@/lib/utils'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type TabType = 'todo' | 'in-review' | 'issues'

export default function MyDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('todo')
  const [todoTasks, setTodoTasks] = useState<UserTask[]>([])
  const [inReviewTasks, setInReviewTasks] = useState<UserTask[]>([])
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [activities, setActivities] = useState<UserGitHubActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [githubUsername, setGithubUsername] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    if (!user) {
      setDebugInfo('No user logged in')
      return
    }

    setDebugInfo(`User ID: ${user.uid}, Email: ${user.email}`)
    loadUserData()
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      setLoading(true)

      console.log('[MyDashboard] Loading data for user:', user.uid)
      console.log('[MyDashboard] User email:', user.email)

      // Get user's GitHub username from profile
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      const username = userData?.githubUsername || ''
      setGithubUsername(username)

      console.log('[MyDashboard] GitHub username:', username)
      console.log('[MyDashboard] User data:', userData)

      // DEBUG: Fetch ALL tasks to see what's in the database
      const { collection, getDocs } = await import('firebase/firestore')
      const allTasksSnapshot = await getDocs(collection(db, 'tasks'))
      console.log('[MyDashboard] TOTAL TASKS IN DATABASE:', allTasksSnapshot.docs.length)
      allTasksSnapshot.docs.forEach(doc => {
        const data = doc.data()
        console.log('[MyDashboard] Task:', {
          id: doc.id,
          title: data.title,
          assignedTo: data.assignedTo,
          status: data.status,
          matchesCurrentUser: data.assignedTo === user.uid
        })
      })

      // Load ALL user tasks (simplified - no complex queries)
      const allUserTasks = await userTaskService.getUserTasks(user.uid)
      
      console.log('[MyDashboard] All user tasks:', allUserTasks)

      // Filter by status on client side
      const todo = allUserTasks.filter(task => task.status === 'To Do')
      const inReview = allUserTasks.filter(task => task.status === 'In Review')

      console.log('[MyDashboard] To Do tasks:', todo)
      console.log('[MyDashboard] In Review tasks:', inReview)

      setTodoTasks(todo)
      setInReviewTasks(inReview)

      // Load GitHub data if username exists
      if (username) {
        const [userIssues, userActivities] = await Promise.all([
          userGitHubService.getUserGitHubIssues(username),
          userGitHubService.getUserGitHubActivities(username, 10)
        ])

        setIssues(userIssues)
        setActivities(userActivities)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProject = (projectId: string) => {
    router.push(`/projects?project=${projectId}`)
  }

  const handleOpenGitHub = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'commit':
        return { icon: GitBranch, color: 'text-purple-600 bg-purple-100' }
      case 'pull_request_opened':
      case 'pull_request_merged':
        return { icon: GitBranch, color: 'text-blue-600 bg-blue-100' }
      case 'issue_opened':
      case 'issue_closed':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-100' }
      default:
        return { icon: GitBranch, color: 'text-gray-600 bg-gray-100' }
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
        return 'Opened Issue'
      case 'issue_closed':
        return 'Closed Issue'
      default:
        return 'Activity'
    }
  }

  const truncateMessage = (message: string, maxLength: number = 60): string => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength).trim() + '...'
  }

  const renderTaskList = (tasks: UserTask[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )
    }

    if (tasks.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No tasks found</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleViewProject(task.projectId)}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="info" className="text-xs">
                    {task.projectName || 'Unknown Project'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {task.status}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderIssues = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )
    }

    if (!githubUsername) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No GitHub username configured</p>
          <p className="text-xs text-gray-400 mt-1">Add your GitHub username in settings</p>
        </div>
      )
    }

    if (issues.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No open issues found</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => handleOpenGitHub(issue.githubUrl)}
            className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">{issue.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="info" className="text-xs">
                    {issue.projectName || 'Unknown Project'}
                  </Badge>
                  <Badge variant={issue.state === 'open' ? 'danger' : 'success'} className="text-xs">
                    {issue.state}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    #{issue.number} · {getRelativeTime(issue.createdAt)}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Your personal command center</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Section */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Tasks</h2>

            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('todo')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'todo'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                To Do ({todoTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('in-review')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'in-review'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                In Review ({inReviewTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'issues'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Issues ({issues.length})
              </button>
            </div>

            <div className="mt-4 max-h-[calc(100vh-280px)] overflow-y-auto hide-scrollbar">
              {activeTab === 'todo' && renderTaskList(todoTasks)}
              {activeTab === 'in-review' && renderTaskList(inReviewTasks)}
              {activeTab === 'issues' && renderIssues()}
            </div>
          </Card>

          {/* Personal GitHub Activity Section */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">GitHub Activity</h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : !githubUsername ? (
              <div className="text-center py-8">
                <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No GitHub connected</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto hide-scrollbar pr-2">{" "}
                {activities.slice(0, 8).map((activity) => {
                  const { icon: Icon, color } = getActivityIcon(activity.activityType)

                  return (
                    <div
                      key={activity.id}
                      onClick={() => handleOpenGitHub(activity.githubUrl)}
                      className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 mb-0.5">
                          {getActivityLabel(activity.activityType)}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                          {truncateMessage(activity.title)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{activity.projectName}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">{getRelativeTime(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
