'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import AIAssistant from '@/components/projects/AIAssistant'
import ProjectTasks from '@/components/projects/ProjectTasks'
import ProjectGitHub from '@/components/projects/ProjectGitHub'
import ProjectTeam from '@/components/projects/ProjectTeam'
import ProjectRisks from '@/components/projects/ProjectRisks'
import FlowchartPreview from '@/components/projects/FlowchartPreview'
import WebhookConfig from '@/components/projects/WebhookConfig'
import { ChevronLeft, Settings, MoreVertical, Users, GitBranch, AlertTriangle, Workflow, MessageSquare, Webhook } from 'lucide-react'
import { Project } from '@/types'

interface ProjectDetailProps {
  project: Project
  onBack: () => void
}

export default function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const [showAI, setShowAI] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'github' | 'team' | 'risks' | 'flowchart' | 'webhook'>('tasks')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Projects
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        </div>
        <Button variant="secondary" className="gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        <Button
          onClick={() => setShowAI(!showAI)}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          AI Assistant
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center gap-3">
                {project.lead && (
                  <div className="flex items-center gap-2">
                    <Avatar name={project.lead.name} size="sm" />
                    <div>
                      <p className="text-xs text-gray-500">Project Lead</p>
                      <p className="text-sm font-medium text-gray-900">{project.lead.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={project.status === 'Active' ? 'success' : project.status === 'On Hold' ? 'warning' : 'info'}>
                    {project.status}
                  </Badge>
                  {project.health && (
                    <Badge variant={project.health === 'Healthy' ? 'success' : project.health === 'Warning' ? 'warning' : 'danger'}>
                      Health: {project.health}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Project Progress</span>
              <span className="text-sm font-medium text-gray-900">{project.progress || 0}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'github'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          GitHub Activity
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'team'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Team
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'risks'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Risks
        </button>
        <button
          onClick={() => setActiveTab('flowchart')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'flowchart'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Workflow className="w-4 h-4" />
          Flowchart
        </button>
        <button
          onClick={() => setActiveTab('webhook')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'webhook'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Webhook className="w-4 h-4" />
          Webhook Setup
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={showAI ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {activeTab === 'tasks' && <ProjectTasks projectId={project.id} />}
          {activeTab === 'github' && <ProjectGitHub projectId={project.id} />}
          {activeTab === 'team' && <ProjectTeam projectId={project.id} />}
          {activeTab === 'risks' && <ProjectRisks />}
          {activeTab === 'flowchart' && <FlowchartPreview />}
          {activeTab === 'webhook' && (
            <WebhookConfig 
              githubOwner={project.githubOwner || ''} 
              githubRepo={project.githubRepo || ''} 
            />
          )}
        </div>

        {showAI && (
          <div className="lg:col-span-1">
            <AIAssistant onClose={() => setShowAI(false)} />
          </div>
        )}
      </div>
    </div>
  )
}
