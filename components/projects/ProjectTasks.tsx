'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import AddTaskModal from './AddTaskModal'
import TaskDetailsModal from './TaskDetailsModal'
import { Plus } from 'lucide-react'
import { taskService } from '@/backend/tasks/taskService'
import { inviteService } from '@/backend/projects/inviteService'
import { Task } from '@/types'

interface ProjectMember {
  id: string
  name: string
  email: string
  role?: string
}

interface ProjectTasksProps {
  projectId: string
}

export default function ProjectTasks({ projectId }: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [projectId])

  useEffect(() => {
    const unsubscribe = taskService.subscribeToProjectTasks(projectId, (updatedTasks) => {
      setTasks(updatedTasks)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [projectId])

  const loadMembers = async () => {
    try {
      const membersData = await inviteService.getProjectMembers(projectId)
      setMembers(membersData)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const filteredTasks = selectedMember
    ? tasks.filter(task => task.assignedTo === selectedMember)
    : tasks

  const taskGroups = {
    'To Do': filteredTasks.filter(t => t.status === 'To Do'),
    'In Review': filteredTasks.filter(t => t.status === 'In Review'),
    'Done': filteredTasks.filter(t => t.status === 'Done')
  }

  const getMemberName = (userId: string) => {
    return members.find(m => m.id === userId)?.name || 'Unknown'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Project Tasks</h2>
        <Button size="sm" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {members.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedMember(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedMember === null
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Members
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMember === member.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {member.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(taskGroups).map(([status, statusTasks]) => (
            <Card key={status} className="bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{status}</h3>
                <Badge variant="info">{statusTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-500 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignedToName || getMemberName(task.assignedTo)} size="sm" />
                        <span className="text-xs text-gray-600">
                          {task.assignedToName || getMemberName(task.assignedTo)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {statusTasks.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onTaskCreated={() => {}}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {}}
        />
      )}
    </div>
  )
}

