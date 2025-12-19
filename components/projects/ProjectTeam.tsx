'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import InviteMemberModal from './InviteMemberModal'
import { UserPlus, Crown, Loader } from 'lucide-react'
import { inviteService } from '@/backend/projects/inviteService'
import { useAuth } from '@/backend/auth/authContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ProjectTeamProps {
  projectId: string
}

export default function ProjectTeam({ projectId }: ProjectTeamProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string; role?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    loadTeamMembers()
  }, [projectId])

  const loadTeamMembers = async () => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId))
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data()
        setProjectName(projectData.name)
        setIsOwner(user?.uid === projectData.createdBy)
      }

      const teamMembers = await inviteService.getProjectMembers(projectId)
      setMembers(teamMembers)
    } catch (error) {
      console.error('Failed to load team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!user || !window.confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      const result = await inviteService.removeMember(projectId, memberId, user.uid)
      
      if (result.success) {
        await loadTeamMembers()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert('Failed to remove member')
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Card>
    )
  }

  return (
    <>
      {showInviteModal && (
        <InviteMemberModal
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            {isOwner && (
              <Button
                onClick={() => setShowInviteModal(true)}
                className="gap-2"
                size="sm"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </Button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No team members yet</p>
              {isOwner && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="secondary"
                  className="mt-4 gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Your First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <Avatar name={member.name} size="lg" status />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      {member.role === 'Owner' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <Badge variant={member.role === 'Owner' ? 'warning' : 'info'}>
                    {member.role}
                  </Badge>
                  {isOwner && member.role !== 'Owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
