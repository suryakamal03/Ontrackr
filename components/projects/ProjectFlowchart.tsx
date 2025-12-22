'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Sparkles, Download, Save, Trash2, Eye, Loader2, AlertCircle, Copy, Check } from 'lucide-react'
import { useAuth } from '@/backend/auth/authContext'
import { generateFlowchart } from '@/backend/integrations/geminiService'
import { flowchartService } from '@/backend/projects/flowchartService'
import { Flowchart } from '@/types'

interface ProjectFlowchartProps {
  projectId: string
}

export default function ProjectFlowchart({ projectId }: ProjectFlowchartProps) {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedDiagram, setGeneratedDiagram] = useState<string | null>(null)
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([])
  const [selectedFlowchart, setSelectedFlowchart] = useState<Flowchart | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingFlowcharts, setLoadingFlowcharts] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadFlowcharts()
  }, [projectId])

  const loadFlowcharts = async () => {
    try {
      setLoadingFlowcharts(true)
      const data = await flowchartService.getProjectFlowcharts(projectId)
      setFlowcharts(data)
    } catch (err) {
      console.error('Error loading flowcharts:', err)
    } finally {
      setLoadingFlowcharts(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your flowchart')
      return
    }

    setError(null)
    setGenerating(true)

    try {
      const result = await generateFlowchart(prompt)
      
      if (result.success && result.mermaidCode) {
        setGeneratedDiagram(result.mermaidCode)
        setSelectedFlowchart(null) // Clear any selected flowchart when generating new
      } else {
        setError(result.error || 'Failed to generate flowchart')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the flowchart')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedDiagram || !user) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const name = prompt.slice(0, 50) || 'Untitled Flowchart'
      const result = await flowchartService.createFlowchart(
        projectId,
        user.uid,
        name,
        prompt,
        generatedDiagram
      )

      if (result.success) {
        await loadFlowcharts()
        setPrompt('')
        setGeneratedDiagram(null)
      } else {
        setError(result.error || 'Failed to save flowchart')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (flowchartId: string) => {
    if (!confirm('Are you sure you want to delete this flowchart?')) {
      return
    }

    try {
      const result = await flowchartService.deleteFlowchart(flowchartId)
      if (result.success) {
        await loadFlowcharts()
        if (selectedFlowchart?.id === flowchartId) {
          setSelectedFlowchart(null)
        }
      } else {
        setError(result.error || 'Failed to delete flowchart')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting')
    }
  }

  const handleViewFlowchart = (flowchart: Flowchart) => {
    setSelectedFlowchart(flowchart)
    setGeneratedDiagram(null)
  }

  const handleClear = () => {
    setPrompt('')
    setGeneratedDiagram(null)
    setSelectedFlowchart(null)
    setError(null)
  }

  const handleCopyCode = async () => {
    if (displayDiagram) {
      await navigator.clipboard.writeText(displayDiagram)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayDiagram = generatedDiagram || selectedFlowchart?.diagramData

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Prompt Input Section */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            Generate Flowchart with AI
          </h2>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your process or workflow (e.g., 'User registration flow with email verification and password reset logic')"
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            disabled={generating}
          />
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3 mt-4">
            <Button 
              variant="secondary" 
              onClick={handleClear}
              disabled={generating || saving}
            >
              Clear
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Flowchart
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Display Area */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedFlowchart ? selectedFlowchart.name : 'Generated Flowchart'}
            </h2>
            {displayDiagram && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary"
                  size="sm" 
                  className="gap-2"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </Button>
                {generatedDiagram && (
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 min-h-96">
            {displayDiagram ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Mermaid Diagram Code</h3>
                  <p className="text-xs text-gray-500">Copy this code to use in Mermaid Live Editor or documentation</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap overflow-x-auto">
                    <code>{displayDiagram}</code>
                  </pre>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Copy this code and paste it into{' '}
                    <a 
                      href="https://mermaid.live" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Mermaid Live Editor
                    </a>
                    {' '}to visualize and edit your flowchart.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-96">
                <div className="text-center">
                  <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <p className="text-gray-500 text-lg font-medium">No flowchart yet</p>
                  <p className="text-gray-400 text-sm mt-2">Describe your workflow above and click "Generate Flowchart"</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Saved Flowcharts Sidebar */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Flowcharts</h2>
        
        {loadingFlowcharts ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : flowcharts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No saved flowcharts yet</p>
            <p className="text-xs text-gray-400 mt-1">Generate and save your first flowchart</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flowcharts.map((flowchart) => (
              <div 
                key={flowchart.id} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedFlowchart?.id === flowchart.id 
                    ? 'bg-primary-50 border-2 border-primary-500' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{flowchart.name}</p>
                  <p className="text-xs text-gray-500 truncate">{flowchart.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleViewFlowchart(flowchart)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(flowchart.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
