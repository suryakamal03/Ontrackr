'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { X } from 'lucide-react'
import { projectService } from '@/backend/projects/projectService'
import { useAuth } from '@/backend/auth/authContext'

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invalidEmails, setInvalidEmails] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubRepoUrl: '',
    memberEmails: '',
    deadlineInDays: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInvalidEmails([])

    if (!user) {
      setError('User not authenticated')
      return
    }

    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }

    if (!formData.githubRepoUrl.trim()) {
      setError('GitHub repository URL is required')
      return
    }

    const githubDetails = projectService.parseGithubUrl(formData.githubRepoUrl)
    if (!githubDetails) {
      setError('Invalid GitHub URL. Use format: https://github.com/owner/repo')
      return
    }

    setLoading(true)

    try {
      const emails = formData.memberEmails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0)

      const result = await projectService.createProject({
        name: formData.name,
        description: formData.description,
        githubRepoUrl: formData.githubRepoUrl,
        memberEmails: emails,
        createdBy: user.uid,
        deadlineInDays: formData.deadlineInDays ? parseInt(formData.deadlineInDays, 10) : undefined
      })

      if (result.invalidEmails.length > 0) {
        setInvalidEmails(result.invalidEmails)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {invalidEmails.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
              <p className="font-medium mb-1">Some emails were not found:</p>
              <ul className="list-disc list-inside">
                {invalidEmails.map(email => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">Project created without these members.</p>
            </div>
          )}

          <Input
            label="Project Name"
            type="text"
            placeholder="My Awesome Project"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Describe your project..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <Input
            label="GitHub Repository URL"
            type="url"
            placeholder="https://github.com/owner/repository"
            value={formData.githubRepoUrl}
            onChange={(e) => setFormData({ ...formData, githubRepoUrl: e.target.value })}
            disabled={loading}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Team Members
            </label>
            <textarea
              placeholder="Enter email addresses separated by commas&#10;example: john@email.com, jane@email.com"
              value={formData.memberEmails}
              onChange={(e) => setFormData({ ...formData, memberEmails: e.target.value })}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only registered users will be added to the project
            </p>
          </div>

          <Input
            label="Project Deadline (days)"
            type="number"
            placeholder="30"
            value={formData.deadlineInDays}
            onChange={(e) => setFormData({ ...formData, deadlineInDays: e.target.value })}
            disabled={loading}
            min="1"
          />

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
