'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { SlidersHorizontal, ExternalLink, Loader2, MoreVertical } from 'lucide-react'
import { useAuth } from '@/backend/auth/authContext'
import { taskManagementService, TaskManagementItem } from '@/backend/tasks/taskManagementService'

export default function TaskManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskManagementItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Subscribe to real-time task updates
    const unsubscribe = taskManagementService.subscribeToTasks(user.uid, (updatedTasks) => {
      setTasks(updatedTasks)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleTaskClick = (projectId: string) => {
    router.push(`/projects?project=${projectId}`)
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects?project=${projectId}`)
  }

  const formatDeadline = (deadline: any) => {
    if (!deadline) return 'No deadline'
    try {
      const date = deadline.toDate ? deadline.toDate() : new Date(deadline)
      return date.toISOString().split('T')[0]
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
    switch (status) {
      case 'Done':
        return 'success'
      case 'In Review':
        return 'warning'
      case 'To Do':
        return 'info'
      default:
        return 'info'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              {tasks.length > 0 ? `Managing ${tasks.length} tasks across your projects` : 'No tasks to display'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>
        
        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks found</p>
              <p className="text-sm text-gray-400 mt-1">
                {user ? 'Task Management is available for project leads only' : 'Please log in to view tasks'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleProjectClick(task.projectId)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          {task.projectName}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTaskClick(task.projectId)}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 text-left"
                        >
                          {task.title}
                        </button>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.assignedToName ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={task.assignedToName} size="sm" />
                            <span className="text-sm text-gray-900">{task.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(task.status)}>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatDeadline(task.deadlineAt)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTaskClick(task.projectId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        
        <div className="flex items-center justify-center text-sm text-gray-600">
          © 2025 Ontrackr. All rights reserved.
        </div>
      </div>
    </DashboardLayout>
  )
}
