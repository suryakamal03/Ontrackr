import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ProjectInvite {
  id?: string;
  projectId: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: 'pending' | 'accepted' | 'expired';
  acceptedBy?: string;
  acceptedAt?: Timestamp;
}

export const inviteService = {
  async createInvite(projectId: string, createdBy: string): Promise<{ inviteId: string; inviteLink: string }> {
    const expirationDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const inviteData = {
      projectId,
      createdBy,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      status: 'pending' as const
    };

    const docRef = await addDoc(collection(db, 'invites'), inviteData);
    
    // Return just the invite ID, frontend will build the full URL
    return {
      inviteId: docRef.id,
      inviteLink: `/invites/${docRef.id}`
    };
  },

  async getInvite(inviteId: string): Promise<ProjectInvite | null> {
    const inviteDoc = await getDoc(doc(db, 'invites', inviteId));
    
    if (!inviteDoc.exists()) {
      return null;
    }

    return {
      id: inviteDoc.id,
      ...inviteDoc.data()
    } as ProjectInvite;
  },

  async validateInvite(inviteId: string): Promise<{ valid: boolean; reason?: string; projectId?: string }> {
    const invite = await this.getInvite(inviteId);

    if (!invite) {
      return { valid: false, reason: 'Invite not found' };
    }

    if (invite.status === 'accepted') {
      return { valid: false, reason: 'Invite already used' };
    }

    if (invite.status === 'expired') {
      return { valid: false, reason: 'Invite expired' };
    }

    const now = new Date();
    const expiresAt = invite.expiresAt.toDate();

    if (now > expiresAt) {
      await updateDoc(doc(db, 'invites', inviteId), {
        status: 'expired'
      });
      return { valid: false, reason: 'Invite expired' };
    }

    return { valid: true, projectId: invite.projectId };
  },

  async acceptInvite(inviteId: string, userId: string): Promise<{ success: boolean; message: string; projectId?: string }> {
    const validation = await this.validateInvite(inviteId);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.reason || 'Invalid invite'
      };
    }

    const invite = await this.getInvite(inviteId);
    if (!invite || !invite.projectId) {
      return {
        success: false,
        message: 'Invalid invite data'
      };
    }

    const projectRef = doc(db, 'projects', invite.projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return {
        success: false,
        message: 'Project not found'
      };
    }

    const projectData = projectDoc.data();
    if (projectData.members && projectData.members.includes(userId)) {
      return {
        success: false,
        message: 'You are already a member of this project'
      };
    }

    await updateDoc(projectRef, {
      members: arrayUnion(userId)
    });

    await updateDoc(doc(db, 'invites', inviteId), {
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Successfully joined the project',
      projectId: invite.projectId
    };
  },

  async getProjectMembers(projectId: string): Promise<Array<{ id: string; name: string; email: string; role?: string }>> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    
    if (!projectDoc.exists()) {
      return [];
    }

    const memberIds = projectDoc.data().members || [];
    const members = [];

    for (const memberId of memberIds) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        members.push({
          id: userDoc.id,
          name: userData.name || userData.email,
          email: userData.email,
          role: memberId === projectDoc.data().createdBy ? 'Owner' : 'Member'
        });
      }
    }

    return members;
  },

  async removeMember(projectId: string, userId: string, requestingUserId: string): Promise<{ success: boolean; message: string }> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));

    if (!projectDoc.exists()) {
      return { success: false, message: 'Project not found' };
    }

    const projectData = projectDoc.data();

    if (projectData.createdBy !== requestingUserId) {
      return { success: false, message: 'Only project owner can remove members' };
    }

    if (userId === projectData.createdBy) {
      return { success: false, message: 'Cannot remove project owner' };
    }

    const currentMembers = projectData.members || [];
    const updatedMembers = currentMembers.filter((id: string) => id !== userId);

    await updateDoc(doc(db, 'projects', projectId), {
      members: updatedMembers
    });

    return { success: true, message: 'Member removed successfully' };
  }
};
