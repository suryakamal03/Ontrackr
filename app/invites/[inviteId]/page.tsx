'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/backend/auth/authContext'
import { inviteService } from '@/backend/projects/inviteService'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { UserPlus, CheckCircle, XCircle, Loader } from 'lucide-react'

interface InvitePageProps {
  params: {
    inviteId: string
  }
}

export default function InvitePage({ params }: InvitePageProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const invite = await inviteService.getInvite(params.inviteId)
        
        if (!invite) {
          setError('Invite not found or has expired')
          setValidating(false)
          return
        }

        const validation = await inviteService.validateInvite(params.inviteId)
        
        if (!validation.valid) {
          setError(validation.reason || 'Invalid invite')
          setValidating(false)
          return
        }

        if (validation.projectId) {
          const { doc, getDoc } = await import('firebase/firestore')
          const { db } = await import('@/lib/firebase')
          const projectDoc = await getDoc(doc(db, 'projects', validation.projectId))
          if (projectDoc.exists()) {
            setProjectName(projectDoc.data().name)
          }
        }

        setValidating(false)
      } catch (err) {
        setError('Failed to validate invite')
        setValidating(false)
      } finally {
        setLoading(false)
      }
    }

    validateInvite()
  }, [params.inviteId])

  const handleAcceptInvite = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/invites/${params.inviteId}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId: params.inviteId,
          userId: user.uid
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to accept invite')
        return
      }

      setAccepted(true)
      
      setTimeout(() => {
        router.push('/projects')
      }, 2000)

    } catch (err) {
      setError('An error occurred while accepting the invite')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center">
            <Loader className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-gray-600">Validating invite...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/projects')}>
              Go to Projects
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to the Team!</h2>
            <p className="text-gray-600 mb-4">You have successfully joined {projectName}</p>
            <p className="text-sm text-gray-500">Redirecting to projects...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You've been invited!</h2>
          <p className="text-gray-600 mb-6">
            Join <span className="font-semibold">{projectName}</span> to collaborate with your team
          </p>

          {!user ? (
            <div className="w-full space-y-3">
              <p className="text-sm text-gray-500 mb-4">Please sign in to accept this invitation</p>
              <Button 
                className="w-full" 
                onClick={() => router.push(`/auth/login?redirect=/invites/${params.inviteId}`)}
              >
                Sign In
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => router.push(`/auth/signup?redirect=/invites/${params.inviteId}`)}
              >
                Create Account
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleAcceptInvite}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Accept Invitation'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
