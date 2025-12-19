'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { X, Copy, Check, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '@/backend/auth/authContext'

interface InviteMemberModalProps {
  projectId: string
  projectName: string
  onClose: () => void
}

export default function InviteMemberModal({ projectId, projectName, onClose }: InviteMemberModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const generateInvite = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId: user.uid
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create invite')
        return
      }

      const fullLink = `${window.location.origin}/invites/${data.inviteId}`
      setInviteLink(fullLink)

    } catch (err) {
      setError('An error occurred while generating the invite link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Share this invite link with team members to join <span className="font-semibold">{projectName}</span>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!inviteLink ? (
              <Button
                onClick={generateInvite}
                disabled={loading}
                className="w-full gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                {loading ? 'Generating Link...' : 'Generate Invite Link'}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This invite link will expire in 7 days. Anyone with this link can join the project.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => setInviteLink('')}
                  className="w-full"
                >
                  Generate New Link
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
