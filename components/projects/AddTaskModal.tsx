'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { taskService } from '@/backend/tasks/taskService'
import { inviteService } from '@/backend/projects/inviteService'

interface AddTaskModalProps {
  projectId: string
  onClose: () => void
  onTaskCreated: () => void
}

interface ProjectMember {
  id: string
  name: string
  email: string
  role?: string
}

export default function AddTaskModal({ projectId, onClose, onTaskCreated }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [deadlineInDays, setDeadlineInDays] = useState('')
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProjectMembers()
  }, [projectId])

  const loadProjectMembers = async () => {
    try {
      setLoadingMembers(true)
      const membersData = await inviteService.getProjectMembers(projectId)
      setMembers(membersData)
    } catch (err) {
      setError('Failed to load project members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    if (!assignedTo) {
      setError('Please assign the task to a team member')
      return
    }

    setLoading(true)

    try {
      const selectedMember = members.find(m => m.id === assignedTo)
      
      await taskService.createTask({
        title: title.trim(),
        projectId,
        assignedTo,
        assignedToName: selectedMember?.name || '',
        deadlineInDays: deadlineInDays ? parseInt(deadlineInDays, 10) : undefined
      })

      onTaskCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Task Title"
            type="text"
            placeholder="Design dashboard UI"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            {loadingMembers ? (
              <div className="text-sm text-gray-500">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-red-500">No project members found</div>
            ) : (
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={loading}
                required
                aria-label="Assign task to team member"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            label="Task Deadline (days)"
            type="number"
            placeholder="7"
            value={deadlineInDays}
            onChange={(e) => setDeadlineInDays(e.target.value)}
            disabled={loading}
            min="1"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || loadingMembers}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
